// In-memory room registry. Players are placed automatically: a new window joins the oldest
// lobby that is not full, or starts a new room. Names are assigned, not chosen.
// Rules follow design/01-game-design.md section 8 and design/03-guardrails.md section 4.

import { randomUUID } from 'node:crypto';
import {
  MAX_PLAYERS,
  PLAYER_NAMES,
  ROOM_INACTIVITY_HOURS,
  ROUND_COUNT,
  type Phase,
  type PublicRoomState,
  type Result,
} from '@shisa-revenge/shared';
import { generateRoomCode } from './roomCode.js';
import { createSessionToken } from './sessionTokens.js';

export type PlayerRecord = {
  id: string;
  name: string;
  token: string;
  connected: boolean;
  joinedAt: number;
  // The socket that currently holds this seat. Null before the first bind.
  socketId: string | null;
};

export type RoomRecord = {
  code: string;
  phase: Phase;
  players: PlayerRecord[];
  lastActivityAt: number;
  // Lobby wait: when it ends, and whether any player may start the room now.
  startsAt: number | null;
  startAvailable: boolean;
};

export type EnterOutcome = {
  room: RoomRecord;
  player: PlayerRecord;
  reconnected: boolean;
};

export type RegistryOptions = {
  now?: () => number;
  newRoomCode?: () => string;
  newId?: () => string;
  newToken?: () => string;
  // Returns an integer in [0, exclusiveMax). Used for name assignment.
  randomInt?: (exclusiveMax: number) => number;
};

const INACTIVITY_MS = ROOM_INACTIVITY_HOURS * 60 * 60 * 1000;
const CODE_ATTEMPTS = 20;

export class RoomRegistry {
  private readonly rooms = new Map<string, RoomRecord>();
  private readonly now: () => number;
  private readonly newRoomCode: () => string;
  private readonly newId: () => string;
  private readonly newToken: () => string;
  private readonly randomInt: (exclusiveMax: number) => number;

  constructor(options: RegistryOptions = {}) {
    this.now = options.now ?? (() => Date.now());
    this.newRoomCode = options.newRoomCode ?? (() => generateRoomCode());
    this.newId = options.newId ?? (() => randomUUID());
    this.newToken = options.newToken ?? (() => createSessionToken());
    this.randomInt = options.randomInt ?? ((max) => Math.floor(Math.random() * max));
  }

  // Enters the game. A known token reclaims its seat. Otherwise the player joins the oldest
  // lobby with room left, or a new room starts.
  enter(token: string | undefined, socketId: string): Result<EnterOutcome> {
    if (token !== undefined) {
      const found = this.findByToken(token);
      if (found) {
        const { room, player } = found;
        const heldElsewhere =
          player.connected && player.socketId !== null && player.socketId !== socketId;
        if (heldElsewhere) return { ok: false, error: 'SEAT_IN_USE' };
        player.connected = true;
        room.lastActivityAt = this.now();
        return { ok: true, value: { room, player, reconnected: true } };
      }
    }

    const room = this.openLobby() ?? this.createRoom();
    const player = this.buildPlayer(this.assignName(room));
    room.players.push(player);
    room.lastActivityAt = this.now();
    return { ok: true, value: { room, player, reconnected: false } };
  }

  // True when a new player would join an existing lobby rather than start a room.
  hasOpenLobby(): boolean {
    return this.openLobby() !== undefined;
  }

  find(code: string): RoomRecord | undefined {
    return this.rooms.get(code);
  }

  // Removes a player from a lobby. Returns the room if it still exists.
  leave(code: string, playerId: string): RoomRecord | null {
    const room = this.rooms.get(code);
    if (!room) return null;

    room.players = room.players.filter((player) => player.id !== playerId);
    room.lastActivityAt = this.now();

    if (room.players.length === 0) {
      this.rooms.delete(code);
      return null;
    }
    return room;
  }

  setStartState(code: string, startsAt: number | null, startAvailable: boolean): void {
    const room = this.rooms.get(code);
    if (!room) return;
    room.startsAt = startsAt;
    room.startAvailable = startAvailable;
  }

  setPhase(code: string, phase: Phase): void {
    const room = this.rooms.get(code);
    if (!room) return;
    room.phase = phase;
    room.lastActivityAt = this.now();
  }

  // Records which socket now holds the seat.
  bindSocket(code: string, playerId: string, socketId: string): void {
    const room = this.rooms.get(code);
    const player = room?.players.find((candidate) => candidate.id === playerId);
    if (!room || !player) return;

    player.socketId = socketId;
    player.connected = true;
    room.lastActivityAt = this.now();
  }

  // The seat stays reserved. Only the connection is marked as gone.
  // A stale socket that the player already replaced cannot mark the seat as gone.
  markDisconnected(code: string, playerId: string, socketId: string): PlayerRecord | null {
    const room = this.rooms.get(code);
    const player = room?.players.find((candidate) => candidate.id === playerId);
    if (!room || !player || player.socketId !== socketId) return null;

    player.connected = false;
    room.lastActivityAt = this.now();
    return player;
  }

  // Removes rooms with no activity for the inactivity window. Returns the removed codes.
  expireIdle(): string[] {
    const cutoff = this.now() - INACTIVITY_MS;
    const expired: string[] = [];
    for (const [code, room] of this.rooms) {
      if (room.lastActivityAt < cutoff) {
        this.rooms.delete(code);
        expired.push(code);
      }
    }
    return expired;
  }

  toPublicState(room: RoomRecord): PublicRoomState {
    return {
      roomCode: room.code,
      phase: room.phase,
      round: 0,
      roundCount: ROUND_COUNT,
      startsAt: room.startsAt,
      startAvailable: room.startAvailable,
      players: room.players.map((player) => ({
        id: player.id,
        name: player.name,
        connected: player.connected,
      })),
      pairings: [],
      warmUpPlayerId: null,
      teamCounts: { survivors: 0, infected: 0 },
      secondsLeft: null,
      winner: null,
      originPlayerId: null,
      endgame: null,
    };
  }

  private findByToken(token: string): { room: RoomRecord; player: PlayerRecord } | undefined {
    for (const room of this.rooms.values()) {
      const player = room.players.find((candidate) => candidate.token === token);
      if (player) return { room, player };
    }
    return undefined;
  }

  // The oldest lobby that still has room. Rooms are kept in creation order.
  private openLobby(): RoomRecord | undefined {
    for (const room of this.rooms.values()) {
      if (room.phase === 'lobby' && room.players.length < MAX_PLAYERS) return room;
    }
    return undefined;
  }

  private createRoom(): RoomRecord {
    const code = this.uniqueRoomCode();
    const room: RoomRecord = {
      code,
      phase: 'lobby',
      players: [],
      lastActivityAt: this.now(),
      startsAt: null,
      startAvailable: false,
    };
    this.rooms.set(code, room);
    return room;
  }

  private buildPlayer(name: string): PlayerRecord {
    return {
      id: this.newId(),
      name,
      token: this.newToken(),
      connected: true,
      joinedAt: this.now(),
      socketId: null,
    };
  }

  // Picks a name no one in the room has. A room holds at most MAX_PLAYERS, and there are
  // as many names as that, so one is always free.
  private assignName(room: RoomRecord): string {
    const taken = new Set(room.players.map((player) => player.name));
    const free = PLAYER_NAMES.filter((name) => !taken.has(name));
    const name = free[this.randomInt(free.length)];
    if (name === undefined) throw new Error('No free player name');
    return name;
  }

  private uniqueRoomCode(): string {
    for (let attempt = 0; attempt < CODE_ATTEMPTS; attempt += 1) {
      const code = this.newRoomCode();
      if (!this.rooms.has(code)) return code;
    }
    throw new Error('Could not generate a unique room code');
  }
}

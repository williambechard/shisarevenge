// In-memory room registry. Holds membership, host, ready state, and seats.
// Rules here follow design/01-game-design.md section 8 and design/03-guardrails.md section 4.

import { randomUUID } from 'node:crypto';
import {
  MAX_PLAYERS,
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
  ready: boolean;
  connected: boolean;
  joinedAt: number;
  // The socket that currently holds this seat. Null before the first bind.
  socketId: string | null;
};

export type RoomRecord = {
  code: string;
  phase: Phase;
  hostId: string;
  players: PlayerRecord[];
  lastActivityAt: number;
};

export type JoinOutcome = {
  room: RoomRecord;
  player: PlayerRecord;
  reconnected: boolean;
};

export type CreateOutcome = {
  room: RoomRecord;
  player: PlayerRecord;
};

export type RegistryOptions = {
  now?: () => number;
  newRoomCode?: () => string;
  newId?: () => string;
  newToken?: () => string;
};

const INACTIVITY_MS = ROOM_INACTIVITY_HOURS * 60 * 60 * 1000;
const CODE_ATTEMPTS = 20;

export class RoomRegistry {
  private readonly rooms = new Map<string, RoomRecord>();
  private readonly now: () => number;
  private readonly newRoomCode: () => string;
  private readonly newId: () => string;
  private readonly newToken: () => string;

  constructor(options: RegistryOptions = {}) {
    this.now = options.now ?? (() => Date.now());
    this.newRoomCode = options.newRoomCode ?? (() => generateRoomCode());
    this.newId = options.newId ?? (() => randomUUID());
    this.newToken = options.newToken ?? (() => createSessionToken());
  }

  create(name: string): CreateOutcome {
    const code = this.uniqueRoomCode();
    const player = this.buildPlayer(name, true);
    const room: RoomRecord = {
      code,
      phase: 'lobby',
      hostId: player.id,
      players: [player],
      lastActivityAt: this.now(),
    };
    this.rooms.set(code, room);
    return { room, player };
  }

  find(code: string): RoomRecord | undefined {
    return this.rooms.get(code);
  }

  join(code: string, name: string, token?: string): Result<JoinOutcome> {
    const room = this.rooms.get(code);
    if (!room) return { ok: false, error: 'ROOM_NOT_FOUND' };

    // A known session token reclaims its seat, even after the match has started.
    if (token !== undefined) {
      const existing = room.players.find((player) => player.token === token);
      if (existing) {
        existing.connected = true;
        room.lastActivityAt = this.now();
        return { ok: true, value: { room, player: existing, reconnected: true } };
      }
    }

    if (room.phase !== 'lobby') return { ok: false, error: 'GAME_IN_PROGRESS' };
    if (room.players.length >= MAX_PLAYERS) return { ok: false, error: 'ROOM_FULL' };

    const player = this.buildPlayer(name, false);
    room.players.push(player);
    room.lastActivityAt = this.now();
    return { ok: true, value: { room, player, reconnected: false } };
  }

  // Removes a player from the lobby. Returns the room if it still exists.
  leave(code: string, playerId: string): RoomRecord | null {
    const room = this.rooms.get(code);
    if (!room) return null;

    room.players = room.players.filter((player) => player.id !== playerId);
    room.lastActivityAt = this.now();

    if (room.players.length === 0) {
      this.rooms.delete(code);
      return null;
    }

    if (room.hostId === playerId) {
      room.hostId = this.longestConnected(room).id;
    }
    return room;
  }

  setReady(code: string, playerId: string, ready: boolean): Result<RoomRecord> {
    const room = this.rooms.get(code);
    if (!room) return { ok: false, error: 'ROOM_NOT_FOUND' };
    if (room.phase !== 'lobby') return { ok: false, error: 'WRONG_PHASE' };

    const player = room.players.find((candidate) => candidate.id === playerId);
    if (!player) return { ok: false, error: 'ROOM_NOT_FOUND' };

    player.ready = ready;
    room.lastActivityAt = this.now();
    return { ok: true, value: room };
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
      players: room.players.map((player) => ({
        id: player.id,
        name: player.name,
        ready: player.ready,
        connected: player.connected,
        isHost: player.id === room.hostId,
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

  private buildPlayer(name: string, ready: boolean): PlayerRecord {
    return {
      id: this.newId(),
      name,
      token: this.newToken(),
      ready,
      connected: true,
      joinedAt: this.now(),
      socketId: null,
    };
  }

  private uniqueRoomCode(): string {
    for (let attempt = 0; attempt < CODE_ATTEMPTS; attempt += 1) {
      const code = this.newRoomCode();
      if (!this.rooms.has(code)) return code;
    }
    throw new Error('Could not generate a unique room code');
  }

  // New host: the connected player who joined earliest. Falls back to anyone left.
  private longestConnected(room: RoomRecord): PlayerRecord {
    const byJoin = (a: PlayerRecord, b: PlayerRecord) => a.joinedAt - b.joinedAt;
    const connected = room.players.filter((player) => player.connected).sort(byJoin);
    const fallback = [...room.players].sort(byJoin);
    const next = connected[0] ?? fallback[0];
    if (!next) throw new Error('Room has no players');
    return next;
  }
}

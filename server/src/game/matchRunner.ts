// Runs the numbered-card duel for each room: start, pairing, selection, reveal, next round.
// It owns the timers and sends events. Rules live in gameEngine.ts.
// Design: design/04-game-rules.md sections 4 to 6 and design/08-socket-contract.md sections 4 and 5.

import type { Server } from 'socket.io';
import {
  LOBBY_START_WAIT_SECONDS,
  MAX_PLAYERS,
  MIN_PLAYERS,
  ROUND_COUNT,
  SELECTION_SECONDS,
  type CardValue,
  type ErrorCode,
  type Phase,
  type PublicRoomState,
  type Team,
} from '@shisa-revenge/shared';
import type { RoomRecord, RoomRegistry } from '../rooms/roomRegistry.js';
import {
  autoLockUnlocked,
  beginRound,
  createMatch,
  isPairLocked,
  isPairResolved,
  opponentOf,
  pairOf,
  pairRound,
  revealPair,
  submitSelection,
  type DuelResult,
  type MatchState,
  type Pair,
} from './gameEngine.js';
import type { RandomFn } from './pairing.js';

export type MatchTiming = {
  announceMs: number;
  selectionMs: number;
  resultMs: number;
  lobbyWaitMs: number;
};

export const DEFAULT_TIMING: MatchTiming = {
  announceMs: 3000,
  selectionMs: SELECTION_SECONDS * 1000,
  resultMs: 6000,
  lobbyWaitMs: LOBBY_START_WAIT_SECONDS * 1000,
};

type Timer = ReturnType<typeof setTimeout>;

type RoomMatch = {
  state: MatchState;
  timer: Timer | null;
};

type Clock = {
  setTimeout: (callback: () => void, ms: number) => Timer;
  clearTimeout: (handle: Timer) => void;
};

export type MatchRunnerOptions = {
  timing?: Partial<MatchTiming>;
  random?: RandomFn;
  clock?: Clock;
};

const defaultClock: Clock = {
  setTimeout: (callback, ms) => setTimeout(callback, ms),
  clearTimeout: (handle) => {
    clearTimeout(handle);
  },
};

export type MatchResult = { ok: true } | { ok: false; error: ErrorCode };

export class MatchRunner {
  private readonly matches = new Map<string, RoomMatch>();
  private readonly lobbyTimers = new Map<string, Timer>();
  // Lobbies whose wait has ended. Start is offered while the count is even.
  private readonly waitElapsed = new Set<string>();
  private readonly timing: MatchTiming;
  private readonly random: RandomFn;
  private readonly clock: Clock;

  constructor(
    private readonly io: Server,
    private readonly registry: RoomRegistry,
    options: MatchRunnerOptions = {},
  ) {
    this.timing = { ...DEFAULT_TIMING, ...options.timing };
    this.random = options.random ?? Math.random;
    this.clock = options.clock ?? defaultClock;
  }

  // Starts the match once the room is full. The origin is chosen at random.
  start(code: string): MatchResult {
    const room = this.registry.find(code);
    if (!room) return { ok: false, error: 'ROOM_NOT_FOUND' };
    if (room.phase !== 'lobby') return { ok: false, error: 'WRONG_PHASE' };
    if (room.players.length < MIN_PLAYERS || room.players.length > MAX_PLAYERS) {
      return { ok: false, error: 'WRONG_PHASE' };
    }
    this.clearLobbyTimer(code);
    this.waitElapsed.delete(code);

    const originIndex = Math.floor(this.random() * room.players.length);
    const origin = room.players[originIndex];
    if (!origin) return { ok: false, error: 'INTERNAL' };

    const players = room.players.map((player) => ({
      id: player.id,
      team: player.id === origin.id ? ('infected' as const) : ('survivor' as const),
    }));

    this.matches.set(code, { state: createMatch(players), timer: null });
    this.io.to(code).emit('game:started', { originPlayerId: origin.id });
    this.startRound(code);
    return { ok: true };
  }
  // Records one lock-in. When both players of a duel have locked in, that duel reveals.
  submit(code: string, playerId: string, value: CardValue): MatchResult {
    const match = this.matches.get(code);
    if (!match) return { ok: false, error: 'WRONG_PHASE' };

    const result = submitSelection(match.state, playerId, value);
    if (!result.ok) return result;

    match.state = result.value;
    const opponentId = opponentOf(match.state, playerId);
    this.emitToPlayer(code, playerId, 'encounter:waiting', { opponentId, locked: true });
    this.syncPrivate(code);

    const pair = pairOf(match.state, playerId);
    if (pair && isPairLocked(match.state, pair)) this.revealDuel(code, pair);
    return { ok: true };
  }

  roomPhase(code: string): Phase | undefined {
    return this.registry.find(code)?.phase;
  }

  // Called after anyone enters or leaves a lobby. A full room starts now. A room of at least
  // MIN_PLAYERS starts a wait. When the wait ends, any player may start the room, provided the
  // count is even, so nobody sits out a Warm-Up.
  lobbyChanged(code: string): void {
    const room = this.registry.find(code);
    if (!room) {
      this.clearLobbyTimer(code);
      this.waitElapsed.delete(code);
      return;
    }
    if (room.phase !== 'lobby') return;

    const count = room.players.length;
    if (count >= MAX_PLAYERS) {
      this.start(code);
      return;
    }

    if (count < MIN_PLAYERS) {
      this.clearLobbyTimer(code);
      this.waitElapsed.delete(code);
      this.registry.setStartState(code, null, false);
      this.broadcastRoomByCode(code);
      return;
    }

    if (this.lobbyTimers.has(code) || this.waitElapsed.has(code)) {
      this.refreshAvailability(code);
      return;
    }

    const startsAt = Date.now() + this.timing.lobbyWaitMs;
    this.registry.setStartState(code, startsAt, false);
    this.broadcastRoomByCode(code);
    const handle = this.clock.setTimeout(() => {
      this.lobbyTimers.delete(code);
      this.waitElapsed.add(code);
      this.refreshAvailability(code);
    }, this.timing.lobbyWaitMs);
    this.lobbyTimers.set(code, handle);
  }

  // Start is offered only after the wait, with an even count from MIN_PLAYERS to 6.
  private refreshAvailability(code: string): void {
    const room = this.registry.find(code);
    if (!room) return;
    const count = room.players.length;
    const available =
      this.waitElapsed.has(code) && count >= MIN_PLAYERS && count < MAX_PLAYERS && count % 2 === 0;
    // Once the wait has ended, the countdown is cleared. The client then shows the odd-count message.
    const startsAt = this.waitElapsed.has(code) ? null : room.startsAt;
    this.registry.setStartState(code, startsAt, available);
    this.broadcastRoomByCode(code);
  }
  // A player chose to start a room with fewer than MAX_PLAYERS. Only allowed after the wait.
  startNow(code: string): MatchResult {
    const room = this.registry.find(code);
    if (!room) return { ok: false, error: 'ROOM_NOT_FOUND' };
    if (room.phase !== 'lobby' || !room.startAvailable) return { ok: false, error: 'WRONG_PHASE' };
    return this.start(code);
  }

  private clearLobbyTimer(code: string): void {
    const handle = this.lobbyTimers.get(code);
    if (handle) this.clock.clearTimeout(handle);
    this.lobbyTimers.delete(code);
  }

  private broadcastRoomByCode(code: string): void {
    const room = this.registry.find(code);
    if (room) this.broadcastRoom(code, room);
  }
  dispose(code: string): void {
    this.clearLobbyTimer(code);
    const match = this.matches.get(code);
    if (match?.timer) this.clock.clearTimeout(match.timer);
    this.matches.delete(code);
  }

  // Brings a player who just rejoined up to date: the game screen, pairings, and their private state.
  resync(code: string, playerId: string): void {
    const match = this.matches.get(code);
    const room = this.registry.find(code);
    const seat = room?.players.find((player) => player.id === playerId);
    if (!match || !seat?.socketId) return;

    const state = match.state;
    this.io.to(seat.socketId).emit('game:started', { originPlayerId: null });
    if (state.pairs.length > 0) {
      this.io.to(seat.socketId).emit('round:paired', {
        round: state.round,
        pairings: state.pairs.map(([a, b]) => ({ a, b })),
        warmUpPlayerId: state.warmUpId,
      });
    }
    this.syncPrivate(code);
  }
  disposeAll(): void {
    for (const code of [...this.lobbyTimers.keys()]) this.clearLobbyTimer(code);
    for (const code of [...this.matches.keys()]) this.dispose(code);
  }

  private current(code: string): MatchState {
    const match = this.matches.get(code);
    if (!match) throw new Error(`No match for room ${code}`);
    return match.state;
  }

  private setState(code: string, state: MatchState): void {
    const match = this.matches.get(code);
    if (match) match.state = state;
  }

  private setPhase(code: string, phase: Phase): void {
    this.registry.setPhase(code, phase);
    const room = this.registry.find(code);
    if (room) this.broadcastRoom(code, room);
  }

  private startRound(code: string): void {
    this.setState(code, beginRound(this.current(code)));
    this.setPhase(code, 'announce');
    this.schedule(code, this.timing.announceMs, () => {
      this.openSelection(code);
    });
  }

  private openSelection(code: string): void {
    this.setState(code, pairRound(this.current(code), this.random));
    const state = this.current(code);
    this.io.to(code).emit('round:paired', {
      round: state.round,
      pairings: state.pairs.map(([a, b]) => ({ a, b })),
      warmUpPlayerId: state.warmUpId,
    });
    this.setPhase(code, 'selecting');
    this.syncPrivate(code);
    this.schedule(code, this.timing.selectionMs, () => {
      this.timeOut(code);
    });
  }

  // Selection timer ran out. Players who have not locked in get their lowest card.
  private timeOut(code: string): void {
    const before = this.current(code).locked;
    const next = autoLockUnlocked(this.current(code));
    this.setState(code, next);
    for (const [playerId] of next.locked) {
      if (!before.has(playerId)) {
        this.emitToPlayer(code, playerId, 'player:notice', { kind: 'auto-locked' });
      }
    }
    this.syncPrivate(code);
    for (const pair of this.current(code).pairs) {
      if (!isPairResolved(this.current(code), pair)) this.revealDuel(code, pair);
    }
  }

  // Resolves one duel and sends its result to its two players only.
  private revealDuel(code: string, pair: Pair): void {
    if (!isPairLocked(this.current(code), pair)) return;

    const next = revealPair(this.current(code), pair);
    this.setState(code, next);
    const result = next.results.find(
      (entry) => entry.pair[0] === pair[0] && entry.pair[1] === pair[1],
    );
    if (!result) return;

    this.sendDuel(code, result);
    this.registry.setPhase(code, next.phase === 'resolved' ? 'resolved' : 'revealed');
    this.syncPrivate(code);

    if (next.phase === 'resolved') {
      this.finishRound(code);
    }
  }

  private sendDuel(code: string, result: DuelResult): void {
    const [a, b] = result.pair;
    const [valueA, valueB] = result.values;
    const round = this.current(code).round;
    const winner = result.outcome.winnerId;

    this.emitToPlayer(code, a, 'encounter:revealed', {
      myValue: valueA,
      opponentValue: valueB,
      mySpecial: null,
      opponentSpecial: null,
    });
    this.emitToPlayer(code, b, 'encounter:revealed', {
      myValue: valueB,
      opponentValue: valueA,
      mySpecial: null,
      opponentSpecial: null,
    });
    this.emitToPlayer(
      code,
      a,
      'encounter:result',
      duelOutcome(round, a, b, valueA, valueB, winner),
    );
    this.emitToPlayer(
      code,
      b,
      'encounter:result',
      duelOutcome(round, b, a, valueB, valueA, winner),
    );
  }

  // Every duel is resolved. Announce the round, then start the next one or end the match.
  private finishRound(code: string): void {
    this.cancelTimer(code);
    const state = this.current(code);
    const caughtCount = state.results.filter((entry) => entry.outcome.caughtCold !== null).length;

    this.io.to(code).emit('round:ended', {
      round: state.round,
      teamCounts: teamCounts(state),
      caughtCount,
      recoveredCount: 0,
    });
    this.setPhase(code, 'resolved');

    // Team changes and the endgame are added in plan 04.
    this.schedule(code, this.timing.resultMs, () => {
      if (state.round >= ROUND_COUNT) {
        this.setPhase(code, 'ended');
        return;
      }
      this.startRound(code);
    });
  }

  private syncPrivate(code: string): void {
    const room = this.registry.find(code);
    const match = this.matches.get(code);
    if (!room || !match) return;

    for (const player of match.state.players) {
      const opponentId = opponentOf(match.state, player.id);
      const seat = room.players.find((candidate) => candidate.id === player.id);
      if (!seat || seat.socketId === null) continue;

      this.io.to(seat.socketId).emit('player:private-state', {
        playerId: player.id,
        team: player.team,
        hand: player.hand,
        special: null,
        encounter: opponentId
          ? {
              opponentId,
              selectionLocked: match.state.locked.has(player.id),
              lastResult: null,
            }
          : null,
        notices: [],
      });
    }
  }

  private emitToPlayer(code: string, playerId: string, event: string, payload: unknown): void {
    const room: RoomRecord | undefined = this.registry.find(code);
    const seat = room?.players.find((player) => player.id === playerId);
    if (seat?.socketId) this.io.to(seat.socketId).emit(event, payload);
  }

  private broadcastRoom(code: string, room: RoomRecord): void {
    this.io.to(code).emit('room:state', this.registry.toPublicState(room));
  }

  private schedule(code: string, ms: number, callback: () => void): void {
    this.cancelTimer(code);
    const handle = this.clock.setTimeout(() => {
      const match = this.matches.get(code);
      if (match) match.timer = null;
      callback();
    }, ms);
    const match = this.matches.get(code);
    if (match) match.timer = handle;
  }

  private cancelTimer(code: string): void {
    const match = this.matches.get(code);
    if (match?.timer) {
      this.clock.clearTimeout(match.timer);
      match.timer = null;
    }
  }
}

function duelOutcome(
  round: number,
  me: string,
  opponent: string,
  myValue: CardValue,
  opponentValue: CardValue,
  winnerId: string | null,
) {
  const result = winnerId === null ? 'tie' : winnerId === me ? 'won' : 'lost';
  return {
    round,
    opponentId: opponent,
    myValue,
    opponentValue,
    mySpecial: null,
    opponentSpecial: null,
    result,
  };
}

function teamCounts(state: MatchState): PublicRoomState['teamCounts'] {
  const counts = { survivors: 0, infected: 0 };
  for (const player of state.players) {
    const team: Team = player.team;
    if (team === 'infected') counts.infected += 1;
    else counts.survivors += 1;
  }
  return counts;
}

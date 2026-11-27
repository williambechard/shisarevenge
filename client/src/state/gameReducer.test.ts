import { describe, expect, it } from 'vitest';
import type { CardValue, PublicRoomState } from '@shisa-revenge/shared';
import { createInitialState } from './gameState.js';
import { gameReducer } from './gameReducer.js';

function room(code: string): PublicRoomState {
  return {
    roomCode: code,
    phase: 'lobby',
    round: 0,
    roundCount: 5,
    players: [],
    startsAt: null,
    startAvailable: false,
    pairings: [],
    warmUpPlayerId: null,
    teamCounts: { survivors: 0, infected: 0 },
    secondsLeft: null,
    winner: null,
    originPlayerId: null,
    endgame: null,
    village: null,
  };
}

function joinedState() {
  return gameReducer(createInitialState(), {
    type: 'joined',
    roomCode: 'ABCDEF',
    playerId: 'p1',
    name: 'Sandy Shikuwasa',
  });
}

describe('lobby state', () => {
  it('starts in the lobby and records the assigned name on join', () => {
    const state = joinedState();
    expect(state.screen).toBe('lobby');
    expect(state.name).toBe('Sandy Shikuwasa');
    expect(state.roomCode).toBe('ABCDEF');
  });

  it('applies room state for the current room', () => {
    const next = gameReducer(joinedState(), { type: 'room-state', room: room('ABCDEF') });
    expect(next.room?.roomCode).toBe('ABCDEF');
  });

  it('ignores room state for a room the client has left', () => {
    const next = gameReducer(joinedState(), { type: 'room-state', room: room('ZZZZZZ') });
    expect(next.room).toBeNull();
  });

  it('clears the seat on leave and keeps the connection state', () => {
    const connected = { ...joinedState(), connection: 'connected' as const };
    const next = gameReducer(connected, { type: 'left' });
    expect(next.roomCode).toBeNull();
    expect(next.playerId).toBeNull();
    expect(next.name).toBeNull();
    expect(next.connection).toBe('connected');
  });
});

describe('round state', () => {
  it('opens the round screen on game start and clears the selection', () => {
    const selected = { ...joinedState(), selected: { type: 'number' as const, value: 3 as const } };
    const next = gameReducer(selected, { type: 'game-started' });
    expect(next.screen).toBe('round');
    expect(next.selected).toBeNull();
  });

  it('keeps a selected card until the next round is paired', () => {
    const state = { ...joinedState(), selected: { type: 'number' as const, value: 4 as const } };
    expect(gameReducer(state, { type: 'select', card: { type: 'special' } }).selected).toEqual({
      type: 'special',
    });
    const paired = gameReducer(
      { ...state, selected: { type: 'special' as const } },
      { type: 'round-paired', round: 1, pairings: [], warmUpPlayerId: null, deadline: 1 },
    );
    expect(paired.selected).toBeNull();
    expect(paired.roundView?.round).toBe(1);
  });

  it('records a reveal', () => {
    const revealed = gameReducer(joinedState(), {
      type: 'revealed',
      myValue: 5,
      opponentValue: 2,
      mySpecial: 'shisa-mask',
      opponentSpecial: null,
    });
    expect(revealed.reveal).toEqual({
      myValue: 5,
      opponentValue: 2,
      mySpecial: 'shisa-mask',
      opponentSpecial: null,
    });
  });
});

describe('endgame and round summary', () => {
  it('records the round summary for the announcement', () => {
    const next = gameReducer(joinedState(), { type: 'round-ended', round: 2, caughtCount: 1 });
    expect(next.roundSummary).toEqual({ round: 2, caughtCount: 1 });
  });

  it('opens the endgame overview when the game ends', () => {
    const summary = {
      winner: 'infected' as const,
      survivors: 0,
      infected: 4,
      originPlayerId: 'p1',
      history: [{ playerId: 'p1', transformations: [] }],
    };
    const next = gameReducer(joinedState(), { type: 'game-ended', summary });
    expect(next.screen).toBe('endgame');
    expect(next.endgame).toEqual(summary);
  });

  it('shows the special notice until the next round is paired', () => {
    const caught = gameReducer(joinedState(), {
      type: 'special-notice',
      notice: { kind: 'caught-cold', lostSpecial: 'ramen', newSpecial: 'shisa-mask' },
    });
    expect(caught.specialNotice).toEqual({
      kind: 'caught-cold',
      lostSpecial: 'ramen',
      newSpecial: 'shisa-mask',
    });
    const next = gameReducer(caught, {
      type: 'round-paired',
      round: 2,
      pairings: [],
      warmUpPlayerId: null,
      deadline: 1,
    });
    expect(next.specialNotice).toBeNull();
  });
});

describe('locked card on the table', () => {
  it('puts the card on the table when it is locked and clears it on unlock', () => {
    const locked = gameReducer(joinedState(), { type: 'lock', card: { type: 'number', value: 3 } });
    expect(locked.lockedCard).toEqual({ type: 'number', value: 3 });
    expect(gameReducer(locked, { type: 'unlock' }).lockedCard).toBeNull();
  });

  it('clears the locked card when the next round is paired', () => {
    const locked = gameReducer(joinedState(), { type: 'lock', card: { type: 'special' } });
    const next = gameReducer(locked, {
      type: 'round-paired',
      round: 2,
      pairings: [],
      warmUpPlayerId: null,
      deadline: 1,
    });
    expect(next.lockedCard).toBeNull();
  });

  it('shows the lowest number in the hand when the server auto-locks', () => {
    const withHand = {
      ...joinedState(),
      privateState: {
        playerId: 'p1',
        team: 'survivor' as const,
        origin: false,
        hand: [4, 2, 5] as CardValue[],
        special: null,
        pendingPick: null,
        encounter: null,
        notices: [],
      },
    };
    const next = gameReducer(withHand, { type: 'auto-locked' });
    expect(next.autoLocked).toBe(true);
    expect(next.lockedCard).toEqual({ type: 'number', value: 2 });
  });
});

describe('gained card moment', () => {
  it('records a gained card with a new nonce each time, and clears it when done', () => {
    const first = gameReducer(joinedState(), { type: 'card-gained', value: 4 });
    expect(first.gained).toEqual({ value: 4, nonce: 1 });
    const second = gameReducer(first, { type: 'card-gained', value: 4 });
    expect(second.gained?.nonce).toBe(2);
    expect(gameReducer(second, { type: 'gained-done' }).gained).toBeNull();
  });
});

describe('entering a round fresh', () => {
  it('clears last round text when the room enters the announce step', () => {
    const start = {
      ...createInitialState(),
      roomCode: 'ABC123',
      playerId: 'p1',
      screen: 'round' as const,
      specialNotice: { kind: 'eliminated' } as never,
      roundSummary: { round: 1, caughtCount: 2 },
      notice: 'Old village message',
    };
    const next = gameReducer(start, {
      type: 'room-state',
      room: { ...room('ABC123'), phase: 'announce', round: 2 },
    });
    expect(next.specialNotice).toBeNull();
    expect(next.roundSummary).toBeNull();
    expect(next.notice).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import type { PublicRoomState } from '@shisa-revenge/shared';
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
    const selected = { ...joinedState(), selected: 3 as const };
    const next = gameReducer(selected, { type: 'game-started' });
    expect(next.screen).toBe('round');
    expect(next.selected).toBeNull();
  });

  it('keeps a selected card until the next round is paired', () => {
    const state = { ...joinedState(), selected: 4 as const };
    expect(gameReducer(state, { type: 'select', value: 2 }).selected).toBe(2);
    const paired = gameReducer(
      { ...state, selected: 2 },
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
    });
    expect(revealed.reveal).toEqual({ myValue: 5, opponentValue: 2 });
  });
});

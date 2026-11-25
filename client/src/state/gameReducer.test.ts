import { describe, expect, it } from 'vitest';
import type { PublicRoomState } from '@shisa-revenge/shared';
import { createInitialState, prefillCodeFrom } from './gameState.js';
import { gameReducer } from './gameReducer.js';

function room(code: string): PublicRoomState {
  return {
    roomCode: code,
    phase: 'lobby',
    round: 0,
    roundCount: 5,
    players: [],
    pairings: [],
    warmUpPlayerId: null,
    teamCounts: { survivors: 0, infected: 0 },
    secondsLeft: null,
    winner: null,
    originPlayerId: null,
    endgame: null,
  };
}

describe('gameReducer', () => {
  it('moves to the lobby when the server confirms a seat', () => {
    const next = gameReducer(createInitialState(''), {
      type: 'joined',
      roomCode: 'ABCDEF',
      playerId: 'p1',
    });
    expect(next.screen).toBe('lobby');
    expect(next.roomCode).toBe('ABCDEF');
    expect(next.playerId).toBe('p1');
  });

  it('applies room state for the current room', () => {
    const joined = gameReducer(createInitialState(''), {
      type: 'joined',
      roomCode: 'ABCDEF',
      playerId: 'p1',
    });
    const next = gameReducer(joined, { type: 'room-state', room: room('ABCDEF') });
    expect(next.room?.roomCode).toBe('ABCDEF');
  });

  it('ignores room state for a room the client has left', () => {
    const joined = gameReducer(createInitialState(''), {
      type: 'joined',
      roomCode: 'ABCDEF',
      playerId: 'p1',
    });
    const next = gameReducer(joined, { type: 'room-state', room: room('ZZZZZZ') });
    expect(next.room).toBeNull();
  });

  it('returns to the landing screen after leaving', () => {
    const joined = gameReducer(createInitialState(''), {
      type: 'joined',
      roomCode: 'ABCDEF',
      playerId: 'p1',
    });
    const next = gameReducer(joined, { type: 'left' });
    expect(next.screen).toBe('landing');
    expect(next.roomCode).toBeNull();
    expect(next.playerId).toBeNull();
  });
});

describe('prefillCodeFrom', () => {
  it('reads and uppercases the room code from the URL', () => {
    expect(prefillCodeFrom('?room=abc123')).toBe('ABC123');
    expect(prefillCodeFrom('')).toBe('');
  });
});

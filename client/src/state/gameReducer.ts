// Applies server events and UI actions to the client state. It never decides game outcomes.

import type { PublicRoomState } from '@shisa-revenge/shared';
import type { ConnectionState, GameState, Screen } from './gameState.js';

export type GameAction =
  | { type: 'connection'; connection: ConnectionState }
  | { type: 'joined'; roomCode: string; playerId: string }
  | { type: 'room-state'; room: PublicRoomState }
  | { type: 'navigate'; screen: Screen }
  | { type: 'left' }
  | { type: 'notice'; message: string | null };

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'connection':
      return { ...state, connection: action.connection };

    case 'joined':
      return {
        ...state,
        screen: 'lobby',
        roomCode: action.roomCode,
        playerId: action.playerId,
        notice: null,
      };

    case 'room-state':
      // Ignore state for a room this client has already left.
      if (state.roomCode !== action.room.roomCode) return state;
      return { ...state, room: action.room };

    case 'navigate':
      return { ...state, screen: action.screen, notice: null };

    case 'left':
      return {
        ...state,
        screen: 'landing',
        room: null,
        roomCode: null,
        playerId: null,
        notice: null,
      };

    case 'notice':
      return { ...state, notice: action.message };
  }
}

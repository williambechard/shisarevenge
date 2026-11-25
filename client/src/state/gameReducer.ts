// Applies server events and UI actions to the client state. It never decides game outcomes.

import type {
  CardValue,
  DuelOutcome,
  EndgameSummary,
  PrivatePlayerState,
  PublicRoomState,
} from '@shisa-revenge/shared';
import {
  createInitialState,
  type ConnectionState,
  type GameState,
  type Pairing,
} from './gameState.js';

export type GameAction =
  | { type: 'connection'; connection: ConnectionState }
  | { type: 'joined'; roomCode: string; playerId: string; name: string }
  | { type: 'room-state'; room: PublicRoomState }
  | { type: 'left' }
  | { type: 'notice'; message: string | null }
  | { type: 'game-started' }
  | {
      type: 'round-paired';
      round: number;
      pairings: Pairing[];
      warmUpPlayerId: string | null;
      deadline: number;
    }
  | { type: 'private-state'; state: PrivatePlayerState }
  | { type: 'revealed'; myValue: CardValue; opponentValue: CardValue }
  | { type: 'duel-result'; outcome: DuelOutcome }
  | { type: 'auto-locked' }
  | { type: 'select'; value: CardValue }
  | { type: 'round-ended'; round: number; caughtCount: number }
  | { type: 'caught' }
  | { type: 'game-ended'; summary: EndgameSummary };

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'connection':
      return { ...state, connection: action.connection };

    case 'joined':
      return {
        ...state,
        roomCode: action.roomCode,
        playerId: action.playerId,
        name: action.name,
        notice: null,
      };

    case 'room-state':
      // Ignore state for a room this client has already left.
      if (state.roomCode !== action.room.roomCode) return state;
      return { ...state, room: action.room };

    case 'left':
      return {
        ...createInitialState(),
        connection: state.connection,
      };

    case 'notice':
      return { ...state, notice: action.message };

    case 'game-started':
      return {
        ...state,
        screen: 'round',
        reveal: null,
        duel: null,
        autoLocked: false,
        selected: null,
        roundSummary: null,
        caughtNotice: false,
        endgame: null,
      };

    case 'round-paired':
      return {
        ...state,
        roundView: {
          round: action.round,
          pairings: action.pairings,
          warmUpPlayerId: action.warmUpPlayerId,
          deadline: action.deadline,
        },
        reveal: null,
        duel: null,
        autoLocked: false,
        selected: null,
        roundSummary: null,
        caughtNotice: false,
      };

    case 'private-state':
      return { ...state, privateState: action.state };

    case 'revealed':
      return { ...state, reveal: { myValue: action.myValue, opponentValue: action.opponentValue } };

    case 'duel-result':
      return { ...state, duel: action.outcome };

    case 'auto-locked':
      return { ...state, autoLocked: true };

    case 'select':
      return { ...state, selected: action.value };

    case 'round-ended':
      return { ...state, roundSummary: { round: action.round, caughtCount: action.caughtCount } };

    case 'caught':
      return { ...state, caughtNotice: true };

    case 'game-ended':
      return { ...state, screen: 'endgame', endgame: action.summary };
  }
}

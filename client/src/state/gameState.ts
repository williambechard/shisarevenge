import type {
  CardValue,
  DuelOutcome,
  PrivatePlayerState,
  PublicRoomState,
} from '@shisa-revenge/shared';

export type Screen = 'landing' | 'join' | 'lobby' | 'round';

export type ConnectionState = 'connecting' | 'waking' | 'connected' | 'reconnecting' | 'offline';

export type Pairing = { a: string; b: string };

export type RoundView = {
  round: number;
  pairings: Pairing[];
  warmUpPlayerId: string | null;
  // Epoch milliseconds when selection closes. Null when no timer is running.
  deadline: number | null;
};

export type Reveal = {
  myValue: CardValue;
  opponentValue: CardValue;
};

export type GameState = {
  screen: Screen;
  connection: ConnectionState;
  room: PublicRoomState | null;
  roomCode: string | null;
  playerId: string | null;
  prefillCode: string;
  notice: string | null;
  privateState: PrivatePlayerState | null;
  roundView: RoundView | null;
  reveal: Reveal | null;
  duel: DuelOutcome | null;
  autoLocked: boolean;
  selected: CardValue | null;
};

// Reads ?room=CODE from a link or QR code so the join screen can prefill it.
export function prefillCodeFrom(search: string): string {
  const value = new URLSearchParams(search).get('room');
  return value ? value.trim().toUpperCase() : '';
}

export function createInitialState(search: string): GameState {
  return {
    screen: 'landing',
    connection: 'connecting',
    room: null,
    roomCode: null,
    playerId: null,
    prefillCode: prefillCodeFrom(search),
    notice: null,
    privateState: null,
    roundView: null,
    reveal: null,
    duel: null,
    autoLocked: false,
    selected: null,
  };
}

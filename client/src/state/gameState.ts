import type {
  CardValue,
  DuelOutcome,
  EndgameSummary,
  PrivatePlayerState,
  PublicRoomState,
} from '@shisa-revenge/shared';

// The lobby is the first screen. The round screen opens when the match starts, and the endgame
// overview opens when it ends.
export type Screen = 'lobby' | 'round' | 'endgame';

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

export type RoundSummary = {
  round: number;
  caughtCount: number;
};

export type GameState = {
  screen: Screen;
  connection: ConnectionState;
  room: PublicRoomState | null;
  roomCode: string | null;
  playerId: string | null;
  // The name assigned to this player. Players never choose a name.
  name: string | null;
  notice: string | null;
  privateState: PrivatePlayerState | null;
  roundView: RoundView | null;
  reveal: Reveal | null;
  duel: DuelOutcome | null;
  autoLocked: boolean;
  selected: CardValue | null;
  roundSummary: RoundSummary | null;
  // True after this player catches a cold. Cleared when the next round starts.
  caughtNotice: boolean;
  endgame: EndgameSummary | null;
};

export function createInitialState(): GameState {
  return {
    screen: 'lobby',
    connection: 'connecting',
    room: null,
    roomCode: null,
    playerId: null,
    name: null,
    notice: null,
    privateState: null,
    roundView: null,
    reveal: null,
    duel: null,
    autoLocked: false,
    selected: null,
    roundSummary: null,
    caughtNotice: false,
    endgame: null,
  };
}

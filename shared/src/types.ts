// Neutral domain names. UI text uses theme names (see design/05-coding-standards.md section 3).

export type CardValue = 1 | 2 | 3 | 4 | 5;

export type Team = 'survivor' | 'infected';

export type SpecialKind = 'bingata-shawl' | 'hot-shikuwasa' | 'shisa-mask';

export type SpecialStatus = 'available' | 'committed' | 'spent' | 'lost';

export type Phase =
  'lobby' | 'announce' | 'pairing' | 'selecting' | 'revealed' | 'resolved' | 'ended';

export type PublicPlayer = {
  id: string;
  name: string;
  ready: boolean;
  connected: boolean;
  isHost: boolean;
};

export type EndgameSummary = {
  winner: Team;
  survivors: number;
  infected: number;
  originPlayerId: string;
  history: Array<{ playerId: string; transformations: number[] }>;
};

// Public room state, from design/08-socket-contract.md section 2.
// Only public fields appear here. Hands, specials, and tokens never do.
export type PublicRoomState = {
  roomCode: string;
  phase: Phase;
  round: number;
  roundCount: number;
  players: PublicPlayer[];
  pairings: Array<{ a: string; b: string }>;
  warmUpPlayerId: string | null;
  teamCounts: { survivors: number; infected: number };
  secondsLeft: number | null;
  winner: Team | null;
  originPlayerId: string | null;
  endgame: EndgameSummary | null;
};

// Private state for one player, from design/08-socket-contract.md section 2.
// It is sent only to that player's socket.
export type PrivatePlayerState = {
  playerId: string;
  team: Team;
  hand: CardValue[];
  special: { kind: SpecialKind; status: SpecialStatus } | null;
  encounter: {
    opponentId: string;
    selectionLocked: boolean;
    lastResult: DuelOutcome | null;
  } | null;
  notices: PrivateNotice[];
};

export type DuelOutcome = {
  round: number;
  opponentId: string;
  myValue: CardValue;
  opponentValue: CardValue;
  mySpecial: SpecialKind | null;
  opponentSpecial: SpecialKind | null;
  result: 'won' | 'lost' | 'tie' | 'blocked' | 'repelled' | 'recovered';
};

export type PrivateNotice =
  | { kind: 'caught-cold'; lostSpecial: SpecialKind | null; newSpecial: 'shisa-mask' }
  | { kind: 'recovered'; lostSpecial: 'shisa-mask' | null; newSpecial: SpecialKind }
  | { kind: 'auto-locked' };
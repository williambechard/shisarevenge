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

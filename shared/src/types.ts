// Neutral domain names. UI text uses theme names (see design/05-coding-standards.md section 3).

export type CardValue = 1 | 2 | 3 | 4 | 5;

export type Team = 'survivor' | 'infected';

// The card a player plays in a round. Specials are played in place of a number card.
export type PlayedCard = { type: 'number'; value: CardValue } | { type: 'special' };

export type SpecialKind = 'protection-talisman' | 'ramen' | 'shisa-mask';

export type SpecialStatus = 'available' | 'committed' | 'spent' | 'lost';

export type Phase =
  'lobby' | 'announce' | 'pairing' | 'selecting' | 'revealed' | 'resolved' | 'village' | 'ended';

export type PublicPlayer = {
  id: string;
  name: string;
  // Index of this player's icon, from 0 to PLAYER_ICON_COUNT minus one. Unique within the room.
  icon: number;
  connected: boolean;
  // Cards held, shared at the round summary only. Null before the match starts.
  cardCount: number | null;
  // True once the player holds no cards. Shared at the round summary only.
  eliminated: boolean;
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
// The village as every player sees it: the board, where everyone stands, and the public tags.
export type PublicVillage = {
  board: string[];
  positions: Record<string, { x: number; y: number }>;
  tags: Record<string, number>;
  // Everyone sees every accusation: who made it, who was targeted, and whether it was correct.
  log: Array<{ accuserId: string; targetId: string; correct: boolean }>;
  // Roles revealed to everyone by correct accusations.
  revealed: Record<string, Team>;
  // Open challenges (who challenged whom) are sent only as the partner result, not to others.
  // The latest meeting: the mover bounces back to where they came from. Null when none.
  meeting: {
    moverId: string;
    from: { x: number; y: number };
    to: { x: number; y: number };
    at: number;
  } | null;
  // Pairs locked in for a pre-battle: a challenge for the next round. Both players are locked until it starts.
  partners: Array<[string, string]>;
  // Epoch ms when the village closes and the next match starts.
  endsAt: number;
};

export type PublicRoomState = {
  roomCode: string;
  phase: Phase;
  round: number;
  roundCount: number;
  players: PublicPlayer[];
  // Epoch ms when the lobby wait ends. Null when no wait is running.
  startsAt: number | null;
  // True once the wait has passed and the room has at least MIN_PLAYERS. Any player may start it.
  startAvailable: boolean;
  pairings: Array<{ a: string; b: string }>;
  warmUpPlayerId: string | null;
  teamCounts: { survivors: number; infected: number };
  secondsLeft: number | null;
  winner: Team | null;
  originPlayerId: string | null;
  endgame: EndgameSummary | null;
  // The village between matches. Null outside the village.
  village: PublicVillage | null;
};

// Private state for one player, from design/08-socket-contract.md section 2.
// It is sent only to that player's socket.
export type PrivatePlayerState = {
  playerId: string;
  team: Team;
  // True for the player who started the match as the Cursed Shisa, even after their team changes.
  origin: boolean;
  hand: CardValue[];
  special: { kind: SpecialKind; status: SpecialStatus } | null;
  // A take this player must make now. The server picks at random after the deadline.
  pendingPick: { poolSize: number; deadline: number } | null;
  encounter: {
    opponentId: string;
    selectionLocked: boolean;
    // The opponent's card count, shown only to the two players in this duel. Changes when a card is played or taken.
    opponentCardCount: number;
    // True once the opponent has locked in this duel. Their card then leaves their hand for the table.
    opponentLocked: boolean;
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
  | { kind: 'auto-locked' }
  | { kind: 'card-gained'; value: CardValue }
  | { kind: 'card-lost' }
  | { kind: 'eliminated' }
  | { kind: 'accused' }
  | { kind: 'challenged'; byId: string }
  | { kind: 'partnered'; partnerId: string }
  | { kind: 'accusation-result'; correct: boolean }
  | { kind: 'vended'; value: CardValue | null; special: SpecialKind | null };

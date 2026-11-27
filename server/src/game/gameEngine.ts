// Round state machine for the card duel. Pure: no I/O and no timers.
// Phases: announce -> pairing -> selecting -> revealed -> resolved, then the next round or ended.
// Each duel reveals as soon as its two players lock in (design/04-game-rules.md section 4.5).
// Rules from design/04-game-rules.md sections 3 to 8.

import {
  SPECIAL_STRENGTH,
  type CardValue,
  type Phase,
  type Result,
  type SpecialKind,
  type Team,
  roundCountFor,
} from '@shisa-revenge/shared';
import { createHand } from './deck.js';
import { pairKey, pairPlayers, type RandomFn } from './pairing.js';
import { resolveDuel, type DuelOutcome } from './encounterResolver.js';
import { catchCold, randomSurvivorSpecial, recover, type PlayerSpecial } from './teamChanges.js';
import type { VillageCards } from '../village/village.js';

export type MatchPlayer = {
  id: string;
  team: Team;
  // Number cards not yet played. A number is removed once it is played.
  hand: CardValue[];
  byeCount: number;
  // The special card. Played at most once, like a number card.
  special: PlayerSpecial | null;
  // Out of cards. Not paired, and cannot take or be taken from (design section 4.7).
  eliminated: boolean;
  // True after a cold, until the player rebounds.
  rebound?: boolean;
};

export type Pair = [string, string];

// A card as it is locked in on the server. A special carries its kind.
export type Played = { type: 'number'; value: CardValue } | { type: 'special'; kind: SpecialKind };

export type DuelResult = {
  round: number;
  pair: Pair;
  outcome: DuelOutcome;
  // Strength of each side's card. A special's strength comes from SPECIAL_STRENGTH.
  values: [CardValue, CardValue];
  // Team of each side before the duel. Team changes happen at reveal, so this is the pre-duel team.
  teams: [Team, Team];
  // Special card played by each side, or null when a number was played.
  specials: [SpecialKind | null, SpecialKind | null];
  // Special lost by the caught player (null when none was lost).
  caughtLostSpecial: SpecialKind | null;
  // Special given to the recovered player.
  recoveredNewSpecial: SpecialKind | null;
};

// A take waiting for the winner of a duel (design section 4.6). The pool is shuffled, so position carries no information.
export type PendingPick = {
  winnerId: string;
  loserId: string;
  pool: CardValue[];
};

export type MatchState = {
  // Rounds in this match, set by the number of players (roundCountFor).
  roundCount: number;
  phase: Phase;
  round: number;
  players: MatchPlayer[];
  pairs: Pair[];
  warmUpId: string | null;
  previousPairs: ReadonlySet<string>;
  // Cards locked in for the current round, keyed by player id.
  locked: ReadonlyMap<string, Played>;
  // Duels already resolved this round, keyed by pairKey().
  resolvedPairs: ReadonlySet<string>;
  // Results from the current round, in the order duels resolved.
  results: ReadonlyArray<DuelResult>;
  // Takes not yet made this round. The round summary waits until this is empty.
  picks: ReadonlyArray<PendingPick>;
  // Round numbers in which each player changed team, for the endgame history.
  transformations: Readonly<Record<string, readonly number[]>>;
};

// Strength of a played card. A number is its value. A special uses its fixed strength.
export function strengthOf(card: Played): CardValue {
  return card.type === 'number' ? card.value : SPECIAL_STRENGTH[card.kind];
}

// Setup (design section 3): the origin holds a Shisa Mask. Each Survivor gets a random Survivor special.
// Cards carried out of the village (design/10 section 6 and 12) are added to the starting hand. A carried
// Protection Talisman or Ramen replaces a Survivor's random special. Any other carried special becomes a number.
export function createMatch(
  players: ReadonlyArray<{ id: string; team: Team }>,
  random: RandomFn = Math.random,
  carry: Readonly<Record<string, VillageCards>> = {},
): MatchState {
  return {
    roundCount: roundCountFor(players.length),
    phase: 'lobby',
    round: 0,
    players: players.map((player) => {
      const extra = carry[player.id];
      const hand: CardValue[] = [...createHand(), ...(extra?.hand ?? [])];
      let special: PlayerSpecial =
        player.team === 'infected'
          ? { kind: 'shisa-mask', status: 'available' }
          : { kind: randomSurvivorSpecial(random), status: 'available' };
      if (extra?.special) {
        const survivorSpecial =
          extra.special === 'protection-talisman' || extra.special === 'ramen';
        if (player.team === 'survivor' && survivorSpecial) {
          special = { kind: extra.special, status: 'available' };
        } else {
          hand.push((Math.floor(random() * 5) + 1) as CardValue);
        }
      }
      return {
        id: player.id,
        team: player.team,
        hand,
        byeCount: 0,
        special,
        eliminated: false,
      };
    }),
    pairs: [],
    warmUpId: null,
    previousPairs: new Set(),
    locked: new Map(),
    resolvedPairs: new Set(),
    results: [],
    picks: [],
    transformations: {},
  };
}
export function beginRound(state: MatchState): MatchState {
  if (state.phase !== 'lobby' && state.phase !== 'resolved') {
    throw new Error(`Cannot begin a round from phase ${state.phase}`);
  }
  return {
    ...state,
    phase: 'announce',
    round: state.round + 1,
    locked: new Map(),
    resolvedPairs: new Set(),
    results: [],
    picks: [],
  };
}

// Pairs the players and opens selection. Partners chosen in the village (`partners`) are paired first.
// The remaining players are paired at random: byes rotate and pairs do not repeat in a row. Eliminated
// players are not paired (design/04 section 4.1, design/10 section 13.1).
export function pairRound(
  state: MatchState,
  random: RandomFn,
  partners: ReadonlyArray<Pair> = [],
): MatchState {
  if (state.phase !== 'announce') {
    throw new Error(`Cannot pair from phase ${state.phase}`);
  }

  const chosen = new Set(partners.flat());
  const active = state.players.filter((player) => !player.eliminated && !chosen.has(player.id));
  const byeCounts = Object.fromEntries(active.map((player) => [player.id, player.byeCount]));
  const rest =
    active.length >= 2
      ? pairPlayers({
          playerIds: active.map((player) => player.id),
          byeCounts,
          previousPairs: state.previousPairs,
          random,
        })
      : { pairs: [], warmUpId: active[0]?.id ?? null, byeCounts };

  const byeById = new Map<string, number>(Object.entries(rest.byeCounts));
  const players = state.players.map((player) => ({
    ...player,
    byeCount: byeById.get(player.id) ?? player.byeCount,
  }));

  return {
    ...state,
    phase: 'selecting',
    players,
    pairs: [...partners.map(([a, b]) => [a, b] as Pair), ...rest.pairs],
    warmUpId: rest.warmUpId,
  };
}
function playerFor(state: MatchState, playerId: string): MatchPlayer | undefined {
  return state.players.find((player) => player.id === playerId);
}

export function pairOf(state: MatchState, playerId: string): Pair | undefined {
  return state.pairs.find(([a, b]) => a === playerId || b === playerId);
}

export function opponentOf(state: MatchState, playerId: string): string | null {
  const pair = pairOf(state, playerId);
  if (!pair) return null;
  return pair[0] === playerId ? pair[1] : pair[0];
}

// Lock-in. The card is either a number from the hand or the player's special card.
// Playing the special moves it from available to committed. It is spent at reveal.
export function submitSelection(
  state: MatchState,
  playerId: string,
  card: { type: 'number'; value: CardValue } | { type: 'special' },
): Result<MatchState> {
  if (state.phase !== 'selecting') return { ok: false, error: 'WRONG_PHASE' };
  if (!pairOf(state, playerId)) return { ok: false, error: 'NOT_IN_ENCOUNTER' };
  if (state.locked.has(playerId)) return { ok: false, error: 'ALREADY_LOCKED' };

  const player = playerFor(state, playerId);
  if (!player) return { ok: false, error: 'NOT_IN_ENCOUNTER' };

  if (card.type === 'number') {
    if (!player.hand.includes(card.value)) return { ok: false, error: 'CARD_UNAVAILABLE' };
    const locked = new Map(state.locked);
    locked.set(playerId, { type: 'number', value: card.value });
    return { ok: true, value: { ...state, locked } };
  }

  if (player.special?.status !== 'available') return { ok: false, error: 'SPECIAL_UNAVAILABLE' };
  const kind = player.special.kind;
  const locked = new Map(state.locked);
  locked.set(playerId, { type: 'special', kind });
  const players = state.players.map((candidate) =>
    candidate.id === playerId && candidate.special
      ? { ...candidate, special: { kind, status: 'committed' as const } }
      : candidate,
  );
  return { ok: true, value: { ...state, players, locked } };
}

export function isPairLocked(state: MatchState, pair: Pair): boolean {
  return state.locked.has(pair[0]) && state.locked.has(pair[1]);
}

export function isPairResolved(state: MatchState, pair: Pair): boolean {
  return state.resolvedPairs.has(pairKey(pair[0], pair[1]));
}

// Resolves one duel once both of its players have locked in.
// When the last duel resolves, the round moves to resolved.
// `random` is used only when a Survivor recovers an Army member and needs a new special.
export function revealPair(
  state: MatchState,
  pair: Pair,
  random: RandomFn = Math.random,
): MatchState {
  if (state.phase !== 'selecting') {
    throw new Error(`Cannot reveal from phase ${state.phase}`);
  }
  if (!isPairLocked(state, pair)) throw new Error('Duel cannot reveal before both players lock in');
  if (isPairResolved(state, pair)) throw new Error('Duel already resolved');

  const [a, b] = pair;
  const playedA = state.locked.get(a);
  const playedB = state.locked.get(b);
  if (!playedA || !playedB) throw new Error('Locked card missing');

  const valueA = strengthOf(playedA);
  const valueB = strengthOf(playedB);
  const playerA = playerFor(state, a);
  const playerB = playerFor(state, b);
  const teamA = playerA?.team ?? 'survivor';
  const teamB = playerB?.team ?? 'survivor';
  const specialA = playedA.type === 'special' ? playedA.kind : null;
  const specialB = playedB.type === 'special' ? playedB.kind : null;

  // Step 2 uses the outcome of the duel. Step 3 applies team and special effects.
  const outcome = resolveDuel(
    {
      id: a,
      team: teamA,
      effectiveStrength: valueA,
      committed: specialA,
      rebound: playerA?.rebound === true,
    },
    {
      id: b,
      team: teamB,
      effectiveStrength: valueB,
      committed: specialB,
      rebound: playerB?.rebound === true,
    },
  );

  // Step 1: spend the special cards played, and remove a played number from the hand.
  // A card never returns to the hand.
  const spent = state.players.map((player) => {
    if (player.id !== a && player.id !== b) return player;
    const played = state.locked.get(player.id);
    if (!played) return player;
    if (played.type === 'special') {
      const special = player.special ? { ...player.special, status: 'spent' as const } : null;
      return { ...player, special };
    }
    return { ...player, hand: player.hand.filter((card) => card !== played.value) };
  });

  let players = spent;
  let caughtLostSpecial: SpecialKind | null = null;
  let recoveredNewSpecial: SpecialKind | null = null;
  let transformations = state.transformations;

  if (outcome.caughtCold) {
    const result = catchCold(players, outcome.caughtCold);
    players = result.players;
    caughtLostSpecial = result.lostSpecial;
    transformations = appendTransformation(transformations, outcome.caughtCold, state.round);
  }
  if (outcome.recoveredId) {
    const result = recover(players, outcome.recoveredId, random);
    players = result.players;
    recoveredNewSpecial = result.newSpecial;
    transformations = appendTransformation(transformations, outcome.recoveredId, state.round);
  }
  // A rebound is the same team change as Ramen recovery: the Army member rejoins the Survivors.
  if (outcome.reboundId) {
    const result = recover(players, outcome.reboundId, random);
    players = result.players;
    recoveredNewSpecial = result.newSpecial;
    transformations = appendTransformation(transformations, outcome.reboundId, state.round);
  }

  // Step 5: the winner takes a card from the loser's remaining number cards (design section 4.6).
  const loserId = outcome.winnerId === null ? null : outcome.winnerId === a ? b : a;
  const pick =
    loserId && outcome.winnerId ? pickFor(players, outcome.winnerId, loserId, random) : null;

  const resolvedPairs = new Set(state.resolvedPairs);
  resolvedPairs.add(pairKey(a, b));
  const result: DuelResult = {
    round: state.round,
    pair,
    outcome,
    values: [valueA, valueB],
    teams: [teamA, teamB],
    specials: [specialA, specialB],
    caughtLostSpecial,
    recoveredNewSpecial,
  };
  const next: MatchState = {
    ...state,
    players,
    picks: pick ? [...state.picks, pick] : state.picks,
    transformations,
    resolvedPairs,
    results: [...state.results, result],
  };

  if (resolvedPairs.size === state.pairs.length) {
    return {
      ...next,
      phase: 'resolved',
      previousPairs: new Set(state.pairs.map(([x, y]) => pairKey(x, y))),
    };
  }
  return next;
}

// The pool for a take: the loser's number cards, shuffled so that position carries no information.
function pickFor(
  players: readonly MatchPlayer[],
  winnerId: string,
  loserId: string,
  random: RandomFn,
): PendingPick | null {
  const loser = players.find((player) => player.id === loserId);
  if (!loser || loser.hand.length === 0) return null;
  const pool = [...loser.hand];
  for (let index = pool.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [pool[index], pool[swap]] = [pool[swap] as CardValue, pool[index] as CardValue];
  }
  return { winnerId, loserId, pool };
}

// Number of cards a player holds: each number card, plus the special while it is available.
export function cardCountOf(player: MatchPlayer): number {
  return player.hand.length + (player.special?.status === 'available' ? 1 : 0);
}

// Marks every player who holds no cards as eliminated (design section 4.7). Runs at the round summary.
export function eliminateEmpty(state: MatchState): MatchState {
  return {
    ...state,
    players: state.players.map((player) =>
      player.eliminated || cardCountOf(player) > 0 ? player : { ...player, eliminated: true },
    ),
  };
}

// The winner takes the card at index in the face-down pool (design section 4.6).
export function applyPick(state: MatchState, winnerId: string, index: number): Result<MatchState> {
  const pick = state.picks.find((entry) => entry.winnerId === winnerId);
  if (!pick) return { ok: false, error: 'NO_PICK_PENDING' };
  const card = pick.pool[index];
  if (card === undefined) return { ok: false, error: 'INVALID_PICK' };

  const players = state.players.map((player) => {
    if (player.id === winnerId) return { ...player, hand: [...player.hand, card] };
    if (player.id === pick.loserId) {
      const hand = [...player.hand];
      const at = hand.indexOf(card);
      if (at >= 0) hand.splice(at, 1);
      return { ...player, hand };
    }
    return player;
  });
  return {
    ok: true,
    value: { ...state, players, picks: state.picks.filter((entry) => entry !== pick) },
  };
}

// The winner did not choose in time. The server takes a random card from the pool.
export function autoPick(state: MatchState, winnerId: string, random: RandomFn): MatchState {
  const pick = state.picks.find((entry) => entry.winnerId === winnerId);
  if (!pick) return state;
  const result = applyPick(state, winnerId, Math.floor(random() * pick.pool.length));
  return result.ok ? result.value : state;
}

function appendTransformation(
  transformations: MatchState['transformations'],
  playerId: string,
  round: number,
): MatchState['transformations'] {
  return { ...transformations, [playerId]: [...(transformations[playerId] ?? []), round] };
}

// Players who have not locked in play the lowest number in their hand. No special is played.
export function autoLockUnlocked(state: MatchState): MatchState {
  if (state.phase !== 'selecting') return state;

  const locked = new Map(state.locked);
  for (const [a, b] of state.pairs) {
    for (const id of [a, b]) {
      if (locked.has(id)) continue;
      const player = playerFor(state, id);
      const lowest = player && player.hand.length > 0 ? Math.min(...player.hand) : undefined;
      if (lowest !== undefined) {
        locked.set(id, { type: 'number', value: lowest as CardValue });
      } else if (player?.special?.status === 'available') {
        // No number left, so the unused special is the only card. Without this the duel could never lock.
        locked.set(id, { type: 'special', kind: player.special.kind });
      }
    }
  }
  return { ...state, locked };
}

export function allLockedIn(state: MatchState): boolean {
  return state.pairs.every((pair) => isPairLocked(state, pair));
}

// Resolves every duel that is still open. Used when the selection timer runs out.
// Every player must be locked in first, so call autoLockUnlocked before this.
export function resolveRound(state: MatchState, random: RandomFn = Math.random): MatchState {
  if (state.phase !== 'selecting' || !allLockedIn(state)) {
    throw new Error('Round cannot resolve before every choice is locked in');
  }
  let current = state;
  for (const pair of state.pairs) {
    if (!isPairResolved(current, pair)) current = revealPair(current, pair, random);
  }
  return current;
}

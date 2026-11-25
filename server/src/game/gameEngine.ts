// Round state machine for the numbered-card duel. Pure: no I/O and no timers.
// Phases: announce -> pairing -> selecting -> revealed -> resolved, then the next round or ended.
// Each duel reveals as soon as its two players lock in (design/04-game-rules.md section 4.5).
// Rules from design/04-game-rules.md sections 4 to 8.

import {
  MAGIC_BONUS,
  MAX_EFFECTIVE_STRENGTH,
  type CardValue,
  type Phase,
  type Result,
  type SpecialKind,
  type Team,
} from '@shisa-revenge/shared';
import { createHand } from './deck.js';
import { pairKey, pairPlayers, type RandomFn } from './pairing.js';
import { resolveDuel, type DuelOutcome } from './encounterResolver.js';
import { catchCold, randomSurvivorSpecial, recover, type PlayerSpecial } from './teamChanges.js';

export type MatchPlayer = {
  id: string;
  team: Team;
  hand: CardValue[];
  byeCount: number;
  special: PlayerSpecial | null;
};

export type Pair = [string, string];

export type DuelResult = {
  round: number;
  pair: Pair;
  outcome: DuelOutcome;
  values: [CardValue, CardValue];
  // Team of each side before the duel. Team changes happen at reveal, so this is the pre-duel team.
  teams: [Team, Team];
  // Special committed by each side, or null.
  specials: [SpecialKind | null, SpecialKind | null];
  // Special lost by the caught player (null when none was lost).
  caughtLostSpecial: SpecialKind | null;
  // Special given to the recovered player.
  recoveredNewSpecial: SpecialKind | null;
};

export type MatchState = {
  phase: Phase;
  round: number;
  players: MatchPlayer[];
  pairs: Pair[];
  warmUpId: string | null;
  previousPairs: ReadonlySet<string>;
  // Locked choices for the current round, keyed by player id.
  locked: ReadonlyMap<string, CardValue>;
  // Specials committed with a lock-in this round, keyed by player id.
  committed: ReadonlyMap<string, SpecialKind>;
  // Duels already resolved this round, keyed by pairKey().
  resolvedPairs: ReadonlySet<string>;
  // Results from the current round, in the order duels resolved.
  results: ReadonlyArray<DuelResult>;
  // Round numbers in which each player changed team, for the endgame history.
  transformations: Readonly<Record<string, readonly number[]>>;
};

// Setup (design section 3): the origin holds a Shisa Mask. Each Survivor gets a random Survivor special.
export function createMatch(
  players: ReadonlyArray<{ id: string; team: Team }>,
  random: RandomFn = Math.random,
): MatchState {
  return {
    phase: 'lobby',
    round: 0,
    players: players.map((player) => ({
      id: player.id,
      team: player.team,
      hand: createHand(),
      byeCount: 0,
      special:
        player.team === 'infected'
          ? { kind: 'shisa-mask', status: 'available' }
          : { kind: randomSurvivorSpecial(random), status: 'available' },
    })),
    pairs: [],
    warmUpId: null,
    previousPairs: new Set(),
    locked: new Map(),
    committed: new Map(),
    resolvedPairs: new Set(),
    results: [],
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
    committed: new Map(),
    resolvedPairs: new Set(),
    results: [],
  };
}

// Pairs the players and opens selection. Byes rotate and pairs do not repeat in a row.
export function pairRound(state: MatchState, random: RandomFn): MatchState {
  if (state.phase !== 'announce') {
    throw new Error(`Cannot pair from phase ${state.phase}`);
  }

  const byeCounts = Object.fromEntries(state.players.map((player) => [player.id, player.byeCount]));
  const result = pairPlayers({
    playerIds: state.players.map((player) => player.id),
    byeCounts,
    previousPairs: state.previousPairs,
    random,
  });

  const players = state.players.map((player) => ({
    ...player,
    byeCount: result.byeCounts[player.id] ?? player.byeCount,
  }));

  return {
    ...state,
    phase: 'selecting',
    players,
    pairs: result.pairs,
    warmUpId: result.warmUpId,
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

// Lock-in with an optional special. Committing moves the special from available to committed.
// It is spent at reveal, whatever the outcome.
export function submitSelection(
  state: MatchState,
  playerId: string,
  value: CardValue,
  useSpecial = false,
): Result<MatchState> {
  if (state.phase !== 'selecting') return { ok: false, error: 'WRONG_PHASE' };
  if (!pairOf(state, playerId)) return { ok: false, error: 'NOT_IN_ENCOUNTER' };
  if (state.locked.has(playerId)) return { ok: false, error: 'ALREADY_LOCKED' };

  const player = playerFor(state, playerId);
  if (!player || !player.hand.includes(value)) return { ok: false, error: 'CARD_UNAVAILABLE' };

  const locked = new Map(state.locked);
  locked.set(playerId, value);

  if (!useSpecial) return { ok: true, value: { ...state, locked } };

  if (player.special?.status !== 'available') return { ok: false, error: 'SPECIAL_UNAVAILABLE' };
  const kind = player.special.kind;
  const committed = new Map(state.committed);
  committed.set(playerId, kind);
  const players = state.players.map((candidate) =>
    candidate.id === playerId && candidate.special
      ? { ...candidate, special: { kind, status: 'committed' as const } }
      : candidate,
  );
  return { ok: true, value: { ...state, players, locked, committed } };
}

export function isPairLocked(state: MatchState, pair: Pair): boolean {
  return state.locked.has(pair[0]) && state.locked.has(pair[1]);
}

export function isPairResolved(state: MatchState, pair: Pair): boolean {
  return state.resolvedPairs.has(pairKey(pair[0], pair[1]));
}

// Effective strength (design section 5): a committed Shisa Mask adds MAGIC_BONUS, capped.
export function effectiveStrength(value: CardValue, committed: SpecialKind | null): number {
  if (committed !== 'shisa-mask') return value;
  return Math.min(value + MAGIC_BONUS, MAX_EFFECTIVE_STRENGTH);
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
  const valueA = state.locked.get(a);
  const valueB = state.locked.get(b);
  if (valueA === undefined || valueB === undefined) throw new Error('Locked value missing');

  const playerA = playerFor(state, a);
  const playerB = playerFor(state, b);
  const teamA = playerA?.team ?? 'survivor';
  const teamB = playerB?.team ?? 'survivor';
  const committedA = state.committed.get(a) ?? null;
  const committedB = state.committed.get(b) ?? null;

  // Step 2 uses the outcome of the duel. Step 3 applies team and special effects.
  const outcome = resolveDuel(
    {
      id: a,
      team: teamA,
      effectiveStrength: effectiveStrength(valueA, committedA),
      committed: committedA,
    },
    {
      id: b,
      team: teamB,
      effectiveStrength: effectiveStrength(valueB, committedB),
      committed: committedB,
    },
  );

  // Step 1: spend committed specials and remove used cards from the hand. A card never returns.
  const spent = state.players.map((player) => {
    if (player.id !== a && player.id !== b) return player;
    const used = state.locked.get(player.id);
    const hand = player.hand.filter((card) => card !== used);
    const special =
      state.committed.has(player.id) && player.special
        ? { ...player.special, status: 'spent' as const }
        : player.special;
    return { ...player, hand, special };
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

  const resolvedPairs = new Set(state.resolvedPairs);
  resolvedPairs.add(pairKey(a, b));
  const result: DuelResult = {
    round: state.round,
    pair,
    outcome,
    values: [valueA, valueB],
    teams: [teamA, teamB],
    specials: [committedA, committedB],
    caughtLostSpecial,
    recoveredNewSpecial,
  };
  const next: MatchState = {
    ...state,
    players,
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

function appendTransformation(
  transformations: MatchState['transformations'],
  playerId: string,
  round: number,
): MatchState['transformations'] {
  return { ...transformations, [playerId]: [...(transformations[playerId] ?? []), round] };
}

// Players who have not locked in get the lowest card in their hand. No special is committed.
export function autoLockUnlocked(state: MatchState): MatchState {
  if (state.phase !== 'selecting') return state;

  const locked = new Map(state.locked);
  for (const [a, b] of state.pairs) {
    for (const id of [a, b]) {
      if (locked.has(id)) continue;
      const player = playerFor(state, id);
      const lowest = player ? Math.min(...player.hand) : undefined;
      if (lowest !== undefined) locked.set(id, lowest as CardValue);
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

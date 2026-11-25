// Round state machine for the numbered-card duel. Pure: no I/O and no timers.
// Phases: announce -> pairing -> selecting -> revealed -> resolved, then the next round or ended.
// Each duel reveals as soon as its two players lock in (design/04-game-rules.md section 4.5).
// Rules from design/04-game-rules.md sections 4 and 6.

import { type CardValue, type Phase, type Result, type Team } from '@shisa-revenge/shared';
import { createHand } from './deck.js';
import { pairKey, pairPlayers, type RandomFn } from './pairing.js';
import { resolveDuel, type DuelOutcome } from './encounterResolver.js';

export type MatchPlayer = {
  id: string;
  team: Team;
  hand: CardValue[];
  byeCount: number;
};

export type Pair = [string, string];

export type DuelResult = {
  pair: Pair;
  outcome: DuelOutcome;
  values: [CardValue, CardValue];
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
  // Duels already resolved this round, keyed by pairKey().
  resolvedPairs: ReadonlySet<string>;
  // Results from the current round, in the order duels resolved.
  results: ReadonlyArray<DuelResult>;
};

export function createMatch(players: ReadonlyArray<{ id: string; team: Team }>): MatchState {
  return {
    phase: 'lobby',
    round: 0,
    players: players.map((player) => ({
      id: player.id,
      team: player.team,
      hand: createHand(),
      byeCount: 0,
    })),
    pairs: [],
    warmUpId: null,
    previousPairs: new Set(),
    locked: new Map(),
    resolvedPairs: new Set(),
    results: [],
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

export function submitSelection(
  state: MatchState,
  playerId: string,
  value: CardValue,
): Result<MatchState> {
  if (state.phase !== 'selecting') return { ok: false, error: 'WRONG_PHASE' };
  if (!pairOf(state, playerId)) return { ok: false, error: 'NOT_IN_ENCOUNTER' };
  if (state.locked.has(playerId)) return { ok: false, error: 'ALREADY_LOCKED' };

  const player = playerFor(state, playerId);
  if (!player || !player.hand.includes(value)) return { ok: false, error: 'CARD_UNAVAILABLE' };

  const locked = new Map(state.locked);
  locked.set(playerId, value);
  return { ok: true, value: { ...state, locked } };
}

export function isPairLocked(state: MatchState, pair: Pair): boolean {
  return state.locked.has(pair[0]) && state.locked.has(pair[1]);
}

export function isPairResolved(state: MatchState, pair: Pair): boolean {
  return state.resolvedPairs.has(pairKey(pair[0], pair[1]));
}

// Resolves one duel once both of its players have locked in.
// When the last duel resolves, the round moves to resolved.
export function revealPair(state: MatchState, pair: Pair): MatchState {
  if (state.phase !== 'selecting') {
    throw new Error(`Cannot reveal from phase ${state.phase}`);
  }
  if (!isPairLocked(state, pair)) throw new Error('Duel cannot reveal before both players lock in');
  if (isPairResolved(state, pair)) throw new Error('Duel already resolved');

  const [a, b] = pair;
  const valueA = state.locked.get(a);
  const valueB = state.locked.get(b);
  if (valueA === undefined || valueB === undefined) throw new Error('Locked value missing');

  const teamA = playerFor(state, a)?.team ?? 'survivor';
  const teamB = playerFor(state, b)?.team ?? 'survivor';
  const outcome = resolveDuel(
    { id: a, team: teamA, effectiveStrength: valueA },
    { id: b, team: teamB, effectiveStrength: valueB },
  );

  // Used cards leave the hand now, and a card never returns to it.
  const players = state.players.map((player) => {
    if (player.id !== a && player.id !== b) return player;
    const used = state.locked.get(player.id);
    return { ...player, hand: player.hand.filter((card) => card !== used) };
  });

  const resolvedPairs = new Set(state.resolvedPairs);
  resolvedPairs.add(pairKey(a, b));
  const result: DuelResult = { pair, outcome, values: [valueA, valueB] };
  const next: MatchState = {
    ...state,
    players,
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

// Players who have not locked in get the lowest card in their hand.
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
export function resolveRound(state: MatchState): MatchState {
  if (state.phase !== 'selecting' || !allLockedIn(state)) {
    throw new Error('Round cannot resolve before every choice is locked in');
  }
  let current = state;
  for (const pair of state.pairs) {
    if (!isPairResolved(current, pair)) current = revealPair(current, pair);
  }
  return current;
}

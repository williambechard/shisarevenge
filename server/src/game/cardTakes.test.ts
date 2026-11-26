// Taking cards and elimination. Rules from design/04-game-rules.md sections 4.6, 4.7, 6 (step 5), and 9.
import { describe, expect, it } from 'vitest';
import type { CardValue } from '@shisa-revenge/shared';
import {
  applyPick,
  beginRound,
  cardCountOf,
  createMatch,
  eliminateEmpty,
  revealPair,
  submitSelection,
  type MatchState,
  type Pair,
} from './gameEngine.js';
import { checkWin } from './winConditions.js';
import type { RandomFn } from './pairing.js';

function seeded(seed: number): RandomFn {
  let state = seed;
  return () => {
    state = (Math.imul(state, 1103515245) + 12345) >>> 0;
    return state / 0x100000000;
  };
}

const N = (value: CardValue) => ({ type: 'number' as const, value });

// Four players in two duels: a vs b, and c vs d. a and c are Survivors, b is the Army member.
function twoDuels(): MatchState {
  const base = createMatch(
    [
      { id: 'a', team: 'survivor' },
      { id: 'b', team: 'infected' },
      { id: 'c', team: 'survivor' },
      { id: 'd', team: 'survivor' },
    ],
    seeded(1),
  );
  return {
    ...beginRound(base),
    phase: 'selecting',
    round: 1,
    pairs: [
      ['a', 'b'],
      ['c', 'd'],
    ],
  };
}

function play(
  state: MatchState,
  pair: Pair,
  first: { id: string; card: ReturnType<typeof N> | { type: 'special' } },
  second: { id: string; card: ReturnType<typeof N> | { type: 'special' } },
): MatchState {
  const one = submitSelection(state, first.id, first.card);
  if (!one.ok) throw new Error(`lock failed: ${one.error}`);
  const two = submitSelection(one.value, second.id, second.card);
  if (!two.ok) throw new Error(`lock failed: ${two.error}`);
  return revealPair(two.value, pair, seeded(2));
}

function handOf(state: MatchState, id: string): CardValue[] {
  return [...(state.players.find((player) => player.id === id)?.hand ?? [])];
}

describe('taking a card (design section 4.6)', () => {
  it('offers the winner the loser remaining number cards, after the played card is gone', () => {
    const next = play(twoDuels(), ['a', 'b'], { id: 'a', card: N(5) }, { id: 'b', card: N(2) });
    const pick = next.picks.find((entry) => entry.winnerId === 'a');
    expect(pick?.loserId).toBe('b');
    expect([...(pick?.pool ?? [])].sort()).toEqual([1, 3, 4, 5]);
    expect(handOf(next, 'b')).not.toContain(2);
  });

  it('moves the chosen card from the loser to the winner', () => {
    const next = play(twoDuels(), ['a', 'b'], { id: 'a', card: N(5) }, { id: 'b', card: N(2) });
    const pool = next.picks.find((entry) => entry.winnerId === 'a')?.pool ?? [];
    const chosen = pool[0];
    const after = applyPick(next, 'a', 0);
    if (!after.ok) throw new Error('pick failed');
    expect(handOf(after.value, 'a')).toContain(chosen);
    expect(handOf(after.value, 'b')).toHaveLength(pool.length - 1);
    expect(after.value.picks.find((entry) => entry.winnerId === 'a')).toBeUndefined();
  });

  it('gives no take on a tie', () => {
    const next = play(twoDuels(), ['a', 'b'], { id: 'a', card: N(3) }, { id: 'b', card: N(3) });
    expect(next.picks).toHaveLength(0);
  });

  it('gives a take when two players on the same team duel', () => {
    const next = play(twoDuels(), ['c', 'd'], { id: 'c', card: N(4) }, { id: 'd', card: N(1) });
    expect(next.picks.map((entry) => entry.winnerId)).toEqual(['c']);
  });

  it('never offers a special card', () => {
    const state = twoDuels();
    const withSpecial: MatchState = {
      ...state,
      players: state.players.map((player) =>
        player.id === 'b' ? { ...player, special: { kind: 'ramen', status: 'available' } } : player,
      ),
    };
    const next = play(withSpecial, ['a', 'b'], { id: 'a', card: N(5) }, { id: 'b', card: N(2) });
    const pool = next.picks.find((entry) => entry.winnerId === 'a')?.pool ?? [];
    expect(pool.every((value) => typeof value === 'number')).toBe(true);
    expect(pool).toHaveLength(4);
  });

  it('gives no take when the loser has no number cards left', () => {
    const state = twoDuels();
    const empty: MatchState = {
      ...state,
      players: state.players.map((player) =>
        player.id === 'b'
          ? { ...player, hand: [], special: { kind: 'ramen', status: 'available' as const } }
          : player,
      ),
    };
    const next = play(
      empty,
      ['a', 'b'],
      { id: 'a', card: N(5) },
      { id: 'b', card: { type: 'special' } },
    );
    expect(next.picks).toHaveLength(0);
  });

  it('rejects an index outside the pool', () => {
    const next = play(twoDuels(), ['a', 'b'], { id: 'a', card: N(5) }, { id: 'b', card: N(2) });
    expect(applyPick(next, 'a', 99)).toEqual({ ok: false, error: 'INVALID_PICK' });
  });

  it('rejects a pick when none is pending', () => {
    expect(applyPick(twoDuels(), 'a', 0)).toEqual({ ok: false, error: 'NO_PICK_PENDING' });
  });

  it('lets a hand hold a duplicate after a take', () => {
    const next = play(twoDuels(), ['a', 'b'], { id: 'a', card: N(5) }, { id: 'b', card: N(2) });
    const pool = next.picks.find((entry) => entry.winnerId === 'a')?.pool ?? [];
    // a has played 5 and keeps 1 to 4 in hand. Taking a card that a already holds makes a duplicate.
    const held = handOf(next, 'a');
    const duplicate = pool.find((value) => held.includes(value));
    if (duplicate === undefined) return;
    const index = pool.indexOf(duplicate);
    const after = applyPick(next, 'a', index);
    if (!after.ok) throw new Error('pick failed');
    expect(handOf(after.value, 'a').filter((value) => value === duplicate)).toHaveLength(2);
  });
});

describe('elimination (design section 4.7)', () => {
  it('counts number cards plus an available special', () => {
    const state = twoDuels();
    const player = state.players.find((candidate) => candidate.id === 'a');
    if (!player) throw new Error('missing player');
    expect(
      cardCountOf({ ...player, hand: [1, 2], special: { kind: 'ramen', status: 'available' } }),
    ).toBe(3);
    expect(
      cardCountOf({ ...player, hand: [1, 2], special: { kind: 'ramen', status: 'spent' } }),
    ).toBe(2);
  });

  it('marks a player with no cards as eliminated and keeps the others', () => {
    const state = twoDuels();
    const emptied: MatchState = {
      ...state,
      players: state.players.map((player) =>
        player.id === 'c' ? { ...player, hand: [], special: null } : player,
      ),
    };
    const next = eliminateEmpty(emptied);
    expect(next.players.find((player) => player.id === 'c')?.eliminated).toBe(true);
    expect(next.players.find((player) => player.id === 'a')?.eliminated).toBe(false);
  });

  it('keeps a player with only an available special in the match', () => {
    const state = twoDuels();
    const onlySpecial: MatchState = {
      ...state,
      players: state.players.map((player) =>
        player.id === 'c'
          ? { ...player, hand: [], special: { kind: 'ramen', status: 'available' } }
          : player,
      ),
    };
    expect(
      eliminateEmpty(onlySpecial).players.find((player) => player.id === 'c')?.eliminated,
    ).toBe(false);
  });
});

describe('win checks with elimination (design section 9)', () => {
  it('gives the Army the win when no active survivor remains', () => {
    const active = [
      { id: 'b', team: 'infected' as const, special: null },
      { id: 'a', team: 'infected' as const, special: null },
    ];
    expect(checkWin(active, 2)).toEqual({ winner: 'infected', reason: 'all-infected' });
  });

  it('gives the Army the win when every player is out', () => {
    expect(checkWin([], 2)).toEqual({ winner: 'infected', reason: 'all-infected' });
  });
});

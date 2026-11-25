import { describe, expect, it } from 'vitest';
import { pairKey, pairPlayers } from './pairing.js';

// Deterministic pseudo-random sequence so tests are repeatable.
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (Math.imul(state, 1103515245) + 12345) >>> 0;
    return state / 0x100000000;
  };
}

const ids = (count: number) => Array.from({ length: count }, (_, index) => `p${String(index)}`);

describe('pairPlayers', () => {
  it('pairs every player with no Warm-Up when the count is even', () => {
    const result = pairPlayers({
      playerIds: ids(6),
      byeCounts: {},
      previousPairs: new Set(),
      random: seeded(1),
    });
    expect(result.pairs).toHaveLength(3);
    expect(result.warmUpId).toBeNull();
    expect(new Set(result.pairs.flat()).size).toBe(6);
  });

  it('gives one Warm-Up when the count is odd', () => {
    const result = pairPlayers({
      playerIds: ids(5),
      byeCounts: {},
      previousPairs: new Set(),
      random: seeded(2),
    });
    expect(result.pairs).toHaveLength(2);
    expect(result.warmUpId).not.toBeNull();
    expect(result.pairs.flat()).not.toContain(result.warmUpId);
  });

  it('gives the Warm-Up to the player with the fewest byes', () => {
    const playerIds = ids(5);
    const byeCounts = { p0: 2, p1: 2, p2: 1, p3: 2, p4: 2 };
    const result = pairPlayers({
      playerIds,
      byeCounts,
      previousPairs: new Set(),
      random: seeded(3),
    });
    expect(result.warmUpId).toBe('p2');
    expect(result.byeCounts['p2']).toBe(2);
  });

  it('never repeats a pair from the previous round when a valid pairing exists', () => {
    const playerIds = ids(4);
    // Only the pairing p0-p1 and p2-p3 is repeated. Other valid pairings remain.
    const previousPairs = new Set([pairKey('p0', 'p1'), pairKey('p2', 'p3')]);
    for (let seed = 1; seed <= 20; seed += 1) {
      const result = pairPlayers({ playerIds, byeCounts: {}, previousPairs, random: seeded(seed) });
      const repeated = result.pairs.filter(([a, b]) => previousPairs.has(pairKey(a, b)));
      expect(repeated).toHaveLength(0);
      expect(result.repeatsForced).toBe(false);
    }
  });

  it('reports forced repeats when every shuffle repeats a pair', () => {
    const playerIds = ids(2);
    const previousPairs = new Set([pairKey('p0', 'p1')]);
    const result = pairPlayers({ playerIds, byeCounts: {}, previousPairs, random: seeded(4) });
    expect(result.repeatsForced).toBe(true);
    expect(result.pairs).toHaveLength(1);
    expect([...(result.pairs[0] ?? [])].sort()).toEqual(['p0', 'p1']);
  });
});

describe('pairKey', () => {
  it('ignores order', () => {
    expect(pairKey('a', 'b')).toBe(pairKey('b', 'a'));
  });
});

describe('no-repeat pairing at other sizes', () => {
  it.each([5, 8])('never repeats a pair with %i players when a valid pairing exists', (count) => {
    const playerIds = ids(count);
    // Previous round: pair the first two, the next two, and so on.
    const previousPairs = new Set<string>();
    for (let index = 0; index + 1 < count; index += 2) {
      previousPairs.add(pairKey(`p${String(index)}`, `p${String(index + 1)}`));
    }
    for (let seed = 1; seed <= 20; seed += 1) {
      const result = pairPlayers({ playerIds, byeCounts: {}, previousPairs, random: seeded(seed) });
      const repeated = result.pairs.filter(([a, b]) => previousPairs.has(pairKey(a, b)));
      expect(repeated).toHaveLength(0);
    }
  });
});

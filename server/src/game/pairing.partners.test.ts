// Partners chosen in the village are paired first. Eliminated players are never paired (design/10 section 13.1).
import { describe, expect, it } from 'vitest';
import { beginRound, createMatch, pairRound } from './gameEngine.js';
import type { RandomFn } from './pairing.js';

function seeded(seed: number): RandomFn {
  let state = seed;
  return () => {
    state = (Math.imul(state, 1103515245) + 12345) >>> 0;
    return state / 0x100000000;
  };
}

function announced(count: number) {
  const players = Array.from({ length: count }, (_, index) => ({
    id: `p${String(index)}`,
    team: index === 0 ? ('infected' as const) : ('survivor' as const),
  }));
  return beginRound(createMatch(players, seeded(1)));
}

describe('pairing with partners', () => {
  it('pairs the chosen partners together', () => {
    const state = pairRound(announced(6), seeded(3), [['p0', 'p5']]);
    expect(state.pairs).toContainEqual(['p0', 'p5']);
  });

  it('pairs every other player exactly once', () => {
    const state = pairRound(announced(6), seeded(3), [['p0', 'p5']]);
    const seen = state.pairs.flat();
    expect(new Set(seen).size).toBe(seen.length);
    expect(seen).toHaveLength(6);
  });

  it('never pairs an eliminated player', () => {
    const base = announced(6);
    const withOut = {
      ...base,
      players: base.players.map((player) =>
        player.id === 'p2' ? { ...player, eliminated: true } : player,
      ),
    };
    const state = pairRound(withOut, seeded(4), [['p0', 'p5']]);
    expect(state.pairs.flat()).not.toContain('p2');
    expect(state.warmUpId).not.toBe('p2');
  });
});

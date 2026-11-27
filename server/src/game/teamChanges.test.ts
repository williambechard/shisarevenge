import { describe, expect, it } from 'vitest';
import { catchCold, randomSurvivorSpecial, recover, type TeamMember } from './teamChanges.js';
import type { RandomFn } from './pairing.js';

function seeded(seed: number): RandomFn {
  let state = seed;
  return () => {
    state = (Math.imul(state, 1103515245) + 12345) >>> 0;
    return state / 0x100000000;
  };
}

const roster: TeamMember[] = [
  { id: 'a', team: 'infected', special: { kind: 'shisa-mask', status: 'available' } },
  { id: 'b', team: 'survivor', special: { kind: 'ramen', status: 'available' } },
  { id: 'c', team: 'survivor', special: { kind: 'protection-talisman', status: 'available' } },
];

describe('randomSurvivorSpecial', () => {
  it('gives each Survivor special about half the time over many seeded draws', () => {
    const random = seeded(42);
    let talismans = 0;
    const draws = 1000;
    for (let index = 0; index < draws; index += 1) {
      if (randomSurvivorSpecial(random) === 'protection-talisman') talismans += 1;
    }
    expect(talismans).toBeGreaterThan(400);
    expect(talismans).toBeLessThan(600);
  });

  it('picks Protection Talisman below 0.5 and Ramen at or above it', () => {
    expect(randomSurvivorSpecial(() => 0.2)).toBe('protection-talisman');
    expect(randomSurvivorSpecial(() => 0.8)).toBe('ramen');
  });
});

describe('catchCold', () => {
  it("moves a Survivor to Shisa's Army and gives a fresh Shisa Mask", () => {
    const result = catchCold(roster, 'c');
    expect(result.players.find((p) => p.id === 'c')).toEqual({
      id: 'c',
      team: 'infected',
      special: { kind: 'shisa-mask', status: 'available' },
      rebound: true,
    });
  });

  it('reports the unused Survivor special as lost', () => {
    expect(catchCold(roster, 'c').lostSpecial).toBe('protection-talisman');
  });

  it('reports no lost special when the Survivor special was spent', () => {
    const spent = roster.map((p) =>
      p.id === 'b' ? { ...p, special: { kind: 'ramen' as const, status: 'spent' as const } } : p,
    );
    const result = catchCold(spent, 'b');
    expect(result.lostSpecial).toBeNull();
    expect(result.players.find((p) => p.id === 'b')?.special).toEqual({
      kind: 'shisa-mask',
      status: 'available',
    });
  });

  it('does not change an Army member', () => {
    const result = catchCold(roster, 'a');
    expect(result.players).toEqual(roster);
    expect(result.lostSpecial).toBeNull();
  });
});

describe('recover', () => {
  it('moves an Army member back to the Survivors with a fresh Survivor special', () => {
    const result = recover(roster, 'a', () => 0.8);
    expect(result.newSpecial).toBe('ramen');
    expect(result.players.find((p) => p.id === 'a')).toEqual({
      id: 'a',
      team: 'survivor',
      special: { kind: 'ramen', status: 'available' },
      rebound: false,
    });
  });

  it('leaves Survivors unchanged', () => {
    const result = recover(roster, 'b', () => 0.1);
    expect(result.players).toEqual(roster);
  });
});

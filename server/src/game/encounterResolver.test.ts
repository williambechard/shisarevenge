import { describe, expect, it } from 'vitest';
import { resolveDuel } from './encounterResolver.js';

const none = { caughtCold: null, blocked: false, recoveredId: null, reboundId: null };

const survivor = (
  id: string,
  strength: number,
  committed: 'protection-talisman' | 'ramen' | null = null,
) => ({
  id,
  team: 'survivor' as const,
  effectiveStrength: strength,
  committed,
});
const army = (id: string, strength: number) => ({
  id,
  team: 'infected' as const,
  effectiveStrength: strength,
  committed: null,
});

describe('resolveDuel', () => {
  it('catches a Survivor when the Army member plays a higher number', () => {
    const outcome = resolveDuel(army('s', 4), survivor('v', 2));
    expect(outcome).toEqual({ ...none, winnerId: 's', caughtCold: 'v' });
  });

  it('repels the attack when the Survivor plays a higher number', () => {
    const outcome = resolveDuel(army('s', 2), survivor('v', 4));
    expect(outcome).toEqual({ ...none, winnerId: 'v' });
  });

  it('changes no team on a tie between Army and Survivor', () => {
    const outcome = resolveDuel(army('s', 3), survivor('v', 3));
    expect(outcome).toEqual({ ...none, winnerId: null });
  });

  it('changes no team in a Survivor duel, even when one side wins', () => {
    const outcome = resolveDuel(survivor('a', 5), survivor('b', 1));
    expect(outcome).toEqual({ ...none, winnerId: 'a' });
  });

  it('changes no team in an Army duel, even when one side wins', () => {
    const outcome = resolveDuel(army('a', 1), army('b', 5));
    expect(outcome).toEqual({ ...none, winnerId: 'b' });
  });

  it('is symmetric in argument order', () => {
    const forward = resolveDuel(army('s', 5), survivor('v', 1));
    const backward = resolveDuel(survivor('v', 1), army('s', 5));
    expect(forward).toEqual(backward);
  });

  it('blocks a freeze when the Survivor committed Protection Talisman, by any margin', () => {
    const outcome = resolveDuel(army('s', 5), survivor('v', 1, 'protection-talisman'));
    expect(outcome).toEqual({ ...none, winnerId: 's', blocked: true });
  });

  it('does not block a freeze without a committed Talisman', () => {
    const outcome = resolveDuel(army('s', 5), survivor('v', 1, 'ramen'));
    expect(outcome.caughtCold).toBe('v');
    expect(outcome.blocked).toBe(false);
  });

  it('recovers the Army member when the Survivor committed Ramen and won', () => {
    const outcome = resolveDuel(army('s', 1), survivor('v', 4, 'ramen'));
    expect(outcome).toEqual({ ...none, winnerId: 'v', recoveredId: 's', reboundId: null });
  });

  it('does not recover on a Ramen commit that loses', () => {
    const outcome = resolveDuel(army('s', 5), survivor('v', 1, 'ramen'));
    expect(outcome.recoveredId).toBeNull();
  });

  it('does not recover on a tie, even with Ramen committed', () => {
    const outcome = resolveDuel(army('s', 3), survivor('v', 3, 'ramen'));
    expect(outcome).toEqual({ ...none, winnerId: null });
  });
});

describe('resolveDuel rebound (design/04 section 8)', () => {
  it('rebounds a caught player who wins against another Army member', () => {
    const outcome = resolveDuel(
      { id: 'a', team: 'infected', effectiveStrength: 4, committed: null, rebound: true },
      { id: 'b', team: 'infected', effectiveStrength: 2, committed: null },
    );
    expect(outcome.reboundId).toBe('a');
    expect(outcome.caughtCold).toBeNull();
  });

  it('does not rebound a player who has already used it, or the origin', () => {
    const used = resolveDuel(
      { id: 'a', team: 'infected', effectiveStrength: 4, committed: null, rebound: false },
      { id: 'b', team: 'infected', effectiveStrength: 2, committed: null },
    );
    expect(used.reboundId).toBeNull();
    const origin = resolveDuel(
      { id: 'a', team: 'infected', effectiveStrength: 4, committed: null },
      { id: 'b', team: 'infected', effectiveStrength: 2, committed: null },
    );
    expect(origin.reboundId).toBeNull();
  });
});

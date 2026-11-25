import { describe, expect, it } from 'vitest';
import { resolveDuel } from './encounterResolver.js';

const survivor = (id: string, strength: number) => ({
  id,
  team: 'survivor' as const,
  effectiveStrength: strength,
});
const army = (id: string, strength: number) => ({
  id,
  team: 'infected' as const,
  effectiveStrength: strength,
});

describe('resolveDuel', () => {
  it('catches a Survivor when the Army member plays a higher number', () => {
    const outcome = resolveDuel(army('s', 4), survivor('v', 2));
    expect(outcome).toEqual({ winnerId: 's', caughtCold: 'v' });
  });

  it('repels the attack when the Survivor plays a higher number', () => {
    const outcome = resolveDuel(army('s', 2), survivor('v', 4));
    expect(outcome).toEqual({ winnerId: 'v', caughtCold: null });
  });

  it('changes no team on a tie between Army and Survivor', () => {
    const outcome = resolveDuel(army('s', 3), survivor('v', 3));
    expect(outcome).toEqual({ winnerId: null, caughtCold: null });
  });

  it('changes no team in a Survivor duel, even when one side wins', () => {
    const outcome = resolveDuel(survivor('a', 5), survivor('b', 1));
    expect(outcome).toEqual({ winnerId: 'a', caughtCold: null });
  });

  it('changes no team in an Army duel, even when one side wins', () => {
    const outcome = resolveDuel(army('a', 1), army('b', 5));
    expect(outcome).toEqual({ winnerId: 'b', caughtCold: null });
  });

  it('is symmetric in argument order', () => {
    const forward = resolveDuel(army('s', 5), survivor('v', 1));
    const backward = resolveDuel(survivor('v', 1), army('s', 5));
    expect(forward).toEqual(backward);
  });
});

import { describe, expect, it } from 'vitest';
import { checkWin } from './winConditions.js';

const roster = [
  { id: 'a', team: 'infected' as const, special: null },
  { id: 'b', team: 'survivor' as const, special: null },
  { id: 'c', team: 'survivor' as const, special: null },
];

describe('checkWin', () => {
  it("ends the game at once when everyone is on Shisa's Army", () => {
    const all = roster.map((p) => ({ ...p, team: 'infected' as const }));
    expect(checkWin(all, 2)).toEqual({ winner: 'infected', reason: 'all-infected' });
  });

  it("ends the game at once when no one is on Shisa's Army", () => {
    const none = roster.map((p) => ({ ...p, team: 'survivor' as const }));
    expect(checkWin(none, 2)).toEqual({ winner: 'survivor', reason: 'no-infected' });
  });

  it('keeps playing before round five while both teams have players', () => {
    expect(checkWin(roster, 4)).toBeNull();
  });

  it('gives the Survivors the win at round five if any Survivor remains', () => {
    expect(checkWin(roster, 5)).toEqual({ winner: 'survivor', reason: 'round-limit' });
  });

  it("gives Shisa's Army the win at round five only when no Survivor remains", () => {
    const allArmy = roster.map((p) => ({ ...p, team: 'infected' as const }));
    expect(checkWin(allArmy, 5)?.winner).toBe('infected');
  });
});

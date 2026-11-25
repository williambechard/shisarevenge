import { describe, expect, it } from 'vitest';
import { catchCold, recover } from './teamChanges.js';
import { checkWin } from './winConditions.js';

const roster = [
  { id: 'a', team: 'infected' as const },
  { id: 'b', team: 'survivor' as const },
  { id: 'c', team: 'survivor' as const },
];

describe('team changes', () => {
  it("moves a Survivor to Shisa's Army when they catch a cold", () => {
    expect(catchCold(roster, 'b').find((p) => p.id === 'b')?.team).toBe('infected');
  });

  it('does not change an Army member through catchCold', () => {
    expect(catchCold(roster, 'a')).toEqual(roster);
  });

  it('moves an Army member back to the Survivors on recovery', () => {
    expect(recover(roster, 'a').find((p) => p.id === 'a')?.team).toBe('survivor');
  });

  it('leaves Survivors unchanged on recovery', () => {
    expect(recover(roster, 'b')).toEqual(roster);
  });
});

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

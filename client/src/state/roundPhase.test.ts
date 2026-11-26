import { describe, expect, it } from 'vitest';
import { canChooseCard, opponentIn } from './roundPhase.js';

describe('canChooseCard', () => {
  it('allows a choice while the round is selecting or after another duel revealed', () => {
    expect(canChooseCard('selecting')).toBe(true);
    expect(canChooseCard('revealed')).toBe(true);
  });

  it('does not allow a choice before the round is paired or after it ends', () => {
    expect(canChooseCard('announce')).toBe(false);
    expect(canChooseCard('resolved')).toBe(false);
    expect(canChooseCard(null)).toBe(false);
  });
});

describe('opponentIn', () => {
  const pairings = [
    { a: 'p1', b: 'p2' },
    { a: 'p3', b: 'p4' },
  ];

  it('returns the other player in my pair, from either side', () => {
    expect(opponentIn(pairings, 'p1')).toBe('p2');
    expect(opponentIn(pairings, 'p4')).toBe('p3');
  });

  it('returns null when I am not paired this round', () => {
    expect(opponentIn(pairings, 'p9')).toBeNull();
    expect(opponentIn(pairings, null)).toBeNull();
  });
});

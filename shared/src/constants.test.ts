import { describe, expect, it } from 'vitest';
import { CARD_VALUES, MAX_PLAYERS, MIN_PLAYERS, ROUND_COUNT } from './constants.js';

describe('shared constants', () => {
  it('keeps the player range valid', () => {
    expect(MIN_PLAYERS).toBeLessThanOrEqual(MAX_PLAYERS);
  });

  it('uses five numbered cards and five rounds', () => {
    expect(CARD_VALUES).toEqual([1, 2, 3, 4, 5]);
    expect(ROUND_COUNT).toBe(5);
  });
});

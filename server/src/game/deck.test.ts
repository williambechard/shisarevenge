import { describe, expect, it } from 'vitest';
import { createHand } from './deck.js';

describe('createHand', () => {
  it('gives each player the five numbered cards once', () => {
    expect(createHand()).toEqual([1, 2, 3, 4, 5]);
  });

  it('returns a fresh array each time', () => {
    const first = createHand();
    first.pop();
    expect(createHand()).toHaveLength(5);
  });
});

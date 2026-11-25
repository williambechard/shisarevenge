import { describe, expect, it } from 'vitest';
import { KeyedLimiter, SlidingWindowLimiter } from './rateLimit.js';

describe('SlidingWindowLimiter', () => {
  it('allows up to the limit inside one window, then blocks', () => {
    const time = 0;
    const limiter = new SlidingWindowLimiter(3, 1000, () => time);
    expect([limiter.take(), limiter.take(), limiter.take()]).toEqual([true, true, true]);
    expect(limiter.take()).toBe(false);
  });

  it('allows again once old hits leave the window', () => {
    let time = 0;
    const limiter = new SlidingWindowLimiter(2, 1000, () => time);
    limiter.take();
    limiter.take();
    time = 1000;
    expect(limiter.take()).toBe(true);
  });
});

describe('KeyedLimiter', () => {
  it('limits each key separately', () => {
    const time = 0;
    const limiter = new KeyedLimiter(1, 60_000, () => time);
    expect(limiter.take('1.1.1.1')).toBe(true);
    expect(limiter.take('1.1.1.1')).toBe(false);
    expect(limiter.take('2.2.2.2')).toBe(true);
  });
});

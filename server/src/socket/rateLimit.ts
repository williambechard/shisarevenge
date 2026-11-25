// Sliding-window rate limiter. Used per socket for events and per IP for room creation.
// See design/03-guardrails.md section 4 and design/08-socket-contract.md section 8.

export type Clock = () => number;

export class SlidingWindowLimiter {
  private readonly hits: number[] = [];

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly now: Clock = () => Date.now(),
  ) {}

  // Returns true when the action is allowed and records it.
  take(): boolean {
    const current = this.now();
    const windowStart = current - this.windowMs;
    while (this.hits.length > 0 && (this.hits[0] ?? 0) <= windowStart) {
      this.hits.shift();
    }
    if (this.hits.length >= this.limit) return false;
    this.hits.push(current);
    return true;
  }
}

// Keeps one limiter per key, such as an IP address.
export class KeyedLimiter {
  private readonly limiters = new Map<string, SlidingWindowLimiter>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly now: Clock = () => Date.now(),
  ) {}

  take(key: string): boolean {
    let limiter = this.limiters.get(key);
    if (!limiter) {
      limiter = new SlidingWindowLimiter(this.limit, this.windowMs, this.now);
      this.limiters.set(key, limiter);
    }
    return limiter.take();
  }
}

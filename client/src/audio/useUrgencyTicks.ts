import { useEffect } from 'react';
import { playSfx } from './audioManager.js';

const WINDOW_MS = 10_000;
// The gap between ticks at 10 seconds left, and at the deadline. The ticks speed up in between.
const SLOWEST_MS = 1000;
const FASTEST_MS = 150;

// Ticks in the last ten seconds before the deadline. The gap shrinks as time runs out, for urgency.
export function useUrgencyTicks(deadline: number): void {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const schedule = (): void => {
      const remaining = deadline - Date.now();
      if (remaining <= 0) return;
      if (remaining > WINDOW_MS) {
        // Wait until the window opens. Wake at most once a second, so a clock change is noticed.
        timer = setTimeout(schedule, Math.min(remaining - WINDOW_MS, 1000));
        return;
      }
      playSfx('tick', 0.7);
      const share = remaining / WINDOW_MS;
      timer = setTimeout(schedule, FASTEST_MS + (SLOWEST_MS - FASTEST_MS) * share);
    };

    schedule();
    return () => {
      clearTimeout(timer);
    };
  }, [deadline]);
}

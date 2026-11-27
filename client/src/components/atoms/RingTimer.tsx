import { useEffect, useState } from 'react';

type RingTimerProps = {
  // Epoch milliseconds when the timer ends.
  deadline: number;
  // What the timer counts down to. Read by screen readers only, since the ring has no text.
  label: string;
};

const RADIUS = 14;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// A circle that starts full and empties as the deadline comes. Empty means time is up. The full circle is
// the time from when this timer first appears to the deadline, so mount it when the countdown starts.
export function RingTimer({ deadline, label }: RingTimerProps) {
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 250);
    return () => {
      clearInterval(interval);
    };
  }, []);

  const span = deadline - startedAt;
  const left = span > 0 ? Math.min(1, Math.max(0, (deadline - now) / span)) : 0;

  return (
    <span
      role="timer"
      aria-label={label}
      className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-navy/85 p-1 shadow-md"
    >
      <svg viewBox="0 0 36 36" aria-hidden="true" className="size-full -rotate-90">
        <circle
          cx="18"
          cy="18"
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          className="text-white/35"
        />
        <circle
          cx="18"
          cy="18"
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - left)}
          className="text-coral transition-[stroke-dashoffset] duration-300 ease-linear"
        />
      </svg>
    </span>
  );
}

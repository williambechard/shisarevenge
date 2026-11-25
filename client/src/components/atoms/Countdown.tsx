import { useEffect, useState } from 'react';

type CountdownProps = {
  // Epoch milliseconds when the timer ends.
  deadline: number;
  label: string;
};

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes)}:${String(seconds).padStart(2, '0')}`;
}

// Shows time left until the deadline. The role is "timer", so screen readers do not announce each tick.
export function Countdown({ deadline, label }: CountdownProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 250);
    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <p role="timer" className="text-sm font-semibold text-navy">
      {label} {formatRemaining(deadline - now)}
    </p>
  );
}

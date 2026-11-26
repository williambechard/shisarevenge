import { Spinner } from '../atoms/Spinner.js';

type WaitingIndicatorProps = {
  // What the player is waiting for, in words. Always set, so the wait is never unexplained.
  title: string;
  // Optional second line: why the wait happens, or what comes next.
  detail?: string;
  // Use sand on dark backgrounds, such as the pick panel.
  tone?: 'navy' | 'sand';
};

// A visible wait: a spinner, what is being waited on, and why. Use it wherever the app waits on
// another player, the server, or a timer.
export function WaitingIndicator({ title, detail, tone = 'navy' }: WaitingIndicatorProps) {
  const color = tone === 'sand' ? 'text-sand' : 'text-navy';
  const detailColor = tone === 'sand' ? 'text-sand/80' : 'text-navy/70';
  return (
    <div role="status" aria-live="polite" className={`flex items-start gap-3 text-sm ${color}`}>
      <span className="mt-0.5">
        <Spinner />
      </span>
      <div className="flex flex-col">
        <span className="font-semibold">{title}</span>
        {detail ? <span className={detailColor}>{detail}</span> : null}
      </div>
    </div>
  );
}

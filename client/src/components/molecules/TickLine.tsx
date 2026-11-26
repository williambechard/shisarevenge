import { MAX_PLAYERS } from '@shisa-revenge/shared';
import { Tick, type TickVariant } from '../atoms/Tick.js';

type TickLineProps = {
  survivors: number;
  infected: number;
};

// A battlefield-style count. Survivor ticks fill from the left and Shisa's Army ticks from the right.
// The side with more ticks is the leader, drawn taller, and the gap between them is the margin.
export function TickLine({ survivors, infected }: TickLineProps) {
  const leader = survivors > infected ? 'survivor' : infected > survivors ? 'infected' : null;
  const margin = Math.abs(survivors - infected);
  const leaderName = leader === 'survivor' ? 'Survivors' : "Shisa's Army";
  const caption =
    leader === null
      ? "Survivors and Shisa's Army are even."
      : `${leaderName} lead by ${String(margin)}.`;

  const slots = Array.from({ length: MAX_PLAYERS }, (_, index) => index);
  const variantOf = (index: number): TickVariant => {
    if (index < survivors) return 'survivor';
    if (index >= MAX_PLAYERS - infected) return 'infected';
    return 'empty';
  };

  return (
    <div className="flex flex-col gap-1">
      <div role="img" aria-label={caption} className="grid grid-cols-8 items-end gap-1">
        {slots.map((index) => {
          const variant = variantOf(index);
          return <Tick key={index} variant={variant} leading={variant === leader} />;
        })}
      </div>
      <div className="flex justify-between text-[10px] font-semibold uppercase tracking-wide text-navy/70">
        <span>Survivors</span>
        <span>Shisa&apos;s Army</span>
      </div>
    </div>
  );
}

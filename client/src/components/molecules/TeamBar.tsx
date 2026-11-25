import { ROUND_COUNT } from '@shisa-revenge/shared';

type TeamBarProps = {
  survivors: number;
  infected: number;
  round: number;
};

// Segmented progress bar: one segment per player. Army segments are filled and marked "A",
// Survivor segments are outlined and marked "S". Shows the Army win point, round ticks, and a caption.
export function TeamBar({ survivors, infected, round }: TeamBarProps) {
  const total = survivors + infected;
  const segments = [
    ...Array.from({ length: infected }, () => 'infected' as const),
    ...Array.from({ length: survivors }, () => 'survivor' as const),
  ];

  return (
    <section aria-label="Team progress" className="flex w-full flex-col gap-2">
      <div className="flex w-full gap-1">
        {segments.map((team, index) => (
          <span
            key={index}
            className={`flex h-7 min-w-0 flex-1 items-center justify-center rounded-md text-xs font-bold ${
              team === 'infected' ? 'bg-shisa text-sand' : 'border-2 border-navy bg-white text-navy'
            }`}
          >
            {team === 'infected' ? 'A' : 'S'}
          </span>
        ))}
      </div>
      <div className="flex justify-between px-1 text-[10px] text-navy/70">
        {Array.from({ length: ROUND_COUNT }, (_, index) => (
          <span
            key={index}
            className={index + 1 === round ? 'font-bold text-navy' : undefined}
            aria-current={index + 1 === round ? 'step' : undefined}
          >
            R{String(index + 1)}
          </span>
        ))}
      </div>
      <p className="text-sm text-navy">
        {survivors} Survivor{survivors === 1 ? '' : 's'} left. Shisa&apos;s Army needs all {total}.
      </p>
    </section>
  );
}

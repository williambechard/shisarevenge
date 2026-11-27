import { BarFill } from '../atoms/BarFill.js';

type TeamBarProps = {
  survivors: number;
  infected: number;
};

// One bar shared by both teams. Survivors fill from the left and Shisa's Army from the right, so the
// colour shows how much of the room each team controls. Starts mostly navy, and coral grows as the
// Army does.
export function TeamBar({ survivors, infected }: TeamBarProps) {
  const total = survivors + infected;
  const infectedPercent = total === 0 ? 0 : (infected / total) * 100;
  const survivorPercent = 100 - infectedPercent;
  const controlled = Math.round(infectedPercent);
  const caption =
    total === 0
      ? 'No players yet.'
      : `Shisa's Army controls ${String(controlled)}% and the Survivors control ${String(100 - controlled)}%.`;

  return (
    <div className="flex flex-col gap-1 rounded-lg bg-navy/85 px-2.5 py-1.5 text-white shadow-md">
      <div
        role="img"
        aria-label={caption}
        className="flex h-3.5 w-full overflow-hidden rounded-full border border-white/50"
      >
        <BarFill side="survivor" percent={survivorPercent} />
        <BarFill side="infected" percent={infectedPercent} />
      </div>
      <div className="flex justify-between text-[10px] font-semibold uppercase tracking-wide text-white">
        <span>Survivors {String(survivors)}</span>
        <span>Shisa&apos;s Army {String(infected)}</span>
      </div>
    </div>
  );
}

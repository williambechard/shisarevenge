export type BarSide = 'survivor' | 'infected';

const COLOUR: Record<BarSide, string> = {
  survivor: 'bg-navy',
  infected: 'bg-coral',
};

type BarFillProps = {
  side: BarSide;
  // This side's share of the bar, from 0 to 100.
  percent: number;
};

// One coloured part of a bar: a team's share of the whole. Its width animates when the share changes.
export function BarFill({ side, percent }: BarFillProps) {
  return (
    <span
      className={`block h-full transition-[width] duration-500 ease-out ${COLOUR[side]}`}
      style={{ width: `${String(percent)}%` }}
    />
  );
}

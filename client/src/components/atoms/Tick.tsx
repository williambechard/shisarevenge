export type TickVariant = 'survivor' | 'infected' | 'empty';

type TickProps = {
  variant: TickVariant;
  // The leading side's ticks stand taller.
  leading: boolean;
};

const COLOR: Record<TickVariant, string> = {
  survivor: 'bg-navy',
  infected: 'bg-coral',
  empty: 'border border-navy/25 bg-transparent',
};

// One tick on the team line: a single player's team.
export function Tick({ variant, leading }: TickProps) {
  return (
    <span
      className={`block w-full rounded-sm transition-all ${leading ? 'h-3.5' : 'h-2.5'} ${COLOR[variant]}`}
    />
  );
}

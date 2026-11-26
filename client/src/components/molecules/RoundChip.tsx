export type RoundChipState = 'past' | 'current' | 'upcoming';

const STYLE: Record<RoundChipState, string> = {
  past: 'bg-navy/15 text-navy/50',
  current: 'bg-coral text-sand ring-2 ring-gold',
  upcoming: 'border-2 border-navy/30 text-navy/70',
};

type RoundChipProps = {
  round: number;
  state: RoundChipState;
};

// One round on the round track. The current round is coral and ringed. Past rounds are faded.
export function RoundChip({ round, state }: RoundChipProps) {
  return (
    <span
      aria-current={state === 'current' ? 'step' : undefined}
      className={`flex size-9 items-center justify-center rounded-full text-sm font-bold transition-colors ${STYLE[state]}`}
    >
      R{String(round)}
    </span>
  );
}

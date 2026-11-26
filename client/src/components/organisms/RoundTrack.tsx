import { RoundChip, type RoundChipState } from '../molecules/RoundChip.js';

type RoundTrackProps = {
  current: number;
  total: number;
};

// The rounds of the match as chips, R1 to R5. The current round is styled apart from the rest.
export function RoundTrack({ current, total }: RoundTrackProps) {
  const rounds = Array.from({ length: total }, (_, index) => index + 1);
  const stateOf = (round: number): RoundChipState => {
    if (round < current) return 'past';
    if (round === current) return 'current';
    return 'upcoming';
  };

  return (
    <nav aria-label="Rounds" className="flex justify-center gap-2">
      {rounds.map((round) => (
        <RoundChip key={round} round={round} state={stateOf(round)} />
      ))}
    </nav>
  );
}

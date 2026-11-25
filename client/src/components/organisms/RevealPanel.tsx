import { CARD_NAMES, type CardValue } from '@shisa-revenge/shared';

type RevealPanelProps = {
  myValue: CardValue;
  opponentValue: CardValue;
  opponentName: string;
  winner: 'me' | 'opponent' | 'tie';
};

const OUTCOME_TEXT: Record<RevealPanelProps['winner'], string> = {
  me: 'You win the duel.',
  opponent: 'You lose the duel.',
  tie: 'Tie. Nothing changes.',
};

// Both cards are shown at once, after both players lock in.
export function RevealPanel({ myValue, opponentValue, opponentName, winner }: RevealPanelProps) {
  return (
    <section
      aria-labelledby="reveal-heading"
      className="flex flex-col gap-3 rounded-xl bg-white/70 p-4"
    >
      <h2 id="reveal-heading" className="text-sm font-semibold text-navy">
        Reveal
      </h2>
      <div className="grid grid-cols-2 gap-3 text-center">
        <div>
          <p className="text-xs text-navy/70">You</p>
          <p className="text-3xl font-bold">{myValue}</p>
          <p className="text-xs">{CARD_NAMES[myValue]}</p>
        </div>
        <div>
          <p className="text-xs text-navy/70">{opponentName}</p>
          <p className="text-3xl font-bold">{opponentValue}</p>
          <p className="text-xs">{CARD_NAMES[opponentValue]}</p>
        </div>
      </div>
      <p className="text-center font-semibold">{OUTCOME_TEXT[winner]}</p>
    </section>
  );
}

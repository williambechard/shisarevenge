import {
  CARD_NAMES,
  SPECIAL_NAMES,
  type CardValue,
  type DuelOutcome,
  type SpecialKind,
} from '@shisa-revenge/shared';

type RevealPanelProps = {
  myValue: CardValue;
  opponentValue: CardValue;
  opponentName: string;
  // The duel result from this player's view. A tie reads as 'tie'.
  result: DuelOutcome['result'];
  mySpecial: SpecialKind | null;
  opponentSpecial: SpecialKind | null;
};

const OUTCOME_TEXT: Record<DuelOutcome['result'], string> = {
  won: 'You win the duel.',
  lost: 'You lose the duel.',
  tie: 'Tie. Nothing changes.',
  blocked: 'Protection Talisman blocked the freeze. No team change.',
  repelled: 'You repelled the attack. No team change.',
  recovered: 'Ramen won. A member of Shisa’s Army returned to the Survivors.',
};

function committedText(special: SpecialKind | null): string {
  return special ? `Committed: ${SPECIAL_NAMES[special]}` : 'No special committed';
}

// Both cards and any committed specials are shown together, after both players lock in.
export function RevealPanel({
  myValue,
  opponentValue,
  opponentName,
  result,
  mySpecial,
  opponentSpecial,
}: RevealPanelProps) {
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
          <p className="text-xs text-navy/70">{committedText(mySpecial)}</p>
        </div>
        <div>
          <p className="text-xs text-navy/70">{opponentName}</p>
          <p className="text-3xl font-bold">{opponentValue}</p>
          <p className="text-xs">{CARD_NAMES[opponentValue]}</p>
          <p className="text-xs text-navy/70">{committedText(opponentSpecial)}</p>
        </div>
      </div>
      <p className="text-center font-semibold">{OUTCOME_TEXT[result]}</p>
    </section>
  );
}

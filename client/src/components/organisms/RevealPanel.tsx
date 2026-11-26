import {
  CARD_NAMES,
  SPECIAL_NAMES,
  SPECIAL_STRENGTH,
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
  // The special played by each side, or null when a number was played.
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

// What a side played, in words: a special by name and strength, or a number by its card name.
function playedText(value: CardValue, special: SpecialKind | null): string {
  if (special) return `${SPECIAL_NAMES[special]} (strength ${String(SPECIAL_STRENGTH[special])})`;
  return `${String(value)} ${CARD_NAMES[value]}`;
}

// The outcome of the duel, in words. The cards themselves are shown on the table.
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
      className="flex flex-col gap-2 rounded-xl bg-white/70 p-4 text-center"
    >
      <h2 id="reveal-heading" className="text-sm font-semibold text-navy">
        Reveal
      </h2>
      <p className="text-sm">
        You played {playedText(myValue, mySpecial)}. {opponentName} played{' '}
        {playedText(opponentValue, opponentSpecial)}.
      </p>
      <p className="font-semibold">{OUTCOME_TEXT[result]}</p>
    </section>
  );
}

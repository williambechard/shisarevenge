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

// A played special shows its name. A played number shows its card name.
function cardName(value: CardValue, special: SpecialKind | null): string {
  return special ? SPECIAL_NAMES[special] : CARD_NAMES[value];
}

// Both played cards are shown together, after both players lock in.
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
          <p className="text-xs">{cardName(myValue, mySpecial)}</p>
          {mySpecial ? (
            <p className="text-xs text-navy/70">Strength {String(SPECIAL_STRENGTH[mySpecial])}</p>
          ) : null}
        </div>
        <div>
          <p className="text-xs text-navy/70">{opponentName}</p>
          <p className="text-3xl font-bold">{opponentValue}</p>
          <p className="text-xs">{cardName(opponentValue, opponentSpecial)}</p>
          {opponentSpecial ? (
            <p className="text-xs text-navy/70">
              Strength {String(SPECIAL_STRENGTH[opponentSpecial])}
            </p>
          ) : null}
        </div>
      </div>
      <p className="text-center font-semibold">{OUTCOME_TEXT[result]}</p>
    </section>
  );
}

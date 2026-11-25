import { CARD_NAMES, CARD_VALUES, type CardValue } from '@shisa-revenge/shared';
import { Button } from '../atoms/Button.js';
import { NumberCard, type NumberCardState } from '../molecules/NumberCard.js';

type HandTrayProps = {
  hand: CardValue[];
  selected: CardValue | null;
  locked: boolean;
  onSelect: (value: CardValue) => void;
  onLockIn: () => void;
};

// The player's numbered cards at the bottom of the round screen. Used cards stay visible, struck through.
export function HandTray({ hand, selected, locked, onSelect, onLockIn }: HandTrayProps) {
  const stateFor = (value: CardValue): NumberCardState => {
    if (!hand.includes(value)) return 'used';
    if (value === selected) return 'selected';
    return 'available';
  };

  return (
    <section aria-labelledby="hand-heading" className="flex flex-col gap-3">
      <h2 id="hand-heading" className="text-sm font-semibold text-navy">
        Your cards
      </h2>
      <div className="flex gap-2">
        {CARD_VALUES.map((value) => (
          <NumberCard
            key={value}
            value={value}
            name={CARD_NAMES[value]}
            state={stateFor(value)}
            disabled={locked}
            onSelect={onSelect}
          />
        ))}
      </div>
      <Button onClick={onLockIn} disabled={locked || selected === null}>
        {locked ? 'Locked in' : 'Lock in'}
      </Button>
    </section>
  );
}

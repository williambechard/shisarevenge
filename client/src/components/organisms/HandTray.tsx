import {
  CARD_NAMES,
  CARD_VALUES,
  type CardValue,
  type PlayedCard,
  type SpecialKind,
  type SpecialStatus,
} from '@shisa-revenge/shared';
import { Button } from '../atoms/Button.js';
import { NumberCard, type NumberCardState } from '../molecules/NumberCard.js';
import { SpecialCard } from '../molecules/SpecialCard.js';

type HandTrayProps = {
  hand: CardValue[];
  selected: PlayedCard | null;
  locked: boolean;
  special: { kind: SpecialKind; status: SpecialStatus } | null;
  onSelect: (card: PlayedCard) => void;
  onLockIn: () => void;
};

// The player's cards at the bottom of the round screen. The special card is one more card here.
// Exactly one card is played each round. Used cards stay visible, struck through.
export function HandTray({ hand, selected, locked, special, onSelect, onLockIn }: HandTrayProps) {
  const stateFor = (value: CardValue): NumberCardState => {
    if (!hand.includes(value)) return 'used';
    if (selected?.type === 'number' && selected.value === value) return 'selected';
    return 'available';
  };

  const hasSelection = selected !== null;

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
            onSelect={(picked) => {
              onSelect({ type: 'number', value: picked });
            }}
          />
        ))}
      </div>
      <SpecialCard
        special={special}
        selected={selected?.type === 'special'}
        disabled={locked}
        onSelect={() => {
          onSelect({ type: 'special' });
        }}
      />
      <Button onClick={onLockIn} disabled={locked || !hasSelection}>
        {locked ? 'Locked in' : 'Lock in'}
      </Button>
    </section>
  );
}

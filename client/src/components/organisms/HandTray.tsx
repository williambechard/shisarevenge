import {
  CARD_NAMES,
  CARD_VALUES,
  SPECIAL_NAMES,
  type CardValue,
  type SpecialKind,
  type SpecialStatus,
} from '@shisa-revenge/shared';
import { Button } from '../atoms/Button.js';
import { NumberCard, type NumberCardState } from '../molecules/NumberCard.js';

type HandTrayProps = {
  hand: CardValue[];
  selected: CardValue | null;
  locked: boolean;
  special: { kind: SpecialKind; status: SpecialStatus } | null;
  specialArmed: boolean;
  onSelect: (value: CardValue) => void;
  onToggleSpecial: () => void;
  onLockIn: () => void;
};

// The player's numbered cards at the bottom of the round screen. Used cards stay visible, struck through.
// The special commit sits next to Lock in. It is offered only while the special is ready.
export function HandTray({
  hand,
  selected,
  locked,
  special,
  specialArmed,
  onSelect,
  onToggleSpecial,
  onLockIn,
}: HandTrayProps) {
  const stateFor = (value: CardValue): NumberCardState => {
    if (!hand.includes(value)) return 'used';
    if (value === selected) return 'selected';
    return 'available';
  };

  const canCommit = special?.status === 'available' && !locked;
  const specialName = special ? SPECIAL_NAMES[special.kind] : '';

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
      <div className="flex gap-2">
        {canCommit ? (
          <button
            type="button"
            aria-pressed={specialArmed}
            onClick={onToggleSpecial}
            className={`min-h-11 flex-1 rounded-xl border-2 px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-gold ${
              specialArmed
                ? 'border-coral bg-coral text-sand'
                : 'border-navy text-navy hover:bg-navy/10'
            }`}
          >
            {specialArmed ? `Using ${specialName}. Tap to cancel` : `Use ${specialName}`}
          </button>
        ) : null}
        <div className="flex-1">
          <Button onClick={onLockIn} disabled={locked || selected === null}>
            {locked ? 'Locked in' : 'Lock in'}
          </Button>
        </div>
      </div>
    </section>
  );
}

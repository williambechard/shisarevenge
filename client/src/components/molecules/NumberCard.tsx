import type { CardValue } from '@shisa-revenge/shared';
import { NUMBER_CARD_ART } from '../../assets/cards/index.js';

export type NumberCardState = 'available' | 'selected' | 'used';

type NumberCardProps = {
  value: CardValue;
  name: string;
  state: NumberCardState;
  disabled?: boolean;
  onSelect: (value: CardValue) => void;
};

// One numbered card, with its art. The state is also written out in words.
export function NumberCard({ value, name, state, disabled = false, onSelect }: NumberCardProps) {
  const unavailable = state === 'used' || disabled;
  const label = state === 'used' ? 'used' : state === 'selected' ? 'selected' : 'available';

  return (
    <button
      type="button"
      disabled={unavailable}
      aria-pressed={state === 'selected'}
      aria-label={`${String(value)} ${name}, ${label}`}
      onClick={() => {
        onSelect(value);
      }}
      className={`flex min-h-11 min-w-0 flex-1 flex-col items-center gap-1 overflow-hidden rounded-xl border-2 p-1 transition-colors focus-visible:outline-3 focus-visible:outline-gold disabled:cursor-not-allowed ${
        state === 'selected'
          ? 'border-coral ring-2 ring-coral'
          : state === 'used'
            ? 'border-navy/20 opacity-40 grayscale'
            : 'border-navy bg-white'
      }`}
    >
      <img
        src={NUMBER_CARD_ART[value]}
        alt=""
        className="aspect-[2/3] w-full rounded-md object-cover"
        draggable={false}
      />
      <span className="text-xs font-semibold text-navy">
        {String(value)} {name}
      </span>
      <span className="text-[10px] uppercase tracking-wide text-navy">{label}</span>
    </button>
  );
}

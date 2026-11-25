import type { CardValue } from '@shisa-revenge/shared';

export type NumberCardState = 'available' | 'selected' | 'used';

type NumberCardProps = {
  value: CardValue;
  name: string;
  state: NumberCardState;
  disabled?: boolean;
  onSelect: (value: CardValue) => void;
};

// One numbered card. Its state is shown in words as well as color.
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
      className={`flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl border-2 px-1 py-3 transition-colors focus-visible:outline-3 focus-visible:outline-gold disabled:cursor-not-allowed ${
        state === 'selected'
          ? 'border-coral bg-coral text-sand'
          : state === 'used'
            ? 'border-navy/20 bg-navy/5 text-navy/40 line-through'
            : 'border-navy bg-white text-navy'
      }`}
    >
      <span className="text-2xl font-bold">{value}</span>
      <span className="text-xs font-semibold">{name}</span>
      <span className="text-[10px] uppercase tracking-wide">{label}</span>
    </button>
  );
}

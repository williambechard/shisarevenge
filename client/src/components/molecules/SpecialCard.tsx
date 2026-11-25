import {
  SPECIAL_NAMES,
  SPECIAL_STRENGTH,
  type SpecialKind,
  type SpecialStatus,
} from '@shisa-revenge/shared';
import { SPECIAL_CARD_ART } from '../../assets/cards/index.js';

export type SpecialCardState = SpecialStatus | 'selected';

type SpecialCardProps = {
  special: { kind: SpecialKind; status: SpecialStatus } | null;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
};

// Each state has its own symbol and words, so the state does not rely on color alone.
const LABEL: Record<SpecialCardState, { symbol: string; label: string }> = {
  available: { symbol: '●', label: 'Ready to play' },
  selected: { symbol: '◉', label: 'Selected' },
  committed: { symbol: '◆', label: 'Played this round' },
  spent: { symbol: '○', label: 'Spent' },
  lost: { symbol: '✕', label: 'Lost' },
};

// The player's special card. It sits in the hand tray and is played like a number card.
// Only this player's own status is ever shown here.
export function SpecialCard({ special, selected, disabled, onSelect }: SpecialCardProps) {
  if (!special) {
    return <p className="text-sm text-navy/70">You hold no special card.</p>;
  }

  const state: SpecialCardState =
    selected && special.status === 'available' ? 'selected' : special.status;
  const { symbol, label } = LABEL[state];
  const name = SPECIAL_NAMES[special.kind];
  const strength = SPECIAL_STRENGTH[special.kind];
  const playable = special.status === 'available' && !disabled;
  const dimmed = special.status === 'spent' || special.status === 'lost';

  return (
    <button
      type="button"
      disabled={!playable}
      aria-pressed={state === 'selected'}
      aria-label={`${name}, strength ${String(strength)}, ${label}`}
      onClick={onSelect}
      className={`flex min-h-16 w-full items-center gap-3 rounded-xl border-2 p-2 text-left transition-colors focus-visible:outline-3 focus-visible:outline-gold disabled:cursor-not-allowed ${
        state === 'selected' ? 'border-coral bg-white ring-2 ring-coral' : 'border-navy bg-white/70'
      }`}
    >
      <img
        src={SPECIAL_CARD_ART[special.kind]}
        alt=""
        className={`aspect-[2/3] w-12 shrink-0 rounded-md object-cover ${dimmed ? 'opacity-50 grayscale' : ''}`}
        draggable={false}
      />
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-sm font-semibold text-navy">
          {name} <span className="font-normal">(strength {String(strength)})</span>
        </p>
        <p className="text-xs font-semibold text-navy">
          <span aria-hidden="true">{symbol} </span>
          {label}
        </p>
      </div>
    </button>
  );
}

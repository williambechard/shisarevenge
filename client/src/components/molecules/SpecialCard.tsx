import { SPECIAL_NAMES, type SpecialStatus, type SpecialKind } from '@shisa-revenge/shared';
import { SPECIAL_CARD_ART } from '../../assets/cards/index.js';

type SpecialCardProps = {
  special: { kind: SpecialKind; status: SpecialStatus } | null;
};

// Each status has its own symbol and words, so the state does not rely on color alone.
const STATUS: Record<SpecialStatus, { symbol: string; label: string }> = {
  available: { symbol: '●', label: 'Ready to use' },
  committed: { symbol: '◆', label: 'Committed this round' },
  spent: { symbol: '○', label: 'Spent' },
  lost: { symbol: '✕', label: 'Lost' },
};

// The player's one special card. Only this player's own status is ever shown here.
export function SpecialCard({ special }: SpecialCardProps) {
  if (!special) {
    return <p className="text-sm text-navy/70">You hold no special card.</p>;
  }

  const { symbol, label } = STATUS[special.status];
  const name = SPECIAL_NAMES[special.kind];
  const dimmed = special.status === 'spent' || special.status === 'lost';

  return (
    <section
      aria-label={`Special card: ${name}, ${label}`}
      className={`flex items-center gap-3 rounded-xl border-2 p-2 ${
        special.status === 'committed' ? 'border-coral bg-white' : 'border-navy bg-white/70'
      }`}
    >
      <img
        src={SPECIAL_CARD_ART[special.kind]}
        alt=""
        className={`aspect-[2/3] w-14 shrink-0 rounded-md object-cover ${dimmed ? 'grayscale opacity-60' : ''}`}
        draggable={false}
      />
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-sm font-semibold text-navy">{name}</p>
        <p className="text-xs font-semibold text-navy">
          <span aria-hidden="true">{symbol} </span>
          {label}
        </p>
      </div>
    </section>
  );
}

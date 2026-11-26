import { CARD_BACK_ART } from '../../assets/cards/index.js';

type CardCountBadgeProps = {
  // Cards the player holds, as shared at the last round summary.
  count: number;
};

// A small card back with the number of cards held printed on it. Shown above a player's token on the walkway.
export function CardCountBadge({ count }: CardCountBadgeProps) {
  return (
    <span
      aria-label={`${String(count)} ${count === 1 ? 'card' : 'cards'}`}
      className="flex h-7 w-5 items-center justify-center rounded-[3px] border border-navy bg-cover bg-center text-xs font-extrabold text-white shadow-md [text-shadow:0_1px_2px_rgb(0_0_0/0.9)]"
      style={{ backgroundImage: `url(${CARD_BACK_ART})` }}
    >
      {String(count)}
    </span>
  );
}

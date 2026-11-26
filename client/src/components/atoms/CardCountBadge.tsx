type CardCountBadgeProps = {
  // Cards the player holds, as shared at the last round summary.
  count: number;
};

// The number of cards a player holds, on a small plain card. Shown at the upper right of a player's icon.
export function CardCountBadge({ count }: CardCountBadgeProps) {
  return (
    <span
      aria-label={`${String(count)} ${count === 1 ? 'card' : 'cards'}`}
      className="flex h-8 w-5 items-center justify-center rounded-md border-2 border-navy bg-sand text-sm font-black text-navy shadow-md"
    >
      {String(count)}
    </span>
  );
}

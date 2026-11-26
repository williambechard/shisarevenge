type DirectionArrowProps = {
  // Change in tile position: which way the arrow points. Zero means no arrow.
  dx: number;
  dy: number;
  className?: string;
};

// An arrow pointing from the player's tile toward a neighbouring tile.
export function DirectionArrow({ dx, dy, className = '' }: DirectionArrowProps) {
  const degrees = (Math.atan2(dy, dx) * 180) / Math.PI;
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`pointer-events-none size-1/2 text-gold drop-shadow ${className}`}
      style={{ transform: `rotate(${String(degrees)}deg)` }}
    >
      <path
        d="M4 12h14M13 6l6 6-6 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

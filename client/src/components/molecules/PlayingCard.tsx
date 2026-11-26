import { motion } from 'motion/react';
import { CARD_BACK_ART } from '../../assets/cards/index.js';

type PlayingCardProps = {
  // The face art, shown when faceUp is true.
  front: string;
  faceUp: boolean;
  // Shared layout id. Cards with the same id animate between their positions.
  layoutId?: string | undefined;
  size?: 'hand' | 'table';
  className?: string;
};

const SIZE = {
  hand: 'h-24 w-16',
  table: 'h-32 w-[5.5rem]',
} as const;

// A card with a face and a back. It turns on its vertical axis, so the flip reads as 3D.
// Layout ids let Motion move the same card between the hand and the table.
export function PlayingCard({
  front,
  faceUp,
  layoutId,
  size = 'table',
  className = '',
}: PlayingCardProps) {
  return (
    <div className={`${SIZE[size]} [perspective:900px] ${className}`}>
      <motion.div
        {...(layoutId === undefined ? {} : { layoutId })}
        className="relative h-full w-full [transform-style:preserve-3d]"
        initial={false}
        animate={{ rotateY: faceUp ? 0 : 180 }}
        transition={{ type: 'spring', stiffness: 170, damping: 22 }}
      >
        <div className="absolute inset-0 overflow-hidden rounded-xl border-2 border-navy bg-white shadow-md [backface-visibility:hidden]">
          <img src={front} alt="" className="h-full w-full object-cover" draggable={false} />
        </div>
        <div className="absolute inset-0 overflow-hidden rounded-xl border-2 border-navy bg-navy shadow-md [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <img
            src={CARD_BACK_ART}
            alt=""
            className="h-full w-full object-cover"
            draggable={false}
          />
        </div>
      </motion.div>
    </div>
  );
}

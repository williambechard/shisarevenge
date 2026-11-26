import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { CARD_BACK_ART } from '../../assets/cards/index.js';

type PlayingCardProps = {
  // The face art, shown when faceUp is true.
  front: string;
  faceUp: boolean;
  // Shared layout id. Cards with the same id animate between their positions.
  layoutId?: string | undefined;
  size?: 'mini' | 'hand' | 'table' | 'preview';
  className?: string;
};

const SIZE = {
  mini: 'h-14 w-10',
  // Card heights follow the screen height, so the table and hand fit short phones without scrolling.
  hand: 'h-[clamp(4.5rem,15dvh,6rem)] aspect-[2/3]',
  table: 'h-[clamp(4.5rem,14dvh,8rem)] aspect-[2/3]',
  // Filling most of the screen, sized to keep the 2:3 card shape.
  preview: 'aspect-[2/3] w-[min(72vw,40vh)]',
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
  // The face turns only once its image has decoded, so it never turns while still blank.
  // A failed decode still turns the card, so a broken image cannot leave it face down.
  const [decodedFront, setDecodedFront] = useState<string | null>(null);
  useEffect(() => {
    let current = true;
    const image = new Image();
    image.src = front;
    const markReady = (): void => {
      if (current) setDecodedFront(front);
    };
    image.decode().then(markReady, markReady);
    return () => {
      current = false;
    };
  }, [front]);
  const showFace = faceUp && decodedFront === front;

  return (
    <div className={`${SIZE[size]} [perspective:900px] ${className}`}>
      <motion.div
        {...(layoutId === undefined ? {} : { layoutId })}
        className="relative h-full w-full [transform-style:preserve-3d]"
        initial={false}
        animate={{ rotateY: showFace ? 0 : 180 }}
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

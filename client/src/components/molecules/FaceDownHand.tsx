import { AnimatePresence, motion } from 'motion/react';
import { NUMBER_CARD_ART } from '../../assets/cards/index.js';
import { PlayingCard } from './PlayingCard.js';

type FaceDownHandProps = {
  // How many cards the player holds. Shown as the number of backs in the fan.
  count: number;
  // Hides the last card, which has been locked in and is moving to the table. It keeps its layout id.
  hideLast?: boolean;
  layoutId?: string;
};

// The opponent's cards, all face down. The number of backs shows how many cards they hold.
export function FaceDownHand({ count, hideLast = false, layoutId }: FaceDownHandProps) {
  const middle = (count - 1) / 2;
  return (
    <div
      role="img"
      aria-label={`${String(count)} face-down ${count === 1 ? 'card' : 'cards'}`}
      className="relative flex h-16 w-20 items-end justify-center"
    >
      <AnimatePresence initial={false}>
        {Array.from({ length: count }, (_, index) => {
          const offset = index - middle;
          const isHidden = hideLast && index === count - 1;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ x: offset * 9, rotate: offset * 5, opacity: isHidden ? 0 : 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.3 } }}
              transition={{ type: 'spring', stiffness: 240, damping: 24 }}
              className="absolute bottom-0"
            >
              <PlayingCard
                front={NUMBER_CARD_ART[1]}
                faceUp={false}
                size="mini"
                layoutId={isHidden ? layoutId : undefined}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { CARD_NAMES, type CardValue } from '@shisa-revenge/shared';
import { NUMBER_CARD_ART } from '../../assets/cards/index.js';
import { PlayingCard } from '../molecules/PlayingCard.js';

type GainedCardProps = {
  value: CardValue;
  // Called when the moment is over, so the screen can drop the overlay.
  onDone: () => void;
};

const FLIP_AFTER_MS = 450;
const HOLD_MS = 2200;

// The card the winner took. It rises toward the player, turns face up, and then moves down to the
// hand, where it joins the fan.
export function GainedCard({ value, onDone }: GainedCardProps) {
  const [faceUp, setFaceUp] = useState(false);

  useEffect(() => {
    const flip = setTimeout(() => {
      setFaceUp(true);
    }, FLIP_AFTER_MS);
    const done = setTimeout(() => {
      onDone();
    }, HOLD_MS);
    return () => {
      clearTimeout(flip);
      clearTimeout(done);
    };
  }, [onDone]);

  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-navy/75 p-4"
    >
      <motion.div
        initial={{ scale: 0.4, y: 120, rotate: -8 }}
        animate={{ scale: 1.3, y: 0, rotate: 0 }}
        exit={{ y: 320, scale: 0.6, opacity: 0, transition: { duration: 0.5 } }}
        transition={{ type: 'spring', stiffness: 150, damping: 17 }}
      >
        <PlayingCard front={NUMBER_CARD_ART[value]} faceUp={faceUp} size="preview" />
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: faceUp ? 1 : 0 }}
        className="text-center text-lg font-bold text-sand"
      >
        You took a {String(value)} {CARD_NAMES[value]}.
      </motion.p>
    </motion.div>
  );
}

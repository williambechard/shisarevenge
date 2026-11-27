import { motion } from 'motion/react';
import { SPECIAL_NAMES, type SpecialKind } from '@shisa-revenge/shared';
import { Button } from '../atoms/Button.js';

type ColdOverlayProps = {
  // The special this player lost to the cold, or null if they had none left to lose.
  lostSpecial: SpecialKind | null;
  // The special the cold gave them: the Shisa Mask.
  newSpecial: SpecialKind;
  onDone: () => void;
};

// Shown to the player who caught the cold, and to no one else. It says what happened and what it means.
// Drifting flakes, a shaking title, and a card-style panel that slides up make the change hard to miss.
export function ColdOverlay({ lostSpecial, newSpecial, onDone }: ColdOverlayProps) {
  const flakes = [0, 1, 2, 3, 4, 5, 6, 7];
  return (
    <motion.div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="cold-heading"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-navy/90 p-6 text-center text-sand"
    >
      {flakes.map((index) => (
        <motion.span
          key={index}
          aria-hidden="true"
          className="absolute top-0 size-2 rounded-full bg-white/80"
          style={{ left: `${String(8 + index * 12)}%` }}
          initial={{ y: -20, opacity: 0 }}
          animate={{
            y: ['-5%', '110%'],
            opacity: [0, 1, 1, 0],
            x: [0, index % 2 === 0 ? 14 : -14, 0],
          }}
          transition={{
            duration: 3 + (index % 3),
            delay: index * 0.3,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}

      <motion.div
        initial={{ y: 60, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 16 }}
        className="relative flex w-full max-w-sm flex-col gap-4 rounded-2xl bg-sand p-5 text-navy shadow-2xl"
      >
        <motion.h2
          id="cold-heading"
          initial={{ scale: 0.4, rotate: -6 }}
          animate={{ scale: [0.4, 1.25, 0.9, 1], rotate: [-6, 4, -3, 0] }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-3xl font-black text-shisa"
        >
          YOU CAUGHT A COLD
        </motion.h2>

        <p className="text-base font-semibold">
          You have switched sides. You are now on Shisa&apos;s Army.
        </p>
        <p className="text-sm">
          Your goal changes: spread the cold and help Shisa&apos;s Army win before the New Year.
          Your team badge in the header now shows Shisa&apos;s Army.
        </p>

        <div className="flex flex-col gap-1 rounded-xl bg-white/70 p-3 text-sm">
          <p>
            {lostSpecial
              ? `Your ${SPECIAL_NAMES[lostSpecial]} is gone. Survivor specials do not carry over.`
              : 'You had no Survivor special left to lose.'}
          </p>
          <p className="font-semibold">You now have a {SPECIAL_NAMES[newSpecial]}.</p>
        </div>

        <Button onClick={onDone}>Got it</Button>
      </motion.div>
    </motion.div>
  );
}

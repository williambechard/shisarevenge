import { motion } from 'motion/react';
import { Avatar } from '../molecules/Avatar.js';

type Fighter = { name: string; icon: number };

type LockInOverlayProps = {
  self: Fighter;
  partner: Fighter;
};

// Shown to both players of a challenge until the next round starts. Nothing else can be done meanwhile.
// The title bounces in and stretches, the icons slide in from either side, and the VS stretches.
export function LockInOverlay({ self, partner }: LockInOverlayProps) {
  return (
    <motion.div
      role="alertdialog"
      aria-modal="true"
      aria-label="Challenge declared"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 overflow-hidden bg-navy/90 p-6 text-center text-sand"
    >
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 bg-coral"
        initial={{ opacity: 0.85 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
      />

      <motion.h2
        initial={{ scale: 0, rotate: -14 }}
        animate={{
          scale: [0, 1.4, 0.8, 1.12, 1],
          rotate: [-14, 7, -4, 2, 0],
        }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
        className="text-4xl font-black tracking-wide text-bingata-yellow [text-shadow:0_4px_0_rgb(0_0_0/0.45)]"
      >
        CHALLENGE!
      </motion.h2>

      <div className="flex items-center gap-4">
        <motion.div
          initial={{ x: -160, opacity: 0, rotate: -30 }}
          animate={{ x: 0, opacity: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 12, delay: 0.25 }}
        >
          <Avatar name={self.name} icon={self.icon} self large />
        </motion.div>

        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.6, 1], scaleX: [1, 1.3, 0.85, 1], scaleY: [1, 0.8, 1.25, 1] }}
          transition={{ delay: 0.6, duration: 0.7 }}
          className="text-3xl font-black text-coral [text-shadow:0_3px_0_rgb(0_0_0/0.4)]"
        >
          VS
        </motion.span>

        <motion.div
          initial={{ x: 160, opacity: 0, rotate: 30 }}
          animate={{ x: 0, opacity: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 12, delay: 0.25 }}
        >
          <Avatar name={partner.name} icon={partner.icon} self={false} large />
        </motion.div>
      </div>

      <motion.p
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, type: 'spring', stiffness: 200, damping: 16 }}
        className="text-xl font-bold"
      >
        {self.name} vs {partner.name}
      </motion.p>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
        className="max-w-xs text-sm"
      >
        You are locked in for the next round. No wandering, no accusing, no interrupting. The match
        starts after the village.
      </motion.p>

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ scale: { repeat: Infinity, duration: 1.2, ease: 'easeInOut' }, delay: 1.3 }}
        className="rounded-full bg-bingata-yellow px-4 py-1 text-sm font-bold text-navy"
      >
        Waiting for the match to start
      </motion.div>
    </motion.div>
  );
}

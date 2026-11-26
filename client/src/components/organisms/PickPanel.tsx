import { motion } from 'motion/react';
import { NUMBER_CARD_ART } from '../../assets/cards/index.js';
import { Countdown } from '../atoms/Countdown.js';
import { PlayingCard } from '../molecules/PlayingCard.js';

type PickPanelProps = {
  // The player whose card is taken.
  loserName: string;
  // How many face-down cards the winner may take from. The values stay hidden.
  poolSize: number;
  // Epoch ms when the server takes a card at random.
  deadline: number;
  onPick: (index: number) => void;
};

// The blind pick: the loser's remaining cards, all face down. The winner taps one. Its value is
// shown only after it is taken, and only to the winner.
export function PickPanel({ loserName, poolSize, deadline, onPick }: PickPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-navy/80 p-4"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="pick-title"
        className="flex w-full max-w-sm flex-col items-center gap-4"
      >
        <h2 id="pick-title" className="text-lg font-bold text-sand">
          Take a card
        </h2>
        <p className="text-center text-sm text-sand">
          {loserName} holds <span className="text-2xl font-bold">{String(poolSize)}</span> number{' '}
          {poolSize === 1 ? 'card' : 'cards'} you can take. You will not see their values until you
          take one.
        </p>
        <div className="text-sand">
          <Countdown deadline={deadline} label="Choose before" />
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {Array.from({ length: poolSize }, (_, index) => {
            const tilt = (index - (poolSize - 1) / 2) * 5;
            return (
              <motion.button
                key={index}
                type="button"
                aria-label={`Face-down card ${String(index + 1)} of ${String(poolSize)}`}
                onClick={() => {
                  onPick(index);
                }}
                initial={{ opacity: 0, y: 50, rotate: tilt }}
                animate={{ opacity: 1, y: 0, rotate: tilt }}
                whileHover={{ y: -10, rotate: 0 }}
                transition={{ delay: index * 0.06, type: 'spring', stiffness: 220, damping: 20 }}
                className="rounded-xl focus-visible:outline-3 focus-visible:outline-gold"
              >
                <PlayingCard front={NUMBER_CARD_ART[1]} faceUp={false} size="hand" />
              </motion.button>
            );
          })}
        </div>
      </section>
    </motion.div>
  );
}

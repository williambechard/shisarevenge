import { AnimatePresence, motion } from 'motion/react';
import { NUMBER_CARD_ART } from '../../assets/cards/index.js';
import { PlayingCard } from '../molecules/PlayingCard.js';
import { PLAYED_LAYOUT_ID } from './HandTray.js';

type PlayAreaProps = {
  opponentName: string;
  // Art for the card this player locked in. Null before lock-in.
  mySlot: { front: string } | null;
  // Art for the opponent's card. Null until the duel reveals.
  opponentFront: string | null;
  // True once the duel has revealed. Both cards turn face up.
  revealed: boolean;
  // True once the cards have been shown long enough. Both cards then toss away.
  discarded: boolean;
};

// Played cards leave the table by tossing away.
const TOSS_AWAY = { y: -180, rotate: -14, opacity: 0, scale: 0.7, transition: { duration: 0.35 } };

// The table: the opponent's card on top, this player's card below. The card you lock in moves
// here from the fan. Both cards turn face up when the duel reveals, and toss away after a moment.
export function PlayArea({
  opponentName,
  mySlot,
  opponentFront,
  revealed,
  discarded,
}: PlayAreaProps) {
  return (
    <section aria-label="Table" className="flex flex-col items-center gap-3">
      <AnimatePresence>
        {discarded ? null : (
          <motion.div
            key="opponent"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={TOSS_AWAY}
            className="flex flex-col items-center gap-1"
          >
            <PlayingCard
              front={opponentFront ?? NUMBER_CARD_ART[1]}
              faceUp={revealed}
              size="table"
            />
            <p className="text-xs text-navy/70">{opponentName}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mySlot && !discarded ? (
          <motion.div
            key="mine"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={TOSS_AWAY}
            className="flex flex-col items-center gap-1"
          >
            <PlayingCard
              front={mySlot.front}
              faceUp={revealed}
              size="table"
              layoutId={PLAYED_LAYOUT_ID}
            />
            <p className="text-xs text-navy/70">You</p>
          </motion.div>
        ) : (
          <div
            key="empty"
            aria-hidden="true"
            className="h-32 w-[5.5rem] rounded-xl border-2 border-dashed border-navy/40"
          />
        )}
      </AnimatePresence>
    </section>
  );
}

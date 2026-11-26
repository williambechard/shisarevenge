import { AnimatePresence, motion } from 'motion/react';
import { NUMBER_CARD_ART } from '../../assets/cards/index.js';
import { FaceDownHand } from '../molecules/FaceDownHand.js';
import { PlayingCard } from '../molecules/PlayingCard.js';
import { PLAYED_LAYOUT_ID } from './HandTray.js';

// The layout id of the opponent's locked card, which moves from their hand to the table.
export const OPPONENT_PLAYED_LAYOUT_ID = 'played-opp';

type PlayAreaProps = {
  opponentName: string;
  // How many cards the opponent holds. Shown as their face-down hand.
  opponentCount: number;
  // True once the opponent has locked in. Their card then moves to the table.
  opponentLocked: boolean;
  // Art for the opponent's card. Null until the duel reveals.
  opponentFront: string | null;
  // Art for the card this player locked in. Null before lock-in.
  mySlot: { front: string } | null;
  // True once the duel has revealed. Both cards turn face up.
  revealed: boolean;
  // True once the cards have been shown long enough. Both cards then toss away.
  discarded: boolean;
};

// Played cards leave the table by tossing away.
const TOSS_AWAY = { y: -180, rotate: -14, opacity: 0, scale: 0.7, transition: { duration: 0.35 } };

// The duel: the opponent's face-down hand, then the table. A locked card moves from its hand to the
// table slot, turns face up at reveal, and tosses away. This player's card moves up from their hand.
export function PlayArea({
  opponentName,
  opponentCount,
  opponentLocked,
  opponentFront,
  mySlot,
  revealed,
  discarded,
}: PlayAreaProps) {
  const showOpponentCard = opponentLocked && !discarded;
  return (
    <section aria-label="Table" className="flex flex-col items-center gap-2">
      <div className="flex flex-col items-center gap-1">
        {opponentCount > 0 && !discarded ? (
          <FaceDownHand
            count={opponentCount}
            // Hidden only before the reveal. After it, the played card has already left their hand.
            hideLast={opponentLocked && !revealed}
            layoutId={OPPONENT_PLAYED_LAYOUT_ID}
          />
        ) : null}
        <p className="text-xs text-navy/70">{opponentName}</p>
      </div>

      <div className="flex flex-col items-center gap-2 [@media(max-height:760px)]:flex-row [@media(max-height:760px)]:gap-4">
        <AnimatePresence>
          {showOpponentCard ? (
            <motion.div
              key="opponent-card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={TOSS_AWAY}
            >
              <PlayingCard
                front={opponentFront ?? NUMBER_CARD_ART[1]}
                faceUp={revealed}
                size="table"
                layoutId={OPPONENT_PLAYED_LAYOUT_ID}
              />
            </motion.div>
          ) : (
            <div
              key="opponent-empty"
              aria-hidden="true"
              className="h-[clamp(4.5rem,14dvh,8rem)] aspect-[2/3] rounded-xl border-2 border-dashed border-navy/25"
            />
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
              key="mine-empty"
              aria-hidden="true"
              className="h-[clamp(4.5rem,14dvh,8rem)] aspect-[2/3] rounded-xl border-2 border-dashed border-navy/40"
            />
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

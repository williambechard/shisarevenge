import { useEffect } from 'react';
import { motion } from 'motion/react';
import type { PictureTour } from '../../assets/story/index.js';
import { DirectionArrow } from '../atoms/DirectionArrow.js';

// How long each arrow and its text stay up.
const TIP_SECONDS = 10;
// Points in the top half of the picture get their text below, and points in the bottom half get it above.
const MIDDLE = 50;
const ARROW_OFFSET = 14;

type StoryTourProps = {
  tour: PictureTour;
  // Which arrow is showing. The story screen owns this, so Next and taps move it on.
  step: number;
  // Called when the current arrow has been up for TIP_SECONDS, or when the player moves on by hand.
  onAdvance: () => void;
};

// Arrows and text laid over a picture, one tip at a time. Each tip stays for TIP_SECONDS, with a bar that
// empties to show the time left. The overlay ignores taps; the story screen handles them.
export function StoryTour({ tour, step, onAdvance }: StoryTourProps) {
  const tip = tour.steps[step];

  useEffect(() => {
    const handle = setTimeout(onAdvance, TIP_SECONDS * 1000);
    return () => {
      clearTimeout(handle);
    };
  }, [step, onAdvance]);

  if (!tip) return null;

  const x = (tip.x / tour.width) * 100;
  const y = (tip.y / tour.height) * 100;
  const below = y < MIDDLE;
  // Keep the text box inside the picture, even for a point near an edge.
  const boxCentre = Math.min(Math.max(x, 36), 64);

  return (
    <div aria-live="polite" className="pointer-events-none absolute inset-0">
      <motion.div
        key={`arrow-${String(step)}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, below ? -6 : 6, 0] }}
        transition={{ opacity: { duration: 0.3 }, y: { repeat: Infinity, duration: 0.9 } }}
        className="absolute flex size-8 -translate-x-1/2 items-center justify-center rounded-full bg-navy/85 shadow-lg"
        style={{
          left: `${String(x)}%`,
          top: below
            ? `calc(${String(y)}% + ${String(ARROW_OFFSET)}px)`
            : `calc(${String(y)}% - ${String(ARROW_OFFSET + 32)}px)`,
        }}
      >
        <DirectionArrow dx={0} dy={below ? -1 : 1} className="static" />
      </motion.div>

      <motion.div
        key={`tip-${String(step)}`}
        role="status"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="absolute flex w-[72%] -translate-x-1/2 flex-col gap-2 rounded-xl bg-navy/95 px-3 py-2 text-sm font-semibold text-white shadow-2xl"
        style={{
          left: `${String(boxCentre)}%`,
          ...(below
            ? { top: `calc(${String(y)}% + ${String(ARROW_OFFSET + 40)}px)` }
            : { bottom: `calc(${String(100 - y)}% + ${String(ARROW_OFFSET + 40)}px)` }),
        }}
      >
        <p>{tip.text}</p>
        <div className="h-1 w-full overflow-hidden rounded-full bg-white/25">
          <motion.div
            key={`bar-${String(step)}`}
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: TIP_SECONDS, ease: 'linear' }}
            className="h-full bg-gold"
          />
        </div>
      </motion.div>
    </div>
  );
}

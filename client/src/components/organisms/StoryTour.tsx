import { useEffect, useState } from 'react';
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
  // Called after the last tip.
  onDone: () => void;
};

// Arrows and text laid over a picture, one tip at a time. Each tip stays for TIP_SECONDS, with a bar that
// empties to show the time left. The overlay ignores taps.
export function StoryTour({ tour, onDone }: StoryTourProps) {
  const [index, setIndex] = useState(0);
  const step = tour.steps[index];

  useEffect(() => {
    const handle = setTimeout(() => {
      if (index + 1 >= tour.steps.length) {
        onDone();
      } else {
        setIndex(index + 1);
      }
    }, TIP_SECONDS * 1000);
    return () => {
      clearTimeout(handle);
    };
  }, [index, onDone, tour.steps.length]);

  if (!step) return null;

  const x = (step.x / tour.width) * 100;
  const y = (step.y / tour.height) * 100;
  const below = y < MIDDLE;
  // Keep the text box inside the picture, even for a point near an edge.
  const boxCentre = Math.min(Math.max(x, 36), 64);

  return (
    <div aria-live="polite" className="pointer-events-none absolute inset-0">
      <motion.div
        key={`arrow-${String(index)}`}
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
        key={`tip-${String(index)}`}
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
        <p>{step.text}</p>
        <div className="h-1 w-full overflow-hidden rounded-full bg-white/25">
          <motion.div
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

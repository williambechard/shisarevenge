import { useState } from 'react';
import { AnimatePresence, motion, type Variants } from 'motion/react';
import { Button } from '../atoms/Button.js';

type StoryScreenProps = {
  // The story pictures in reading order. Empty shows a short welcome instead.
  pages: readonly string[];
  // Called when the player finishes the story, or skips it.
  onDone: () => void;
};

// Each page slides in from the side the player is moving toward, tilts a little, and settles with a spring.
// The picture then drifts slowly, so the page never looks frozen.
const PAGE: Variants = {
  enter: (direction: number) => ({
    x: direction * 90,
    opacity: 0,
    scale: 0.9,
    rotate: direction * 3,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: { type: 'spring', stiffness: 220, damping: 24 },
  },
  exit: (direction: number) => ({
    x: direction * -90,
    opacity: 0,
    scale: 0.9,
    rotate: direction * -3,
    transition: { duration: 0.25 },
  }),
};

// The full-screen story: one picture per page, with Next, a dot for each page, and Skip.
export function StoryScreen({ pages, onDone }: StoryScreenProps) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const last = pages.length - 1;
  const current = pages[index];

  const next = (): void => {
    if (index >= last) {
      onDone();
      return;
    }
    setDirection(1);
    setIndex(index + 1);
  };

  return (
    <motion.section
      role="dialog"
      aria-modal="true"
      aria-label="The story"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-40 flex flex-col bg-navy text-sand"
    >
      <div className="flex items-center justify-between gap-4 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-2">
        <div className="flex items-center gap-2" aria-hidden="true">
          {pages.map((_, dot) => (
            <motion.span
              key={dot}
              animate={{ width: dot === index ? 22 : 8, opacity: dot <= index ? 1 : 0.35 }}
              transition={{ duration: 0.3 }}
              className="block h-2 rounded-full bg-sand"
            />
          ))}
        </div>
        <button
          type="button"
          onClick={onDone}
          className="rounded-full border border-sand/60 px-3 py-1 text-sm font-semibold text-sand focus-visible:outline-3 focus-visible:outline-gold"
        >
          Skip
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          {current !== undefined ? (
            <motion.div
              key={index}
              custom={direction}
              variants={PAGE}
              initial="enter"
              animate="center"
              exit="exit"
              onClick={next}
              className="absolute inset-0 flex items-center justify-center p-3"
            >
              <motion.img
                src={current}
                alt={`Story picture ${String(index + 1)} of ${String(pages.length)}`}
                draggable={false}
                initial={{ scale: 1.05 }}
                animate={{ scale: 1 }}
                transition={{ duration: 6, ease: 'easeOut' }}
                className="max-h-full max-w-full object-contain"
              />
            </motion.div>
          ) : (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center gap-3 p-6 text-center"
            >
              <h1 className="text-3xl font-black text-bingata-yellow">Shisa Revenge</h1>
              <p className="max-w-xs text-base">
                Survive the winter, spread the cold, and do not get caught.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <Button onClick={next}>{index >= last ? 'Start playing' : 'Next'}</Button>
      </div>
    </motion.section>
  );
}

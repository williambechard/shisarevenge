import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { DirectionArrow } from '../atoms/DirectionArrow.js';

type TourStep = {
  // The data-tour value of the element the arrow points at.
  target: string;
  text: string;
};

// The tips on the village screen, in order. Each one is up for STEP_MS.
export const VILLAGE_TOUR: readonly TourStep[] = [
  {
    target: 'team',
    text: "Top of the screen shows the status of the Survivors against the infected Shisa's Army.",
  },
  { target: 'timer', text: 'This shows how much time until the next Duel starts.' },
  {
    target: 'machine',
    text: 'Exchange duplicate cards for a random one at the vending machine.',
  },
  { target: 'self', text: 'Move freely around the village area.' },
  {
    target: 'player',
    text: 'Colliding with another player lets you accuse them (costs 1 card), or challenge them to a match, locking them in as your opponent.',
  },
];

const STEP_MS = 5000;
// Space between the target and the arrow, and between the arrow and the text.
const ARROW_GAP = 4;
const ARROW_SIZE = 32;
const BUBBLE_WIDTH = 300;

type Box = { top: number; bottom: number; centreX: number };

// Where the element with this data-tour value sits on screen, or null when it is not shown.
function measure(target: string): Box | null {
  const element = document.querySelector(`[data-tour="${target}"]`);
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  return { top: rect.top, bottom: rect.bottom, centreX: rect.left + rect.width / 2 };
}

// A guided tour over the village screen. Each tip points at a real element for five seconds, with a bar
// that empties to show the time left. The overlay ignores taps, so the player can keep moving meanwhile.
export function VillageTour({ onDone }: { onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const step = VILLAGE_TOUR[index];

  // Measure the target once it has rendered, and again when the screen is resized.
  useEffect(() => {
    if (!step) return;
    const update = (): void => {
      setBox(measure(step.target));
    };
    const first = setTimeout(update, 0);
    window.addEventListener('resize', update);
    return () => {
      clearTimeout(first);
      window.removeEventListener('resize', update);
    };
  }, [step]);

  // Move to the next tip after STEP_MS. After the last tip, the tour ends.
  useEffect(() => {
    const handle = setTimeout(() => {
      if (index + 1 >= VILLAGE_TOUR.length) {
        onDone();
      } else {
        setIndex(index + 1);
      }
    }, STEP_MS);
    return () => {
      clearTimeout(handle);
    };
  }, [index, onDone]);

  if (!step) return null;

  const width = Math.min(BUBBLE_WIDTH, window.innerWidth - 32);
  const centre = window.innerWidth / 2;
  // Points below the target when it sits in the top half, so the tip never leaves the screen.
  const pointsDown = box !== null && box.top > window.innerHeight / 2;
  const arrowLeft = box ? box.centreX - ARROW_SIZE / 2 : centre - ARROW_SIZE / 2;
  const bubbleLeft = Math.min(
    Math.max(16, (box ? box.centreX : centre) - width / 2),
    window.innerWidth - width - 16,
  );

  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-0 z-50">
      {box ? (
        <motion.div
          key={`arrow-${String(index)}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, pointsDown ? -8 : 8, 0] }}
          transition={{ opacity: { duration: 0.2 }, y: { repeat: Infinity, duration: 0.9 } }}
          className="absolute flex items-center justify-center rounded-full bg-navy/80 shadow-lg"
          style={{
            left: arrowLeft,
            width: ARROW_SIZE,
            height: ARROW_SIZE,
            top: pointsDown ? box.top - ARROW_SIZE - ARROW_GAP : box.bottom + ARROW_GAP,
          }}
        >
          <DirectionArrow dx={0} dy={pointsDown ? 1 : -1} className="static" />
        </motion.div>
      ) : null}

      <motion.div
        key={`tip-${String(index)}`}
        role="status"
        initial={{ opacity: 0, scale: 0.9, y: pointsDown ? 10 : -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="absolute flex flex-col gap-2 rounded-xl bg-navy/95 px-4 py-3 text-sm font-semibold text-white shadow-2xl"
        style={{
          width,
          left: bubbleLeft,
          ...(box === null
            ? { top: '40%' }
            : pointsDown
              ? { bottom: window.innerHeight - box.top + ARROW_SIZE + ARROW_GAP * 2 }
              : { top: box.bottom + ARROW_SIZE + ARROW_GAP * 2 }),
        }}
      >
        <p>{step.text}</p>
        <div className="h-1 w-full overflow-hidden rounded-full bg-white/25">
          <motion.div
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: STEP_MS / 1000, ease: 'linear' }}
            className="h-full bg-gold"
          />
        </div>
      </motion.div>
    </div>
  );
}

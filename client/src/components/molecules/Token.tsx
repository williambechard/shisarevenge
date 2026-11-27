import { useEffect, useRef, type ReactNode } from 'react';
import { animate, motion, useAnimate } from 'motion/react';
import { SHISA_MASK_ART } from '../../assets/village/index.js';
import { Avatar } from './Avatar.js';

// A recoil after a meeting: once the token has arrived, it bumps in direction (dx, dy) and settles back.
export type Bounce = { dx: number; dy: number; at: number } | null;

type TokenProps = {
  name: string;
  // Index of the player's icon.
  icon: number;
  self: boolean;
  // Tile position on the board.
  x: number;
  y: number;
  cols: number;
  rows: number;
  // Horizontal offset in pixels, so two tokens on one tile sit side by side.
  spread: number;
  bounce: Bounce;
  // Shown above the token, such as the card count.
  badge?: ReactNode;
  // Wears the Shisa mask.
  masked: boolean;
};

// The Shisa mask worn by revealed Shisa's Army members. Tune the position here: left and top are the mask centre,
// as a percentage of the icon, and width is a percentage of the icon width.
const MASK_STYLE = { left: '50%', top: '40%', width: '150%' } as const;
const MOVE_MS = 450;
const BOUNCE_MS = 300;
// How far the token recoils, in pixels.
const LUNGE_PX = 8;
// A bounce older than this is not replayed, so a page reload does not repeat it.
const BOUNCE_FRESH_MS = 2000;

// A player's token. It glides from tile to tile with ease-in/out, and squashes and stretches along the
// way of travel: stretched as it leaves, squashed as it lands.
export function Token({
  name,
  icon,
  self,
  x,
  y,
  cols,
  rows,
  spread,
  bounce,
  badge,
  masked,
}: TokenProps) {
  const [scope, animateInner] = useAnimate<HTMLDivElement>();
  const last = useRef({ x, y });
  const bounceAt = bounce?.at;

  useEffect(() => {
    const previous = last.current;
    last.current = { x, y };
    const dx = Math.sign(x - previous.x);
    const dy = Math.sign(y - previous.y);
    const element = scope.current;
    if (dx === 0 && dy === 0) return;
    const horizontal = dx !== 0;
    void animateInner(
      element,
      {
        scaleX: horizontal ? [1, 1.3, 0.8, 1] : [1, 0.8, 1.2, 1],
        scaleY: horizontal ? [1, 0.8, 1.2, 1] : [1, 1.3, 0.8, 1],
      },
      { duration: MOVE_MS / 1000, ease: 'easeInOut' },
    );
  }, [x, y, scope, animateInner]);

  useEffect(() => {
    const element = scope.current;
    if (!bounce || bounceAt === undefined) return;
    if (Date.now() - bounceAt > BOUNCE_FRESH_MS) return;
    void animate(
      element,
      {
        x: [0, bounce.dx * LUNGE_PX, 0],
        y: [0, bounce.dy * LUNGE_PX, 0],
      },
      { duration: BOUNCE_MS / 1000, delay: MOVE_MS / 1000, ease: 'easeInOut' },
    );
    // The bounce plays once per meeting, keyed by its time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bounceAt]);

  return (
    <motion.div
      className="pointer-events-none absolute flex items-center justify-center"
      style={{ width: `${String(100 / cols)}%`, height: `${String(100 / rows)}%` }}
      initial={false}
      animate={{
        left: `${String((x / cols) * 100)}%`,
        top: `${String((y / rows) * 100)}%`,
        x: `${String(spread)}px`,
      }}
      transition={{ duration: MOVE_MS / 1000, ease: 'easeInOut' }}
    >
      <div ref={scope} className="relative flex items-center justify-center">
        <Avatar name={name} icon={icon} self={self} />
        {masked ? (
          <img
            src={SHISA_MASK_ART}
            alt=""
            aria-hidden="true"
            draggable={false}
            className="pointer-events-none absolute aspect-square -translate-x-1/2 -translate-y-1/2"
            style={{ left: MASK_STYLE.left, top: MASK_STYLE.top, width: MASK_STYLE.width }}
          />
        ) : null}
        {badge ? <div className="absolute -top-2 -right-3">{badge}</div> : null}
      </div>
    </motion.div>
  );
}

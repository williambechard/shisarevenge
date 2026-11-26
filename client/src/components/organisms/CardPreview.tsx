import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Button } from '../atoms/Button.js';
import { PlayingCard } from '../molecules/PlayingCard.js';
import type { CardInfo } from './cardText.js';

type CardPreviewProps = {
  front: string;
  info: CardInfo;
  layoutId: string;
  onLock: () => void;
  onBack: () => void;
};

// The card, enlarged to fill most of the screen, with its text. Lock in plays it. Back returns to
// the hand without locking anything. Escape also goes back.
export function CardPreview({ front, info, layoutId, onLock, onBack }: CardPreviewProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Move focus into the dialog when it opens, so keyboard and screen reader users land in it.
  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onBack();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, [onBack]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-navy/80 p-4"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="preview-title"
        tabIndex={-1}
        className="flex w-full max-w-sm flex-col items-center gap-4 outline-none"
      >
        <PlayingCard front={front} faceUp size="preview" layoutId={layoutId} />

        <div className="w-full rounded-xl bg-white p-4 text-navy">
          <h2 id="preview-title" className="text-lg font-bold">
            {info.title}
          </h2>
          {info.summary ? <p className="font-semibold">{info.summary}</p> : null}
          {info.detail ? <p className="text-sm">{info.detail}</p> : null}
        </div>

        <div className="flex w-full gap-2">
          <div className="flex-1">
            <Button variant="onDark" onClick={onBack}>
              Back
            </Button>
          </div>
          <div className="flex-1">
            <Button onClick={onLock}>Lock in</Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

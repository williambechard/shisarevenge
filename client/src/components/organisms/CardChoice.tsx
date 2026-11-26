import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import type { PlayedCard } from '@shisa-revenge/shared';
import { PlayingCard } from '../molecules/PlayingCard.js';
import { CardPreview } from './CardPreview.js';
import type { CardInfo } from './cardText.js';

export type ChoiceItem = {
  key: string;
  card: PlayedCard;
  front: string;
  // Name for screen readers.
  label: string;
  // Text shown on the preview.
  info: CardInfo;
};

type CardChoiceProps = {
  items: ChoiceItem[];
  // Text on the preview's action button, such as "Insert" or "Accuse Habu".
  actionLabel: string;
  // Shared layout id. The chosen card zooms from its place in the row to the preview.
  layoutId: string;
  onChoose: (card: PlayedCard) => void;
};

// Cards laid side by side. Tapping one opens the same preview as the duel screen: the card zooms up
// with its text, and the action button or Back decides what happens.
export function CardChoice({ items, actionLabel, layoutId, onChoose }: CardChoiceProps) {
  const [previewKey, setPreviewKey] = useState<string | null>(null);
  const previewing = items.find((item) => item.key === previewKey);

  return (
    <>
      <div className="flex flex-wrap justify-center gap-3">
        {items.map((item) => (
          <button
            key={item.key}
            type="button"
            aria-label={item.label}
            onClick={() => {
              setPreviewKey(item.key);
            }}
            className="rounded-xl focus-visible:outline-3 focus-visible:outline-gold"
          >
            <PlayingCard
              front={item.front}
              faceUp
              size="hand"
              layoutId={item.key === previewKey ? layoutId : undefined}
            />
          </button>
        ))}
      </div>

      <AnimatePresence>
        {previewing ? (
          <CardPreview
            key="preview"
            front={previewing.front}
            info={previewing.info}
            layoutId={layoutId}
            actionLabel={actionLabel}
            onLock={() => {
              setPreviewKey(null);
              onChoose(previewing.card);
            }}
            onBack={() => {
              setPreviewKey(null);
            }}
          />
        ) : null}
      </AnimatePresence>
    </>
  );
}

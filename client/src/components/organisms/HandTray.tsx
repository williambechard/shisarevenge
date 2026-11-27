import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  CARD_NAMES,
  SPECIAL_NAMES,
  SPECIAL_STRENGTH,
  type CardValue,
  type PlayedCard,
  type SpecialKind,
  type SpecialStatus,
} from '@shisa-revenge/shared';
import { NUMBER_CARD_ART, SPECIAL_CARD_ART } from '../../assets/cards/index.js';
import { PlayingCard } from '../molecules/PlayingCard.js';
import { playSfx } from '../../audio/audioManager.js';
import { CardPreview } from './CardPreview.js';
import { cardInfo } from './cardText.js';

// The shared layout id that links a card in the fan to the same card on the preview and the table.
export const PLAYED_LAYOUT_ID = 'played-me';

type HandTrayProps = {
  // Number cards actually held. Duplicates are possible after a take.
  hand: CardValue[];
  selected: PlayedCard | null;
  // The card locked in this round. It stays in the fan, hidden, until the round ends.
  lockedCard: PlayedCard | null;
  locked: boolean;
  special: { kind: SpecialKind; status: SpecialStatus } | null;
  onSelect: (card: PlayedCard) => void;
  onLockIn: (card: PlayedCard) => void;
};

type FanItem = {
  key: string;
  card: PlayedCard;
  front: string;
  label: string;
  usable: boolean;
};

// A card played or taken leaves the fan by tossing away. A new card drops in from above.
const TOSS_OUT = { y: -170, rotate: 16, opacity: 0, scale: 0.6, transition: { duration: 0.35 } };
const DROP_IN = { opacity: 0, y: -110, scale: 0.6 };

function sameCard(a: PlayedCard | null, b: PlayedCard): boolean {
  if (a === null) return false;
  if (a.type === 'special' || b.type === 'special') return a.type === b.type;
  return a.value === b.value;
}

// The fan: every card the player holds, spread around a pivot below. Tapping a usable card selects
// it and opens a preview. Lock in happens on the preview. The locked card stays hidden in the fan
// while it is on the table, and it carries the same layout id so Motion moves it there.
export function HandTray({
  hand,
  selected,
  lockedCard,
  locked,
  special,
  onSelect,
  onLockIn,
}: HandTrayProps) {
  const [previewCard, setPreviewCard] = useState<PlayedCard | null>(null);
  // The preview closes on its own once the card is locked.
  const previewing = previewCard !== null && !locked ? previewCard : null;

  // One item per card held. The key counts duplicates, so each copy has its own element.
  const seen = new Map<CardValue, number>();
  const items: FanItem[] = hand.map((value) => {
    const occurrence = seen.get(value) ?? 0;
    seen.set(value, occurrence + 1);
    const card: PlayedCard = { type: 'number', value };
    return {
      key: `n${String(value)}-${String(occurrence)}`,
      card,
      front: NUMBER_CARD_ART[value],
      label: `${String(value)} ${CARD_NAMES[value]}`,
      usable: !locked,
    };
  });

  // A special stays in the fan while it is unplayed. Once spent it leaves the hand.
  if (special && (special.status === 'available' || special.status === 'committed')) {
    items.push({
      key: 'special',
      card: { type: 'special' },
      front: SPECIAL_CARD_ART[special.kind],
      label: SPECIAL_NAMES[special.kind],
      usable: special.status === 'available' && !locked,
    });
  }

  // The locked card is the first copy in the fan that matches it.
  const lockedKey = items.find((item) => sameCard(lockedCard, item.card))?.key;
  const selectedKey = items.find((item) => sameCard(selected, item.card))?.key;
  const previewKey = previewing
    ? items.find((item) => sameCard(previewing, item.card))?.key
    : undefined;
  const previewItem = items.find((item) => item.key === previewKey);

  const count = items.length;
  const spacing = count > 6 ? Math.max(24, 42 - (count - 6) * 4) : 42;
  const tilt = count > 6 ? 4 : 6;
  const middle = (count - 1) / 2;
  const selectedLabel = selected ? labelFor(selected, special) : 'Pick a card';

  return (
    <section aria-labelledby="hand-heading" className="flex flex-col gap-3">
      <h2 id="hand-heading" className="text-sm font-semibold text-navy">
        Your cards
      </h2>

      <div className="relative flex h-[clamp(5.5rem,17dvh,8rem)] items-end justify-center">
        <AnimatePresence initial={false}>
          {items.map((item, index) => {
            const offset = index - middle;
            const isSelected = item.key === selectedKey;
            const isLocked = item.key === lockedKey;
            const isPreviewed = item.key === previewKey;
            const state = isLocked ? 'locked' : isSelected ? 'selected' : 'available';
            // The layout id is on the card that is previewed or locked, so it travels to the next place.
            const layoutId = isLocked || isPreviewed ? PLAYED_LAYOUT_ID : undefined;
            return (
              <motion.div
                key={item.key}
                initial={DROP_IN}
                animate={{
                  x: offset * spacing,
                  y: Math.abs(offset) * 6 - (isSelected ? 26 : 0),
                  rotate: offset * tilt,
                  scale: isSelected ? 1.08 : 1,
                  opacity: isLocked ? 0 : 1,
                }}
                exit={TOSS_OUT}
                transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                style={{ zIndex: isSelected ? 20 : 10 + index }}
                className="absolute bottom-0"
              >
                <button
                  type="button"
                  disabled={!item.usable}
                  aria-pressed={isSelected}
                  aria-label={`${item.label}, ${state}`}
                  onClick={() => {
                    playSfx('select');
                    onSelect(item.card);
                    setPreviewCard(item.card);
                  }}
                  className="rounded-xl focus-visible:outline-3 focus-visible:outline-gold disabled:cursor-not-allowed"
                >
                  <PlayingCard front={item.front} faceUp size="hand" layoutId={layoutId} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <p className="min-h-5 text-center text-sm text-navy" aria-live="polite">
        {locked
          ? 'Locked in. Waiting for your opponent.'
          : selected
            ? `Selected: ${selectedLabel}. Tap it to review and lock in.`
            : 'Tap a card to review it.'}
      </p>

      {special ? <SpecialStatusLine status={special.status} /> : null}

      <AnimatePresence>
        {previewItem ? (
          <CardPreview
            key="preview"
            front={previewItem.front}
            info={cardInfo(previewItem.card, special?.kind ?? null)}
            layoutId={PLAYED_LAYOUT_ID}
            onLock={() => {
              setPreviewCard(null);
              onLockIn(previewItem.card);
            }}
            onBack={() => {
              setPreviewCard(null);
            }}
          />
        ) : null}
      </AnimatePresence>
    </section>
  );
}

// A card's name for the status line. A special shows its strength.
function labelFor(card: PlayedCard, special: { kind: SpecialKind } | null): string {
  if (card.type === 'number') return `${String(card.value)} ${CARD_NAMES[card.value]}`;
  if (!special) return 'Special card';
  return `${SPECIAL_NAMES[special.kind]}, strength ${String(SPECIAL_STRENGTH[special.kind])}`;
}

// The special card's status, written out so it does not rely on color alone.
function SpecialStatusLine({ status }: { status: SpecialStatus }) {
  const text: Record<SpecialStatus, string> = {
    available: 'Your special card is ready to play.',
    committed: 'Your special card is played this round.',
    spent: 'Your special card is spent.',
    lost: 'Your special card is lost.',
  };
  return <p className="text-xs text-navy/70">{text[status]}</p>;
}

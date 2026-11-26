import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  CARD_NAMES,
  CARD_VALUES,
  SPECIAL_NAMES,
  SPECIAL_STRENGTH,
  type CardValue,
  type PlayedCard,
  type SpecialKind,
  type SpecialStatus,
} from '@shisa-revenge/shared';
import { NUMBER_CARD_ART, SPECIAL_CARD_ART } from '../../assets/cards/index.js';
import { PlayingCard } from '../molecules/PlayingCard.js';
import { CardPreview } from './CardPreview.js';
import { cardInfo } from './cardText.js';

// The shared layout id that links a card in the fan to the same card on the preview and the table.
export const PLAYED_LAYOUT_ID = 'played-me';

type HandTrayProps = {
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
  // Can be picked right now.
  usable: boolean;
  // Already used this match, or no longer held.
  used: boolean;
};

function keyOf(card: PlayedCard): string {
  return card.type === 'number' ? `n${String(card.value)}` : 'special';
}

function sameCard(a: PlayedCard | null, b: PlayedCard): boolean {
  return a !== null && keyOf(a) === keyOf(b);
}

// The fan: every card the player owns this round, spread around a pivot below.
// Tapping a usable card selects it and opens a preview. Lock in happens on the preview.
// A used card stays in place, dimmed. The locked card stays in place but hidden, and the table card
// carries the same layout id, so Motion animates it from here to the table.
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

  const items: FanItem[] = CARD_VALUES.map((value) => {
    const card: PlayedCard = { type: 'number', value };
    const held = hand.includes(value);
    return {
      key: keyOf(card),
      card,
      front: NUMBER_CARD_ART[value],
      label: `${String(value)} ${CARD_NAMES[value]}`,
      usable: held && !locked,
      used: !held,
    };
  });

  if (special) {
    const card: PlayedCard = { type: 'special' };
    items.push({
      key: keyOf(card),
      card,
      front: SPECIAL_CARD_ART[special.kind],
      label: SPECIAL_NAMES[special.kind],
      usable: special.status === 'available' && !locked,
      used: special.status !== 'available',
    });
  }

  const middle = (items.length - 1) / 2;
  const previewItem = previewing
    ? items.find((item) => sameCard(previewing, item.card))
    : undefined;
  const selectedLabel = selected ? labelFor(selected, special) : 'Pick a card';

  return (
    <section aria-labelledby="hand-heading" className="flex flex-col gap-3">
      <h2 id="hand-heading" className="text-sm font-semibold text-navy">
        Your cards
      </h2>

      <div className="relative flex h-36 items-end justify-center">
        {items.map((item, index) => {
          const offset = index - middle;
          const isSelected = sameCard(selected, item.card);
          const isLocked = sameCard(lockedCard, item.card);
          const isPreviewed = sameCard(previewing, item.card);
          const state = item.used
            ? 'used'
            : isLocked
              ? 'locked'
              : isSelected
                ? 'selected'
                : 'available';
          // The layout id is on the card that is previewed or locked, so it travels to the next place.
          const layoutId = isLocked || isPreviewed ? PLAYED_LAYOUT_ID : undefined;
          return (
            <motion.div
              key={item.key}
              initial={false}
              animate={{
                x: offset * 42,
                y: Math.abs(offset) * 6 - (isSelected ? 26 : 0),
                rotate: offset * 6,
                scale: isSelected ? 1.08 : 1,
                opacity: isLocked ? 0 : 1,
              }}
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
                  onSelect(item.card);
                  setPreviewCard(item.card);
                }}
                className={`rounded-xl focus-visible:outline-3 focus-visible:outline-gold disabled:cursor-not-allowed ${
                  item.used ? 'opacity-40 grayscale' : ''
                }`}
              >
                <PlayingCard front={item.front} faceUp size="hand" layoutId={layoutId} />
              </button>
            </motion.div>
          );
        })}
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

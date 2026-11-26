import { CARD_NAMES, type CardValue } from '@shisa-revenge/shared';
import { NUMBER_CARD_ART } from '../../assets/cards/index.js';
import { CardChoice, type ChoiceItem } from './CardChoice.js';

type VendingPanelProps = {
  hand: CardValue[];
  onInsert: (value: CardValue) => void;
};

// The vending machine (design/10 section 5). Pick one duplicate to insert. You keep the other copy and
// get one random card back. Cards are chosen the same way as on the duel screen: tap to preview, then
// insert or back out.
export function VendingPanel({ hand, onInsert }: VendingPanelProps) {
  const counts = new Map<CardValue, number>();
  for (const value of hand) counts.set(value, (counts.get(value) ?? 0) + 1);
  const duplicates = [...counts.entries()]
    .filter(([, count]) => count >= 2)
    .map(([value]) => value);

  const items: ChoiceItem[] = duplicates.map((value) => ({
    key: `duplicate-${String(value)}`,
    card: { type: 'number', value },
    front: NUMBER_CARD_ART[value],
    label: `${String(value)} ${CARD_NAMES[value]}`,
    info: {
      title: `${String(value)} ${CARD_NAMES[value]}`,
      summary: 'Put one copy into the machine.',
      detail: 'You keep the other copy and get one random card back.',
    },
  }));

  return (
    <section aria-label="Vending machine" className="flex flex-col gap-3">
      <p className="text-base font-bold">The vending machine</p>
      {items.length === 0 ? (
        <p className="text-sm text-navy/80">
          Hold two copies of a card to use it. You keep one copy and get one random card back.
        </p>
      ) : (
        <>
          <p className="text-sm text-navy/80">Choose a duplicate to insert.</p>
          <CardChoice
            items={items}
            actionLabel="Insert"
            layoutId="vending-choice"
            onChoose={(card) => {
              if (card.type === 'number') onInsert(card.value);
            }}
          />
        </>
      )}
    </section>
  );
}

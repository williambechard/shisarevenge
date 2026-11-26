import { CARD_NAMES, type CardValue } from '@shisa-revenge/shared';
import { Button } from '../atoms/Button.js';

type VendingPanelProps = {
  hand: CardValue[];
  onInsert: (value: CardValue) => void;
};

// The vending machine (design/10 section 5). Insert one copy of a card you hold twice.
// You keep the other copy and get one random card back.
export function VendingPanel({ hand, onInsert }: VendingPanelProps) {
  const counts = new Map<CardValue, number>();
  for (const value of hand) counts.set(value, (counts.get(value) ?? 0) + 1);
  const duplicates = [...counts.entries()]
    .filter(([, count]) => count >= 2)
    .map(([value]) => value);

  return (
    <section aria-label="Vending machine" className="flex flex-col gap-2">
      <p className="text-sm font-semibold">The vending machine</p>
      {duplicates.length === 0 ? (
        <p className="text-sm text-navy/80">
          Hold two copies of a card to use it. You keep one copy and get one random card back.
        </p>
      ) : (
        <>
          <p className="text-sm text-navy/80">Insert a duplicate. You keep one copy.</p>
          <div className="flex flex-wrap gap-2">
            {duplicates.map((value) => (
              <Button
                key={value}
                onClick={() => {
                  onInsert(value);
                }}
              >
                Insert {String(value)} {CARD_NAMES[value]}
              </Button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

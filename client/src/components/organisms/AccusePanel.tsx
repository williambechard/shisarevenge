import { useState } from 'react';
import {
  CARD_NAMES,
  type CardValue,
  type PlayedCard,
  type SpecialKind,
} from '@shisa-revenge/shared';
import { Button } from '../atoms/Button.js';

type Target = { id: string; name: string };

type AccusePanelProps = {
  // Other players on the same tile as this player.
  targets: Target[];
  hand: CardValue[];
  special: SpecialKind | null;
  onAccuse: (targetId: string, card: PlayedCard | null) => void;
};

// Accusations (design/10 section 4). Pick a player on your tile, then give up a card to accuse them.
// A player with no cards accuses for free.
export function AccusePanel({ targets, hand, special, onAccuse }: AccusePanelProps) {
  const [chosen, setChosen] = useState<Target | null>(null);
  if (targets.length === 0) return null;

  const holdsCards = hand.length > 0 || special !== null;

  if (chosen === null) {
    return (
      <section aria-label="Accuse" className="flex flex-col gap-2">
        <p className="text-sm font-semibold">
          Standing with {targets.map((target) => target.name).join(', ')}.
        </p>
        {targets.map((target) => (
          <Button
            key={target.id}
            variant="secondary"
            onClick={() => {
              setChosen(target);
            }}
          >
            Accuse {target.name}
          </Button>
        ))}
      </section>
    );
  }

  return (
    <section aria-label={`Accuse ${chosen.name}`} className="flex flex-col gap-2">
      <p className="text-sm font-semibold">
        {holdsCards
          ? `Give up one card to accuse ${chosen.name}. It is gone whatever happens.`
          : `You have no cards, so accusing ${chosen.name} is free.`}
      </p>
      {holdsCards ? (
        <div className="flex flex-wrap gap-2">
          {[...new Set(hand)].map((value) => (
            <Button
              key={value}
              variant="secondary"
              onClick={() => {
                onAccuse(chosen.id, { type: 'number', value });
                setChosen(null);
              }}
            >
              Give {String(value)} {CARD_NAMES[value]}
            </Button>
          ))}
          {special !== null ? (
            <Button
              variant="secondary"
              onClick={() => {
                onAccuse(chosen.id, { type: 'special' });
                setChosen(null);
              }}
            >
              Give your special card
            </Button>
          ) : null}
        </div>
      ) : (
        <Button
          onClick={() => {
            onAccuse(chosen.id, null);
            setChosen(null);
          }}
        >
          Accuse {chosen.name}
        </Button>
      )}
      <Button
        variant="secondary"
        onClick={() => {
          setChosen(null);
        }}
      >
        Cancel
      </Button>
    </section>
  );
}

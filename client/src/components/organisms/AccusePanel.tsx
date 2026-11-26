import { useState } from 'react';
import {
  CARD_NAMES,
  SPECIAL_NAMES,
  type CardValue,
  type PlayedCard,
  type SpecialKind,
} from '@shisa-revenge/shared';
import { NUMBER_CARD_ART, SPECIAL_CARD_ART } from '../../assets/cards/index.js';
import { Button } from '../atoms/Button.js';
import { CardChoice, type ChoiceItem } from './CardChoice.js';

type Target = { id: string; name: string };

type AccusePanelProps = {
  // Other players on the same tile as this player.
  targets: Target[];
  hand: CardValue[];
  special: SpecialKind | null;
  onAccuse: (targetId: string, card: PlayedCard | null) => void;
};

// Accusations (design/10 section 4). Pick a player on your tile, then give up a card to accuse them.
// The card is chosen like on the duel screen: tap to preview, then accuse or back out.
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

  if (!holdsCards) {
    return (
      <section aria-label={`Accuse ${chosen.name}`} className="flex flex-col gap-2">
        <p className="text-sm font-semibold">
          You have no cards, so accusing {chosen.name} is free.
        </p>
        <Button
          onClick={() => {
            onAccuse(chosen.id, null);
            setChosen(null);
          }}
        >
          Accuse {chosen.name}
        </Button>
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

  const detail = 'This card is gone whatever happens.';
  const summary = `Give it up to accuse ${chosen.name}.`;
  const items: ChoiceItem[] = [...new Set(hand)].map((value) => ({
    key: `number-${String(value)}`,
    card: { type: 'number', value },
    front: NUMBER_CARD_ART[value],
    label: `${String(value)} ${CARD_NAMES[value]}`,
    info: { title: `${String(value)} ${CARD_NAMES[value]}`, summary, detail },
  }));
  if (special !== null) {
    items.push({
      key: 'special',
      card: { type: 'special' },
      front: SPECIAL_CARD_ART[special],
      label: SPECIAL_NAMES[special],
      info: { title: SPECIAL_NAMES[special], summary, detail },
    });
  }

  return (
    <section aria-label={`Accuse ${chosen.name}`} className="flex flex-col gap-3">
      <p className="text-sm font-semibold">Choose a card to give up.</p>
      <CardChoice
        items={items}
        actionLabel={`Accuse ${chosen.name}`}
        layoutId="accuse-choice"
        onChoose={(card) => {
          onAccuse(chosen.id, card);
          setChosen(null);
        }}
      />
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

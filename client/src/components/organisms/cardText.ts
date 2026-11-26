// Player-facing text for a card: what it is and what it does. Rules come from design/04-game-rules.md.
import {
  CARD_NAMES,
  SPECIAL_NAMES,
  SPECIAL_STRENGTH,
  type PlayedCard,
  type SpecialKind,
} from '@shisa-revenge/shared';

export type CardInfo = {
  title: string;
  summary: string;
  detail: string;
};

const SPECIAL_EFFECT: Record<SpecialKind, { summary: string; detail: string }> = {
  'protection-talisman': {
    summary: 'Blocks a freeze.',
    detail:
      "If Shisa's Army wins this duel, you are not caught. Playing it spends it, win or lose.",
  },
  ramen: {
    summary: "Recovers a Shisa's Army member.",
    detail:
      "If you win this duel, the Shisa's Army member you faced rejoins the Survivors. Playing it spends it, win or lose.",
  },
  'shisa-mask': {
    summary: "Shisa's Army only.",
    detail: 'A card of strength 4 with no bonus. Playing it spends it, win or lose.',
  },
};

// The text shown on the card preview. A special is described by name, strength, and effect.
export function cardInfo(card: PlayedCard, special: SpecialKind | null): CardInfo {
  if (card.type === 'number') {
    return {
      title: `${String(card.value)} ${CARD_NAMES[card.value]}`,
      summary: `Strength ${String(card.value)}.`,
      detail: 'The higher strength wins the duel. A tie changes nothing.',
    };
  }

  if (!special) {
    return { title: 'Special card', summary: '', detail: '' };
  }
  const effect = SPECIAL_EFFECT[special];
  return {
    title: SPECIAL_NAMES[special],
    summary: `Strength ${String(SPECIAL_STRENGTH[special])}. ${effect.summary}`,
    detail: effect.detail,
  };
}

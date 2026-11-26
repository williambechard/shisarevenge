// Card art, imported by Vite so the build hashes and bundles each file.
// Numbered cards are keyed by value. Special cards are keyed by their kind.

import card1 from './card_1.jpg';
import card2 from './card_2.jpg';
import card3 from './card_3.jpg';
import card4 from './card_4.jpg';
import card5 from './card_5.jpg';
import cardProtectionTalisman from './card_protection_talisman.jpg';
import cardRamen from './card_ramen.jpg';
import cardShisaMask from './card_shisa_mask.jpg';
import cardBack from '../textures/bingata-bands.svg';

export const NUMBER_CARD_ART = {
  1: card1,
  2: card2,
  3: card3,
  4: card4,
  5: card5,
} as const;

export const SPECIAL_CARD_ART = {
  'protection-talisman': cardProtectionTalisman,
  ramen: cardRamen,
  'shisa-mask': cardShisaMask,
} as const;

// The face-down side of every card. Placeholder art until the final back is drawn.
export const CARD_BACK_ART = cardBack;

// The art for a played card: a special's art when a special was played, otherwise the number's art.
export function cardArt(
  value: keyof typeof NUMBER_CARD_ART,
  special: keyof typeof SPECIAL_CARD_ART | null,
): string {
  return special ? SPECIAL_CARD_ART[special] : NUMBER_CARD_ART[value];
}

// Decodes every card image before the first round. A face that is swapped in at reveal then draws
// at once, instead of showing a blank frame while the image loads.
export function preloadCardArt(): void {
  const urls = [
    ...Object.values(NUMBER_CARD_ART),
    ...Object.values(SPECIAL_CARD_ART),
    CARD_BACK_ART,
  ];
  for (const url of urls) {
    const image = new Image();
    image.src = url;
    // Decoding is only a warm-up, so a failure is not an error for the player.
    void image.decode().catch(() => undefined);
  }
}

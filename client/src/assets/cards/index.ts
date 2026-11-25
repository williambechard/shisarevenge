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

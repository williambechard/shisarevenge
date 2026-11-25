import { CARD_VALUES, type CardValue } from '@shisa-revenge/shared';

// Every player starts a match with the same five numbered cards. Each is used once.
export function createHand(): CardValue[] {
  return [...CARD_VALUES];
}

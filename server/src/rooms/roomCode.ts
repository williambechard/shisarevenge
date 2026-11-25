import { randomInt } from 'node:crypto';
import { ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH } from '@shisa-revenge/shared';

export type RandomInteger = (exclusiveMax: number) => number;

// Codes use an alphabet without ambiguous letters. See design/03-guardrails.md section 5.
export function generateRoomCode(randomInteger: RandomInteger = (max) => randomInt(max)): string {
  let code = '';
  for (let index = 0; index < ROOM_CODE_LENGTH; index += 1) {
    code += ROOM_CODE_ALPHABET.charAt(randomInteger(ROOM_CODE_ALPHABET.length));
  }
  return code;
}

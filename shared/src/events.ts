// Zod schemas for client-to-server payloads. Every incoming payload is parsed here
// before any handler runs (design/05-coding-standards.md section 5).
// Event schemas for rooms and encounters are added in plans 02 and 03.

import { z } from 'zod';
import { DISPLAY_NAME_MAX_LENGTH, ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH } from './constants.js';

// Strips control characters, trims, then checks length.
export const displayNameSchema = z
  .string()
  .transform((value) => stripControlCharacters(value).trim())
  .pipe(z.string().min(1).max(DISPLAY_NAME_MAX_LENGTH));

function stripControlCharacters(value: string): string {
  return Array.from(value)
    .filter((char) => {
      const code = char.codePointAt(0) ?? 0;
      return code >= 0x20 && code !== 0x7f;
    })
    .join('');
}

const roomCodeCharacter = new RegExp(`^[${ROOM_CODE_ALPHABET}]{${String(ROOM_CODE_LENGTH)}}$`);

export const roomCodeSchema = z.string().regex(roomCodeCharacter, 'Invalid room code');

export const sessionTokenSchema = z.uuid();

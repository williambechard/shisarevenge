// Zod schemas for client-to-server payloads. Every incoming payload is parsed here
// before any handler runs (design/05-coding-standards.md section 5).
// Schemas for encounters and game flow are added in plans 03 and later.

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

const roomCodePattern = new RegExp(`^[${ROOM_CODE_ALPHABET}]{${String(ROOM_CODE_LENGTH)}}$`);

// Codes are typed in lowercase on phones, so normalize before matching.
export const roomCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(roomCodePattern, 'Invalid room code');

export const sessionTokenSchema = z.uuid();

export const roomEnterPayload = z.strictObject({
  // Present when a window reconnects. Absent for a new player.
  sessionToken: sessionTokenSchema.optional(),
});

export const roomLeavePayload = z.strictObject({});

// Any player in a lobby of 4 to 7 may start it once the wait has passed.
export const lobbyStartNowPayload = z.strictObject({});

// The card played this round: a number card, or the player's special card (played like a number).
export const encounterSubmitPayload = z.union([
  z.strictObject({
    type: z.literal('number'),
    value: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  }),
  z.strictObject({ type: z.literal('special') }),
]);

// The winner of a duel takes one card. The index is the position in the face-down pool.
export const cardPickPayload = z.strictObject({
  index: z.number().int().min(0).max(99),
});

export type CardPickPayload = z.infer<typeof cardPickPayload>;

// Village actions (design/10-village.md). Positions are checked against the board on the server.
export const villageMovePayload = z.strictObject({
  x: z.number().int().min(0).max(99),
  y: z.number().int().min(0).max(99),
});

export const villageAccusePayload = z.strictObject({
  targetId: z.string().min(1).max(64),
  // The card given up. Null only when the accuser holds no cards (they are out).
  card: z
    .union([
      z.strictObject({
        type: z.literal('number'),
        value: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
      }),
      z.strictObject({ type: z.literal('special') }),
    ])
    .nullable(),
});

export const villageVendPayload = z.strictObject({
  value: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
});

export type EncounterSubmitPayload = z.infer<typeof encounterSubmitPayload>;
export type RoomEnterPayload = z.infer<typeof roomEnterPayload>;

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

export const roomCreatePayload = z.strictObject({
  name: displayNameSchema,
});

export const roomJoinPayload = z.strictObject({
  roomCode: roomCodeSchema,
  name: displayNameSchema,
  sessionToken: sessionTokenSchema.optional(),
});

export const roomLeavePayload = z.strictObject({});

export const lobbyReadyPayload = z.strictObject({
  ready: z.boolean(),
});

export const gameStartPayload = z.strictObject({});

export const encounterSubmitPayload = z.strictObject({
  value: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  useSpecial: z.boolean(),
});

export type EncounterSubmitPayload = z.infer<typeof encounterSubmitPayload>;
export type RoomCreatePayload = z.infer<typeof roomCreatePayload>;
export type RoomJoinPayload = z.infer<typeof roomJoinPayload>;
export type LobbyReadyPayload = z.infer<typeof lobbyReadyPayload>;

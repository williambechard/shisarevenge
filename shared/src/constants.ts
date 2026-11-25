// Values from design/04-game-rules.md section 1 and design/08-socket-contract.md.
// Change these only together with the rules spec.

export const MIN_PLAYERS = 4;
export const MAX_PLAYERS = 8;
export const ROUND_COUNT = 5;

export const CARD_VALUES = [1, 2, 3, 4, 5] as const;

export const MAGIC_BONUS = 2;
export const MAX_EFFECTIVE_STRENGTH = 5;

export const SELECTION_SECONDS = 45;
export const RECONNECT_GRACE_SECONDS = 120;

// Room codes avoid ambiguous characters (no 0, O, 1, I).
export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const ROOM_CODE_LENGTH = 6;

export const DISPLAY_NAME_MAX_LENGTH = 16;

export const RATE_LIMIT_EVENTS_PER_SECOND = 10;
export const ROOM_CREATE_PER_IP_PER_MINUTE = 5;
export const ROOM_INACTIVITY_HOURS = 2;

// Preset emotes. Free text is not part of this build. See design/01-game-design.md section 7.
export const EMOTE_IDS = [
  'wave',
  'laugh',
  'cough',
  'shiver',
  'sneeze',
  'shrug',
  'thumbs-up',
  'thumbs-down',
  'party',
  'gasp',
  'bye',
] as const;

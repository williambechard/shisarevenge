// Values from design/04-game-rules.md section 1 and design/08-socket-contract.md.
// Change these only together with the rules spec.

export const MIN_PLAYERS = 4;
export const MAX_PLAYERS = 8;
export const ROUND_COUNT = 5;

export const CARD_VALUES = [1, 2, 3, 4, 5] as const;

// Names from design/01-game-design.md section 2.
export const CARD_NAMES: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: 'Mist',
  2: 'Breeze',
  3: 'Gust',
  4: 'Squall',
  5: 'Typhoon',
};

// Theme names for the special cards. Code keys stay neutral. See design/01-game-design.md section 5.
export const SPECIAL_NAMES = {
  'protection-talisman': 'Protection Talisman',
  ramen: 'Ramen',
  'shisa-mask': 'Shisa Mask',
} as const;

// Strength of each special card when it is played. A special is played in place of a number card and
// is compared the same way. See design/04-game-rules.md section 5.
export const SPECIAL_STRENGTH = {
  'protection-talisman': 2,
  ramen: 3,
  'shisa-mask': 4,
} as const;

export const SELECTION_SECONDS = 45;

// Time for the winner of a duel to take a card. On timeout the server takes one at random (design/04 section 4.6).
export const PICK_SECONDS = 10;

// Once a room has MIN_PLAYERS, this long before anyone may start it early. See design/01-game-design.md section 8.
// TESTING VALUE: 15 seconds. Restore to 60 before the party.
export const LOBBY_START_WAIT_SECONDS = 15;
// A player who drops out of a lobby keeps their seat this long. After that the seat is released.
export const LOBBY_DISCONNECT_GRACE_SECONDS = 30;
export const RECONNECT_GRACE_SECONDS = 120;

// Room codes avoid ambiguous characters (no 0, O, 1, I).
export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const ROOM_CODE_LENGTH = 6;

export const DISPLAY_NAME_MAX_LENGTH = 16;

// Players do not choose names. Each new player gets one of these, unique within the room.
export const PLAYER_NAMES = [
  'Sandy Shikuwasa',
  'Mochi Monk',
  'Kiki Kitakaze',
  'Bingata Bob',
  'Habu Hannah',
  'Gusuku Gus',
  'Sanshin Sally',
  'Ryukyu Rocky',
] as const;

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

// Player icons: one per seat, at most MAX_PLAYERS. Each room gives every player a different one. See client/src/assets/playericons.
export const PLAYER_ICON_COUNT = 8;

// Error codes and acknowledgement shapes from design/08-socket-contract.md sections 1 and 7.

export const ERROR_CODES = [
  'INVALID_PAYLOAD',
  'ROOM_NOT_FOUND',
  'ROOM_FULL',
  'NOT_HOST',
  'WRONG_PHASE',
  'NOT_IN_ENCOUNTER',
  'CARD_UNAVAILABLE',
  'SPECIAL_UNAVAILABLE',
  'ALREADY_LOCKED',
  'RATE_LIMITED',
  'GAME_IN_PROGRESS',
  'SEAT_IN_USE',
  'NO_PICK_PENDING',
  'INVALID_PICK',
  'NOT_IN_VILLAGE',
  'NOT_ADJACENT',
  'BLOCKED_TILE',
  'MOVE_COOLDOWN',
  'NOT_SAME_TILE',
  'ALREADY_ACCUSED',
  'CARD_REQUIRED',
  'CANNOT_ACCUSE_SELF',
  'NOT_ON_VENDING',
  'NO_DUPLICATE',
  'VENDING_USED',
  'OBSERVER_ONLY',
  'INTERNAL',
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

// Short, safe messages. They never include other players' data or tokens.
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  INVALID_PAYLOAD: 'That input is not valid.',
  ROOM_NOT_FOUND: 'No room has that code.',
  ROOM_FULL: 'This room is full.',
  NOT_HOST: 'Only the host can do that.',
  WRONG_PHASE: 'That action is not allowed right now.',
  NOT_IN_ENCOUNTER: 'You are not in a duel this round.',
  CARD_UNAVAILABLE: 'That card is no longer available.',
  SPECIAL_UNAVAILABLE: 'That special card is no longer available.',
  ALREADY_LOCKED: 'You have already locked in.',
  RATE_LIMITED: 'Too many actions. Wait a moment and try again.',
  GAME_IN_PROGRESS: 'This match has already started.',
  SEAT_IN_USE: 'This seat is open in another window.',
  NO_PICK_PENDING: 'There is no card to take right now.',
  INVALID_PICK: 'That card is not available to take.',
  NOT_IN_VILLAGE: 'The village is not open right now.',
  NOT_ADJACENT: 'You can only step to a tile next to you.',
  BLOCKED_TILE: 'You cannot walk there.',
  MOVE_COOLDOWN: 'Wait a moment before your next step.',
  NOT_SAME_TILE: 'You must stand on the same tile as them to accuse.',
  ALREADY_ACCUSED: 'You have already made your accusation this village.',
  CARD_REQUIRED: 'Choose a card to give up for this accusation.',
  CANNOT_ACCUSE_SELF: 'You cannot accuse yourself.',
  NOT_ON_VENDING: 'Stand on the vending machine to use it.',
  NO_DUPLICATE: 'You need two copies of a card to use the machine.',
  VENDING_USED: 'You have already used the vending machine this village.',
  OBSERVER_ONLY: 'Players who are out can only watch.',
  INTERNAL: 'Something went wrong. Please try again.',
};

export type AckError = { code: ErrorCode; message: string };

export type AckResponse<T extends object = object> =
  ({ ok: true } & T) | { ok: false; error: AckError };

export type Result<T, E extends ErrorCode = ErrorCode> =
  { ok: true; value: T } | { ok: false; error: E };

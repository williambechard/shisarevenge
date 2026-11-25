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
  INTERNAL: 'Something went wrong. Please try again.',
};

export type AckError = { code: ErrorCode; message: string };

export type AckResponse<T extends object = object> =
  ({ ok: true } & T) | { ok: false; error: AckError };

export type Result<T, E extends ErrorCode = ErrorCode> =
  { ok: true; value: T } | { ok: false; error: E };

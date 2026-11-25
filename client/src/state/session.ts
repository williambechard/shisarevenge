// Stores the seat so a refresh or reconnect rejoins the same player slot.
// The token lives only in this browser's localStorage. See design/03-guardrails.md section 5.

import { z } from 'zod';

export type StoredSession = {
  roomCode: string;
  playerId: string;
  sessionToken: string;
  name: string;
};

export type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const SESSION_KEY = 'shisa-revenge:session';

const storedSessionSchema = z.object({
  roomCode: z.string().min(1),
  playerId: z.string().min(1),
  sessionToken: z.string().min(1),
  name: z.string().min(1),
});

export function readSession(storage: KeyValueStorage): StoredSession | null {
  const raw = storage.getItem(SESSION_KEY);
  if (raw === null) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    storage.removeItem(SESSION_KEY);
    return null;
  }

  const result = storedSessionSchema.safeParse(parsed);
  if (!result.success) {
    storage.removeItem(SESSION_KEY);
    return null;
  }
  return result.data;
}

export function writeSession(storage: KeyValueStorage, session: StoredSession): void {
  storage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(storage: KeyValueStorage): void {
  storage.removeItem(SESSION_KEY);
}

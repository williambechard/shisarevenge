import { describe, expect, it } from 'vitest';
import { clearSession, readSession, writeSession, type KeyValueStorage } from './session.js';

// In-memory stand-in for localStorage.
function memoryStorage(): KeyValueStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
  };
}

const session = {
  roomCode: 'ABCDEF',
  playerId: 'p1',
  sessionToken: '6f1c2a30-1111-4222-8333-444455556666',
  name: 'Aiko',
};

describe('session storage', () => {
  it('round-trips a stored seat', () => {
    const storage = memoryStorage();
    writeSession(storage, session);
    expect(readSession(storage)).toEqual(session);
  });

  it('returns null when nothing is stored', () => {
    expect(readSession(memoryStorage())).toBeNull();
  });

  it('discards corrupt data', () => {
    const storage = memoryStorage();
    storage.setItem('shisa-revenge:session', '{not json');
    expect(readSession(storage)).toBeNull();
    expect(storage.data.size).toBe(0);
  });

  it('discards data with missing fields', () => {
    const storage = memoryStorage();
    storage.setItem('shisa-revenge:session', JSON.stringify({ roomCode: 'ABCDEF' }));
    expect(readSession(storage)).toBeNull();
  });

  it('clears the stored seat', () => {
    const storage = memoryStorage();
    writeSession(storage, session);
    clearSession(storage);
    expect(readSession(storage)).toBeNull();
  });
});

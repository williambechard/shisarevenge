import { describe, expect, it } from 'vitest';
import { ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH } from '@shisa-revenge/shared';
import { generateRoomCode } from './roomCode.js';

describe('generateRoomCode', () => {
  it('builds codes of the configured length from the configured alphabet', () => {
    const code = generateRoomCode();
    expect(code).toHaveLength(ROOM_CODE_LENGTH);
    for (const char of code) {
      expect(ROOM_CODE_ALPHABET).toContain(char);
    }
  });

  it('never uses ambiguous characters', () => {
    expect(ROOM_CODE_ALPHABET).not.toMatch(/[0O1I]/);
  });

  it('maps random numbers to alphabet positions', () => {
    const code = generateRoomCode(() => 0);
    expect(code).toBe(ROOM_CODE_ALPHABET.charAt(0).repeat(ROOM_CODE_LENGTH));
  });
});

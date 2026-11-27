import { describe, expect, it } from 'vitest';
import type { PrivateNotice } from '@shisa-revenge/shared';
import { soundForNotice } from './sounds.js';

describe('sounds for private notices', () => {
  it('plays a low sound for bad news', () => {
    expect(
      soundForNotice({ kind: 'caught-cold', lostSpecial: null, newSpecial: 'shisa-mask' }),
    ).toBe('bad');
    expect(soundForNotice({ kind: 'accused' })).toBe('bad');
    expect(soundForNotice({ kind: 'auto-locked' })).toBe('bad');
  });

  it('plays a chime for a correct accusation and a wrong one gets the low sound', () => {
    expect(soundForNotice({ kind: 'accusation-result', correct: true })).toBe('success');
    expect(soundForNotice({ kind: 'accusation-result', correct: false })).toBe('bad');
  });

  it('stays quiet for partner notices', () => {
    const quiet: PrivateNotice = { kind: 'partnered', partnerId: 'p2' };
    expect(soundForNotice(quiet)).toBeNull();
  });
});

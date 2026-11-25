import { describe, expect, it } from 'vitest';
import { resolveServerUrl } from './config.js';

describe('resolveServerUrl', () => {
  it('falls back to the local server when unset', () => {
    expect(resolveServerUrl(undefined)).toBe('http://localhost:3001');
    expect(resolveServerUrl('  ')).toBe('http://localhost:3001');
  });

  it('removes trailing slashes', () => {
    expect(resolveServerUrl('https://example.onrender.com/')).toBe('https://example.onrender.com');
  });
});

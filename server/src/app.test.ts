import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from './app.js';
import { loadConfig } from './config.js';

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  server = createServer(createApp());
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve();
    });
  });
  const address = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${String(address.port)}`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
});

describe('GET /health', () => {
  it('returns ok', async () => {
    const response = await fetch(`${baseUrl}/health`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });
});

describe('loadConfig', () => {
  it('uses defaults when variables are missing', () => {
    const config = loadConfig({});
    expect(config.PORT).toBe(3001);
    expect(config.CLIENT_ORIGIN).toBe('http://localhost:5173');
  });

  it('rejects a bad CLIENT_ORIGIN', () => {
    expect(() => loadConfig({ CLIENT_ORIGIN: 'not a url' })).toThrow(/CLIENT_ORIGIN/);
  });
});

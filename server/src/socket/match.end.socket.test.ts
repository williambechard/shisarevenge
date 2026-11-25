// A full match over sockets with short timers. Players never lock in, so the timer auto-locks
// every round. The test checks that the match ends with a winner and a consistent summary.

import type { AddressInfo } from 'node:net';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { io as connect, type Socket } from 'socket.io-client';
import { MAX_PLAYERS, type AckResponse, type EndgameSummary } from '@shisa-revenge/shared';
import { createGameServer, type GameServer } from '../server.js';

let game: GameServer;
let url: string;
const sockets: Socket[] = [];

beforeEach(async () => {
  game = createGameServer(
    { CLIENT_ORIGIN: 'http://localhost:5173' },
    { matches: { timing: { announceMs: 2, selectionMs: 15, resultMs: 2, lobbyWaitMs: 60_000 } } },
  );
  await new Promise<void>((resolve) => {
    game.httpServer.listen(0, '127.0.0.1', () => {
      resolve();
    });
  });
  const address = game.httpServer.address() as AddressInfo;
  url = `http://127.0.0.1:${String(address.port)}`;
});

afterEach(async () => {
  for (const socket of sockets.splice(0)) socket.disconnect();
  await game.close();
});

function openSocket(): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const socket = connect(url, { transports: ['websocket'], forceNew: true, reconnection: false });
    sockets.push(socket);
    socket.once('connect', () => {
      resolve(socket);
    });
    socket.once('connect_error', reject);
  });
}

function enter(socket: Socket): Promise<AckResponse<{ roomCode: string }>> {
  return new Promise((resolve) => {
    socket.emit('room:enter', {}, (response: AckResponse<{ roomCode: string }>) => {
      resolve(response);
    });
  });
}

describe('a full match', () => {
  it('ends with a winner, a history for every player, and counts that add up', async () => {
    const first = await openSocket();
    const firstSeat = await enter(first);
    if (!firstSeat.ok) throw new Error('enter failed');
    const ended = new Promise<EndgameSummary>((resolve) => {
      first.once('game:ended', (summary: EndgameSummary) => {
        resolve(summary);
      });
    });

    for (let index = 1; index < MAX_PLAYERS; index += 1) {
      const socket = await openSocket();
      await enter(socket);
    }

    const summary = await ended;
    expect(['survivor', 'infected']).toContain(summary.winner);
    expect(summary.history).toHaveLength(MAX_PLAYERS);
    expect(summary.survivors + summary.infected).toBe(MAX_PLAYERS);
    expect(summary.infected).toBeGreaterThanOrEqual(1);

    const room = game.registry.find(firstSeat.roomCode);
    expect(room?.phase).toBe('ended');
    expect(room?.endgame?.winner).toBe(summary.winner);
    expect(room?.teamCounts).toEqual({ survivors: summary.survivors, infected: summary.infected });
  }, 20_000);
});

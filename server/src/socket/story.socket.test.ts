// The story gate: the first village of a room waits until every connected player is past the story.
import type { AddressInfo } from 'node:net';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { io as connect, type Socket } from 'socket.io-client';
import { MAX_PLAYERS, type AckResponse } from '@shisa-revenge/shared';
import { createGameServer, type GameServer } from '../server.js';

let game: GameServer;
let url: string;
const sockets: Socket[] = [];

beforeEach(async () => {
  game = createGameServer(
    { CLIENT_ORIGIN: 'http://localhost:5173' },
    {
      matches: {
        timing: {
          villageMs: 60_000,
          announceMs: 60_000,
          selectionMs: 60_000,
          resultMs: 60_000,
          lobbyWaitMs: 20,
        },
      },
    },
  );
  await new Promise<void>((resolve) => {
    game.httpServer.listen(0, '127.0.0.1', () => {
      resolve();
    });
  });
  url = `http://127.0.0.1:${String((game.httpServer.address() as AddressInfo).port)}`;
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

function emitAck<T extends object>(socket: Socket, event: string, payload: unknown) {
  return new Promise<AckResponse<T>>((resolve) => {
    socket.emit(event, payload, (response: AckResponse<T>) => {
      resolve(response);
    });
  });
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Fills a room, waits out the lobby wait, and starts the match. Returns the sockets in seat order.
async function startMatch(): Promise<{ sockets: Socket[]; roomCode: string }> {
  const players: Socket[] = [];
  let roomCode = '';
  for (let index = 0; index < MAX_PLAYERS / 2; index += 1) {
    const socket = await openSocket();
    players.push(socket);
    const seat = await emitAck<{ roomCode: string }>(socket, 'room:enter', {});
    if (!seat.ok) throw new Error('enter failed');
    roomCode = seat.roomCode;
  }
  await wait(60);
  const [host] = players;
  if (!host) throw new Error('no players');
  const started = await emitAck(host, 'lobby:start-now', {});
  if (!started.ok) throw new Error(`start failed: ${started.error.code}`);
  await wait(30);
  return { sockets: players, roomCode };
}

describe('the story gate before the first village', () => {
  it('keeps the village timer off until every player is past the story', async () => {
    const { sockets: players, roomCode } = await startMatch();
    const village = game.registry.find(roomCode)?.village;
    expect(village?.endsAt).toBeNull();
    expect(village?.storyPending).toHaveLength(players.length);

    for (const [index, socket] of players.entries()) {
      const result = await emitAck(socket, 'story:done', {});
      expect(result.ok).toBe(true);
      if (index < players.length - 1) {
        expect(game.registry.find(roomCode)?.village?.endsAt).toBeNull();
      }
    }
    expect(game.registry.find(roomCode)?.village?.endsAt).toEqual(expect.any(Number));
    expect(game.registry.find(roomCode)?.village?.storyPending).toEqual([]);
  });

  it('does not hold the village for a player who has dropped out', async () => {
    const { sockets: players, roomCode } = await startMatch();
    const [gone, ...stayed] = players;
    gone?.disconnect();
    await wait(30);
    for (const socket of stayed) await emitAck(socket, 'story:done', {});
    expect(game.registry.find(roomCode)?.village?.endsAt).toEqual(expect.any(Number));
  });
});

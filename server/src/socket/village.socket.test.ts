// A full loop over sockets: a match ends, the village opens, a player walks, and the next match starts
// with the players still in the game (design/10-village.md section 2).
import type { AddressInfo } from 'node:net';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { io as connect, type Socket } from 'socket.io-client';
import {
  MAX_PLAYERS,
  MIN_PLAYERS,
  type AckResponse,
  type PublicVillage,
} from '@shisa-revenge/shared';
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
          announceMs: 2,
          selectionMs: 15,
          resultMs: 2,
          pickMs: 5,
          villageMs: 300,
          storyGate: false,
          lobbyWaitMs: 50,
        },
      },
    },
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

function emitAck<T extends object>(socket: Socket, event: string, payload: unknown) {
  return new Promise<AckResponse<T>>((resolve) => {
    socket.emit(event, payload, (response: AckResponse<T>) => {
      resolve(response);
    });
  });
}

function enter(socket: Socket): Promise<AckResponse<{ roomCode: string; playerId: string }>> {
  return emitAck<{ roomCode: string; playerId: string }>(socket, 'room:enter', {});
}

// The first walkable tile next to a position, read from the public board.
function neighbourOf(village: PublicVillage, from: { x: number; y: number }) {
  const steps = [
    { x: from.x + 1, y: from.y },
    { x: from.x - 1, y: from.y },
    { x: from.x, y: from.y + 1 },
    { x: from.x, y: from.y - 1 },
  ];
  return steps.find(
    (step) =>
      village.board[step.y]?.[step.x] !== undefined && village.board[step.y]?.[step.x] !== 'X',
  );
}

describe('the village between matches', () => {
  it('opens after a match, takes a step, and then the next match starts with the players still in', async () => {
    const first = await openSocket();
    const firstSeat = await enter(first);
    if (!firstSeat.ok) throw new Error('enter failed');
    const roomCode = firstSeat.roomCode;
    const playerIds: string[] = [firstSeat.playerId];

    const ended = new Promise<void>((resolve) => {
      first.once('game:ended', () => {
        resolve();
      });
    });
    for (let index = 1; index < MAX_PLAYERS; index += 1) {
      const socket = await openSocket();
      const seat = await enter(socket);
      if (seat.ok) playerIds.push(seat.playerId);
    }
    await ended;

    // The village is open: a player can take a step on the walkway.
    expect(game.registry.find(roomCode)?.phase).toBe('village');
    const village = game.registry.find(roomCode)?.village;
    expect(village).not.toBeNull();
    if (!village) throw new Error('no village');
    const start = village.positions[firstSeat.playerId];
    if (!start) throw new Error('player not on the walkway');
    const step = neighbourOf(village, start);
    if (!step) throw new Error('no neighbouring tile');
    const moved = await emitAck(first, 'village:move', step);
    expect(moved.ok).toBe(true);

    // When the village closes, the next match starts with everyone who is still in.
    const nextMatch = new Promise<boolean>((resolve) => {
      const timer = setTimeout(() => {
        resolve(false);
      }, 3000);
      first.once('game:started', () => {
        clearTimeout(timer);
        resolve(true);
      });
    });
    const started = await nextMatch;
    const active =
      game.registry.find(roomCode)?.players.filter((player) => !player.eliminated).length ?? 0;
    if (started) {
      expect(active).toBeGreaterThanOrEqual(MIN_PLAYERS);
    } else {
      expect(active).toBeLessThan(MIN_PLAYERS);
      expect(game.registry.find(roomCode)?.phase).toBe('ended');
    }
  }, 20_000);
});

// End-to-end socket tests against a real server on a random port.

import type { AddressInfo } from 'node:net';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { io as connect, type Socket } from 'socket.io-client';
import {
  MAX_PLAYERS,
  PLAYER_NAMES,
  type AckResponse,
  type PublicRoomState,
} from '@shisa-revenge/shared';
import { createGameServer, type GameServer } from '../server.js';

let game: GameServer;
let url: string;
const sockets: Socket[] = [];

beforeEach(async () => {
  game = createGameServer(
    { CLIENT_ORIGIN: 'http://localhost:5173' },
    { matches: { timing: { announceMs: 5, selectionMs: 60_000, resultMs: 60_000 } } },
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
    const socket = connect(url, {
      transports: ['websocket'],
      forceNew: true,
      reconnection: false,
    });
    sockets.push(socket);
    socket.once('connect', () => {
      resolve(socket);
    });
    socket.once('connect_error', reject);
  });
}

function emitAck<T extends object>(
  socket: Socket,
  event: string,
  payload: unknown,
): Promise<AckResponse<T>> {
  return new Promise((resolve) => {
    socket.emit(event, payload, (response: AckResponse<T>) => {
      resolve(response);
    });
  });
}

function nextRoomState(socket: Socket): Promise<PublicRoomState> {
  return new Promise((resolve) => {
    socket.once('room:state', (state: PublicRoomState) => {
      resolve(state);
    });
  });
}

// Opens a socket and enters the game. Returns the seat the server assigned.
async function enter(token?: string): Promise<{
  socket: Socket;
  seat: { roomCode: string; playerId: string; sessionToken: string; name: string };
}> {
  const socket = await openSocket();
  const response = await emitAck<{
    roomCode: string;
    playerId: string;
    sessionToken: string;
    name: string;
  }>(socket, 'room:enter', token === undefined ? {} : { sessionToken: token });
  if (!response.ok) throw new Error(`enter failed: ${response.error.code}`);
  const { roomCode, playerId, sessionToken, name } = response;
  return { socket, seat: { roomCode, playerId, sessionToken, name } };
}

describe('room:enter', () => {
  it('places a new player with an assigned name and a session token', async () => {
    const { seat } = await enter();
    expect(seat.roomCode).toMatch(/^[A-Z2-9]{6}$/);
    expect(seat.sessionToken).toMatch(/^[0-9a-f-]{36}$/);
    expect(PLAYER_NAMES).toContain(seat.name);
  });

  it('rejects a malformed session token with INVALID_PAYLOAD', async () => {
    const socket = await openSocket();
    const response = await emitAck(socket, 'room:enter', { sessionToken: 'not-a-token' });
    expect(response).toMatchObject({ ok: false, error: { code: 'INVALID_PAYLOAD' } });
  });

  it('rejects unknown fields', async () => {
    const socket = await openSocket();
    const response = await emitAck(socket, 'room:enter', { name: 'Aiko' });
    expect(response).toMatchObject({ ok: false, error: { code: 'INVALID_PAYLOAD' } });
  });

  it('puts two players in one lobby with different names', async () => {
    const first = await enter();
    const stateForFirst = nextRoomState(first.socket);
    const second = await enter();

    expect(second.seat.roomCode).toBe(first.seat.roomCode);
    expect(second.seat.name).not.toBe(first.seat.name);

    const state = await stateForFirst;
    expect(state.players.map((player) => player.name)).toEqual([first.seat.name, second.seat.name]);
  });

  it('never sends session tokens in room:state', async () => {
    const first = await enter();
    const stateReceived = nextRoomState(first.socket);
    await enter();

    const state = await stateReceived;
    expect(JSON.stringify(state)).not.toContain(first.seat.sessionToken);
  });
});

describe('a full room', () => {
  it('starts the game when the eighth player enters, and sends the ninth to a new room', async () => {
    const first = await enter();
    const started = new Promise<{ originPlayerId: string }>((resolve) => {
      first.socket.once('game:started', (payload: { originPlayerId: string }) => {
        resolve(payload);
      });
    });

    const others = [];
    for (let index = 1; index < MAX_PLAYERS; index += 1) {
      others.push(await enter());
    }
    const origin = await started;
    expect(typeof origin.originPlayerId).toBe('string');

    const ninth = await enter();
    expect(ninth.seat.roomCode).not.toBe(first.seat.roomCode);
  });
});

describe('reconnect and takeover', () => {
  it('returns the same seat after the socket drops', async () => {
    const host = await enter();
    const guest = await enter();
    guest.socket.disconnect();
    await new Promise((resolve) => setTimeout(resolve, 50));

    const back = await enter(guest.seat.sessionToken);
    expect(back.seat.playerId).toBe(guest.seat.playerId);
    expect(game.registry.find(host.seat.roomCode)?.players).toHaveLength(2);
  });

  it('refuses a second window that presents a live seat token', async () => {
    const { socket: host, seat } = await enter();
    const intruder = await openSocket();
    const response = await emitAck(intruder, 'room:enter', { sessionToken: seat.sessionToken });
    expect(response).toMatchObject({ ok: false, error: { code: 'SEAT_IN_USE' } });

    // The original window still holds its seat and still gets room updates.
    const stateAfter = nextRoomState(host);
    await enter();
    expect((await stateAfter).players).toHaveLength(2);
    expect(game.registry.find(seat.roomCode)?.players[0]?.socketId).toBe(host.id);
  });
});

describe('room:leave', () => {
  it('removes the player from the lobby', async () => {
    const host = await enter();
    const guest = await enter();

    const response = await emitAck<Record<string, never>>(guest.socket, 'room:leave', {});
    expect(response.ok).toBe(true);
    expect(game.registry.find(host.seat.roomCode)?.players).toHaveLength(1);
  });
});

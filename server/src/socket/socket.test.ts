// End-to-end socket tests against a real server on a random port.

import type { AddressInfo } from 'node:net';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { io as connect, type Socket } from 'socket.io-client';
import { MAX_PLAYERS, type AckResponse, type PublicRoomState } from '@shisa-revenge/shared';
import { createGameServer, type GameServer } from '../server.js';

let game: GameServer;
let url: string;
const sockets: Socket[] = [];

beforeEach(async () => {
  game = createGameServer({ CLIENT_ORIGIN: 'http://localhost:5173' });
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

async function createRoom(name: string): Promise<{
  socket: Socket;
  seat: { roomCode: string; playerId: string; sessionToken: string };
}> {
  const socket = await openSocket();
  const response = await emitAck<{
    roomCode: string;
    playerId: string;
    sessionToken: string;
  }>(socket, 'room:create', { name });
  if (!response.ok) throw new Error(`create failed: ${response.error.code}`);
  const { roomCode, playerId, sessionToken } = response;
  return { socket, seat: { roomCode, playerId, sessionToken } };
}

describe('room:create', () => {
  it('creates a room and returns a seat with a session token', async () => {
    const socket = await openSocket();
    const response = await emitAck<{ roomCode: string; playerId: string; sessionToken: string }>(
      socket,
      'room:create',
      { name: 'Aiko' },
    );

    expect(response.ok).toBe(true);
    if (!response.ok) return;
    expect(response.roomCode).toMatch(/^[A-Z2-9]{6}$/);
    expect(response.sessionToken).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('rejects an invalid name with INVALID_PAYLOAD', async () => {
    const socket = await openSocket();
    const response = await emitAck(socket, 'room:create', { name: '   ' });

    expect(response).toMatchObject({ ok: false, error: { code: 'INVALID_PAYLOAD' } });
  });

  it('rejects unknown fields', async () => {
    const socket = await openSocket();
    const response = await emitAck(socket, 'room:create', { name: 'Aiko', extra: true });

    expect(response).toMatchObject({ ok: false, error: { code: 'INVALID_PAYLOAD' } });
  });
});

describe('room:join and room:state', () => {
  it('lets a second player join and broadcasts the shared lobby', async () => {
    const host = await createRoom('Aiko');
    const stateForHost = nextRoomState(host.socket);

    const guest = await openSocket();
    const joined = await emitAck(guest, 'room:join', {
      roomCode: host.seat.roomCode,
      name: 'Ben',
    });
    expect(joined.ok).toBe(true);

    const state = await stateForHost;
    expect(state.players.map((player) => player.name)).toEqual(['Aiko', 'Ben']);
    expect(state.players[0]?.isHost).toBe(true);
    expect(state.players[1]?.isHost).toBe(false);
  });

  it('accepts a lowercase room code', async () => {
    const host = await createRoom('Aiko');
    const guest = await openSocket();
    const joined = await emitAck(guest, 'room:join', {
      roomCode: host.seat.roomCode.toLowerCase(),
      name: 'Ben',
    });
    expect(joined.ok).toBe(true);
  });

  it('reports an unknown room', async () => {
    const socket = await openSocket();
    const response = await emitAck(socket, 'room:join', { roomCode: 'ABCDEF', name: 'Ben' });
    expect(response).toMatchObject({ ok: false, error: { code: 'ROOM_NOT_FOUND' } });
  });

  it('rejects a ninth player with ROOM_FULL', async () => {
    const host = await createRoom('P1');
    for (let index = 2; index <= MAX_PLAYERS; index += 1) {
      const guest = await openSocket();
      await emitAck(guest, 'room:join', {
        roomCode: host.seat.roomCode,
        name: `P${String(index)}`,
      });
    }

    const extra = await openSocket();
    const response = await emitAck(extra, 'room:join', {
      roomCode: host.seat.roomCode,
      name: 'Extra',
    });
    expect(response).toMatchObject({ ok: false, error: { code: 'ROOM_FULL' } });
  });

  it('never sends session tokens in room:state', async () => {
    const host = await createRoom('Aiko');
    const stateReceived = nextRoomState(host.socket);

    const guest = await openSocket();
    await emitAck(guest, 'room:join', { roomCode: host.seat.roomCode, name: 'Ben' });

    const state = await stateReceived;
    expect(JSON.stringify(state)).not.toContain(host.seat.sessionToken);
  });
});

describe('reconnect by session token', () => {
  it('reuses the same seat after the socket drops', async () => {
    const host = await createRoom('Aiko');
    const guest = await openSocket();
    const first = await emitAck<{ roomCode: string; playerId: string; sessionToken: string }>(
      guest,
      'room:join',
      { roomCode: host.seat.roomCode, name: 'Ben' },
    );
    if (!first.ok) throw new Error('join failed');

    guest.disconnect();
    await new Promise((resolve) => setTimeout(resolve, 50));

    const returning = await openSocket();
    const again = await emitAck<{ roomCode: string; playerId: string; sessionToken: string }>(
      returning,
      'room:join',
      { roomCode: host.seat.roomCode, name: 'Ben', sessionToken: first.sessionToken },
    );

    expect(again.ok).toBe(true);
    if (!again.ok) return;
    expect(again.playerId).toBe(first.playerId);
    expect(game.registry.find(host.seat.roomCode)?.players).toHaveLength(2);
  });
});

describe('room:leave and lobby:ready', () => {
  it('toggles ready state for the room', async () => {
    const host = await createRoom('Aiko');
    const stateAfterReady = nextRoomState(host.socket);

    const response = await emitAck(host.socket, 'lobby:ready', {
      ready: false,
    });
    expect(response.ok).toBe(true);

    const state = await stateAfterReady;
    expect(state.players[0]?.ready).toBe(false);
  });

  it('rejects an invalid ready payload', async () => {
    const host = await createRoom('Aiko');
    const response = await emitAck(host.socket, 'lobby:ready', { ready: 'yes' });
    expect(response).toMatchObject({ ok: false, error: { code: 'INVALID_PAYLOAD' } });
  });

  it('removes the player when they leave', async () => {
    const host = await createRoom('Aiko');
    const guest = await openSocket();
    await emitAck(guest, 'room:join', { roomCode: host.seat.roomCode, name: 'Ben' });

    const response = await emitAck(guest, 'room:leave', {});
    expect(response.ok).toBe(true);
    expect(game.registry.find(host.seat.roomCode)?.players).toHaveLength(1);
  });
});

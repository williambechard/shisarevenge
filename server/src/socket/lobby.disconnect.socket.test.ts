// A player who drops out of a lobby loses the seat after the grace period.
// A player who reconnects with their token inside the grace period keeps it.
import type { AddressInfo } from 'node:net';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { io as connect, type Socket } from 'socket.io-client';
import type { AckResponse, PublicRoomState } from '@shisa-revenge/shared';
import { createGameServer, type GameServer } from '../server.js';

const GRACE_MS = 60;

let game: GameServer;
let url: string;
const sockets: Socket[] = [];

beforeEach(async () => {
  game = createGameServer(
    { CLIENT_ORIGIN: 'http://localhost:5173' },
    { lobbyDisconnectMs: GRACE_MS },
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

type EnterAck = AckResponse<{ playerId: string; sessionToken: string }>;

async function enter(socket: Socket, sessionToken?: string): Promise<EnterAck> {
  const payload = sessionToken === undefined ? {} : { sessionToken };
  return new Promise((resolve) => {
    socket.emit('room:enter', payload, (response: EnterAck) => {
      resolve(response);
    });
  });
}

// Resolves with the first room state that matches the test, or rejects after a timeout.
function nextRoomState(
  socket: Socket,
  matches: (room: PublicRoomState) => boolean,
  timeoutMs = 2000,
): Promise<PublicRoomState> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off('room:state', onState);
      reject(new Error('room state did not match in time'));
    }, timeoutMs);
    const onState = (room: PublicRoomState): void => {
      if (!matches(room)) return;
      clearTimeout(timer);
      socket.off('room:state', onState);
      resolve(room);
    };
    socket.on('room:state', onState);
  });
}

describe('lobby seats of players who disconnect', () => {
  it('releases the seat after the grace period', async () => {
    const first = await openSocket();
    const firstEntered = await enter(first);
    if (!firstEntered.ok) throw new Error('first enter failed');

    const second = await openSocket();
    const secondEntered = await enter(second);
    if (!secondEntered.ok) throw new Error('second enter failed');

    const released = nextRoomState(second, (room) => room.players.length === 1);
    first.disconnect();

    const room = await released;
    expect(room.players.map((player) => player.id)).toEqual([secondEntered.playerId]);
  });

  it('keeps the seat when the player reconnects with their token within the grace period', async () => {
    const first = await openSocket();
    const firstEntered = await enter(first);
    if (!firstEntered.ok) throw new Error('first enter failed');

    const second = await openSocket();
    const secondEntered = await enter(second);
    if (!secondEntered.ok) throw new Error('second enter failed');
    // Every room state the second player sees, in order.
    const states: PublicRoomState[] = [];
    second.on('room:state', (room: PublicRoomState) => {
      states.push(room);
    });

    first.disconnect();
    const back = await openSocket();
    const reEntered = await enter(back, firstEntered.sessionToken);
    expect(reEntered).toMatchObject({ ok: true, playerId: firstEntered.playerId });

    // Wait past the grace period. Both players must still be in the lobby.
    await new Promise((resolve) => setTimeout(resolve, GRACE_MS * 3));
    const latest = states.at(-1);
    const seated = latest?.players.map((player) => player.id) ?? [];
    expect(seated).toContain(firstEntered.playerId);
    expect(seated).toContain(secondEntered.playerId);
  });
});

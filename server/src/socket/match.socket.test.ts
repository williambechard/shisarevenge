// Socket-level test of one round: pairing, hidden lock-in, and reveal to participants only.

import type { AddressInfo } from 'node:net';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { io as connect, type Socket } from 'socket.io-client';
import type { AckResponse } from '@shisa-revenge/shared';
import { createGameServer, type GameServer } from '../server.js';

type Pairing = { a: string; b: string };
type RoundPaired = { round: number; pairings: Pairing[]; warmUpPlayerId: string | null };

let game: GameServer;
let url: string;
const sockets: Socket[] = [];

beforeEach(async () => {
  game = createGameServer(
    { CLIENT_ORIGIN: 'http://localhost:5173' },
    { matches: { timing: { announceMs: 5, selectionMs: 5000, resultMs: 5000 } } },
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

function nextEvent<T>(socket: Socket, event: string): Promise<T> {
  return new Promise((resolve) => {
    socket.once(event, (payload: T) => {
      resolve(payload);
    });
  });
}

function recordEvents(socket: Socket, events: string[]): void {
  for (const name of ['encounter:revealed', 'encounter:result', 'encounter:waiting']) {
    socket.on(name, () => {
      events.push(name);
    });
  }
}

describe('one duel round over sockets', () => {
  it('reveals a choice only to its participants, after both lock in', async () => {
    const host = await openSocket();
    const created = await emitAck<{ roomCode: string; playerId: string; sessionToken: string }>(
      host,
      'room:create',
      { name: 'Aiko' },
    );
    if (!created.ok) throw new Error(created.error.message);

    const players: Array<{ socket: Socket; id: string; events: string[] }> = [
      { socket: host, id: created.playerId, events: [] },
    ];
    for (const name of ['Ben', 'Cleo', 'Dai']) {
      const socket = await openSocket();
      const joined = await emitAck<{ roomCode: string; playerId: string; sessionToken: string }>(
        socket,
        'room:join',
        { roomCode: created.roomCode, name },
      );
      if (!joined.ok) throw new Error(joined.error.message);
      const ready = await emitAck(socket, 'lobby:ready', { ready: true });
      expect(ready.ok).toBe(true);
      players.push({ socket, id: joined.playerId, events: [] });
    }
    for (const player of players) recordEvents(player.socket, player.events);

    const pairedPromise = nextEvent<RoundPaired>(host, 'round:paired');
    const started = await emitAck(host, 'game:start', {});
    expect(started.ok).toBe(true);
    const paired = await pairedPromise;

    expect(paired.pairings).toHaveLength(2);
    const [first, second] = paired.pairings;
    if (!first || !second) throw new Error('expected two pairs');

    const byId = new Map(players.map((player) => [player.id, player]));
    const participants = new Set([first.a, first.b]);
    const bystander = players.find(
      (player) => !participants.has(player.id) && player.id !== paired.warmUpPlayerId,
    );
    if (!bystander) throw new Error('expected a bystander outside the first pair');

    const aPlayer = byId.get(first.a);
    const bPlayer = byId.get(first.b);
    if (!aPlayer || !bPlayer) throw new Error('missing players');

    // The first player locks in. Nobody in the duel gets a reveal yet.
    const lockA = await emitAck(aPlayer.socket, 'encounter:submit', {
      value: 1,
      useSpecial: false,
    });
    expect(lockA.ok).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(aPlayer.events).not.toContain('encounter:revealed');
    expect(bPlayer.events).not.toContain('encounter:revealed');
    expect(bystander.events).not.toContain('encounter:revealed');

    // The second player locks in. Both participants get the reveal. Nobody else does.
    const revealedA = nextEvent<{ myValue: number; opponentValue: number }>(
      aPlayer.socket,
      'encounter:revealed',
    );
    const revealedB = nextEvent<{ myValue: number; opponentValue: number }>(
      bPlayer.socket,
      'encounter:revealed',
    );
    const lockB = await emitAck(bPlayer.socket, 'encounter:submit', {
      value: 3,
      useSpecial: false,
    });
    expect(lockB.ok).toBe(true);

    expect(await revealedA).toEqual(expect.objectContaining({ myValue: 1, opponentValue: 3 }));
    expect(await revealedB).toEqual(expect.objectContaining({ myValue: 3, opponentValue: 1 }));
    expect(bystander.events).not.toContain('encounter:revealed');
  });

  it('rejects a special card until plan 05 adds them', async () => {
    const host = await openSocket();
    const created = await emitAck(host, 'room:create', { name: 'Aiko' });
    expect(created.ok).toBe(true);
    const response = await emitAck(host, 'encounter:submit', { value: 2, useSpecial: true });
    expect(response).toMatchObject({ ok: false, error: { code: 'SPECIAL_UNAVAILABLE' } });
  });
});

describe('selection timeout and public state', () => {
  it('auto-locks the lowest card when the timer runs out and tells that player', async () => {
    const host = await openSocket();
    const created = await emitAck<{ roomCode: string; playerId: string; sessionToken: string }>(
      host,
      'room:create',
      { name: 'Aiko' },
    );
    if (!created.ok) throw new Error(created.error.message);

    const guests: Socket[] = [];
    for (const name of ['Ben', 'Cleo', 'Dai']) {
      const socket = await openSocket();
      const joined = await emitAck<{ roomCode: string; playerId: string; sessionToken: string }>(
        socket,
        'room:join',
        { roomCode: created.roomCode, name },
      );
      if (!joined.ok) throw new Error(joined.error.message);
      await emitAck(socket, 'lobby:ready', { ready: true });
      guests.push(socket);
    }

    const notices: unknown[] = [];
    for (const socket of [host, ...guests]) {
      socket.on('player:notice', (notice: unknown) => {
        notices.push(notice);
      });
    }

    const publicStates: string[] = [];
    host.on('room:state', (state: unknown) => {
      publicStates.push(JSON.stringify(state));
    });

    const paired = nextEvent<RoundPaired>(host, 'round:paired');
    await emitAck(host, 'game:start', {});
    await paired;
    await new Promise((resolve) => setTimeout(resolve, 5500));

    expect(notices).toContainEqual({ kind: 'auto-locked' });
    for (const serialized of publicStates) {
      expect(serialized).not.toContain('"hand"');
      expect(serialized).not.toContain('"locked"');
    }
  }, 15_000);
});

// Socket-level tests of one match: automatic start, hidden lock-in, reveal to participants only,
// and the selection timeout.

import type { AddressInfo } from 'node:net';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { io as connect, type Socket } from 'socket.io-client';
import { MAX_PLAYERS, SPECIAL_STRENGTH, type AckResponse } from '@shisa-revenge/shared';
import { createGameServer, type GameServer } from '../server.js';

type Pairing = { a: string; b: string };
type RoundPaired = { round: number; pairings: Pairing[]; warmUpPlayerId: string | null };

let game: GameServer;
let url: string;
const sockets: Socket[] = [];

beforeEach(async () => {
  game = createGameServer(
    { CLIENT_ORIGIN: 'http://localhost:5173' },
    { matches: { timing: { villageMs: 5, announceMs: 5, selectionMs: 5000, resultMs: 5000 } } },
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

async function waitUntil(condition: () => boolean, timeoutMs = 2000): Promise<void> {
  const started = Date.now();
  while (!condition()) {
    if (Date.now() - started > timeoutMs) throw new Error('timed out waiting for condition');
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

function nextEvent<T>(socket: Socket, event: string): Promise<T> {
  return new Promise((resolve) => {
    socket.once(event, (payload: T) => {
      resolve(payload);
    });
  });
}

type Special = { kind: string; status: string } | null;
type Player = { socket: Socket; id: string; events: string[]; special: Special };

// Opens a socket that records its own private special before it enters a room.
async function openPlayer(): Promise<Player> {
  const socket = await openSocket();
  const player: Player = { socket, id: '', events: [], special: null };
  socket.on('player:private-state', (state: { special: Special }) => {
    player.special = state.special;
  });
  return player;
}

// Fills one room with eight players. The eighth entry starts the match.
async function fillRoom(): Promise<{ players: Player[]; paired: Promise<RoundPaired> }> {
  const first = await openPlayer();
  const created = await emitAck<{ playerId: string }>(first.socket, 'room:enter', {});
  if (!created.ok) throw new Error(created.error.message);
  first.id = created.playerId;
  const paired = nextEvent<RoundPaired>(first.socket, 'round:paired');

  const players: Player[] = [first];
  for (let index = 1; index < MAX_PLAYERS; index += 1) {
    const player = await openPlayer();
    const entered = await emitAck<{ playerId: string }>(player.socket, 'room:enter', {});
    if (!entered.ok) throw new Error(entered.error.message);
    player.id = entered.playerId;
    players.push(player);
  }

  for (const player of players) {
    for (const name of [
      'encounter:revealed',
      'encounter:result',
      'encounter:waiting',
      'player:notice',
    ]) {
      player.socket.on(name, () => {
        player.events.push(name);
      });
    }
  }
  return { players, paired };
}
describe('one duel round over sockets', () => {
  it('reveals a choice only to its participants, after both lock in', async () => {
    const { players, paired } = await fillRoom();
    const round = await paired;
    expect(round.pairings).toHaveLength(MAX_PLAYERS / 2);

    const byId = new Map(players.map((player) => [player.id, player]));
    const [first, second] = round.pairings;
    if (!first || !second) throw new Error('expected at least two pairs');

    const aPlayer = byId.get(first.a);
    const bPlayer = byId.get(first.b);
    const bystander = byId.get(second.a);
    if (!aPlayer || !bPlayer || !bystander) throw new Error('missing players');

    // The first player locks in. Nobody in the duel gets a reveal yet.
    const lockA = await emitAck(aPlayer.socket, 'encounter:submit', { type: 'number', value: 1 });
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
    const lockB = await emitAck(bPlayer.socket, 'encounter:submit', { type: 'number', value: 3 });
    expect(lockB.ok).toBe(true);

    expect(await revealedA).toEqual(expect.objectContaining({ myValue: 1, opponentValue: 3 }));
    expect(await revealedB).toEqual(expect.objectContaining({ myValue: 3, opponentValue: 1 }));
    expect(bystander.events).not.toContain('encounter:revealed');
  });

  it('reveals a committed special to its two participants only', async () => {
    const { players, paired } = await fillRoom();
    const round = await paired;
    // Each socket gets its own private state a moment after the round is paired.
    await waitUntil(() => players.every((player) => player.special !== null));
    const byId = new Map(players.map((player) => [player.id, player]));
    const [first, second] = round.pairings;
    if (!first || !second) throw new Error('expected at least two pairs');

    // Pick the first duel's player who holds an available special.
    const committer = [byId.get(first.a), byId.get(first.b)].find(
      (player) => player?.special?.status === 'available',
    );
    const opponent = committer?.id === first.a ? byId.get(first.b) : byId.get(first.a);
    const bystander = byId.get(second.a);
    if (!committer || !opponent || !bystander) throw new Error('missing players');
    const kind = committer.special?.kind;

    // Everything the opponent receives before the reveal. None of it may show the commit.

    const revealedCommitter = nextEvent<{ mySpecial: string | null }>(
      committer.socket,
      'encounter:revealed',
    );
    const revealedOpponent = nextEvent<{ opponentSpecial: string | null }>(
      opponent.socket,
      'encounter:revealed',
    );
    const beforeReveal: string[] = [];
    opponent.socket.on('encounter:waiting', (payload: unknown) =>
      beforeReveal.push(JSON.stringify(payload)),
    );
    opponent.socket.on('player:private-state', (payload: unknown) =>
      beforeReveal.push(JSON.stringify(payload)),
    );
    const lockCommitter = await emitAck(committer.socket, 'encounter:submit', { type: 'special' });
    expect(lockCommitter.ok).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(beforeReveal.length).toBeGreaterThan(0);
    expect(beforeReveal.some((entry) => entry.includes('committed'))).toBe(false);

    const lockOpponent = await emitAck(opponent.socket, 'encounter:submit', {
      type: 'number',
      value: 2,
    });
    expect(lockOpponent.ok).toBe(true);

    expect(await revealedCommitter).toEqual({
      myValue: kind ? SPECIAL_STRENGTH[kind as keyof typeof SPECIAL_STRENGTH] : undefined,
      opponentValue: 2,
      mySpecial: kind,
      opponentSpecial: null,
    });
    expect(await revealedOpponent).toEqual(expect.objectContaining({ opponentSpecial: kind }));
    expect(bystander.events).not.toContain('encounter:revealed');
  });

  it('rejects a commit when the player has no special to use', async () => {
    const socket = await openSocket();
    const entered = await emitAck(socket, 'room:enter', {});
    expect(entered.ok).toBe(true);
    const response = await emitAck(socket, 'encounter:submit', { type: 'special' });
    expect(response).toMatchObject({ ok: false, error: { code: 'WRONG_PHASE' } });
  });
});
describe('selection timeout', () => {
  it('auto-locks the lowest card when the timer runs out and tells each player', async () => {
    const { players, paired } = await fillRoom();
    await paired;
    const publicStates: string[] = [];
    players[0]?.socket.on('room:state', (state: unknown) => {
      publicStates.push(JSON.stringify(state));
    });

    await new Promise((resolve) => setTimeout(resolve, 5500));

    for (const player of players) {
      expect(player.events).toContain('encounter:revealed');
      expect(player.events).toContain('player:notice');
    }
    for (const serialized of publicStates) {
      expect(serialized).not.toContain('"hand"');
      expect(serialized).not.toContain('"locked"');
    }
  }, 15_000);
});

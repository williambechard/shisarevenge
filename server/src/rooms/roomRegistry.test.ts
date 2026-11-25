import { describe, expect, it } from 'vitest';
import { MAX_PLAYERS, ROOM_INACTIVITY_HOURS } from '@shisa-revenge/shared';
import { RoomRegistry } from './roomRegistry.js';

// Deterministic registry: fixed codes, sequential ids and tokens, and a controllable clock.
function makeRegistry(startTime = 1_000_000) {
  let clock = startTime;
  let counter = 0;
  let codeCounter = 0;
  const registry = new RoomRegistry({
    now: () => clock,
    newRoomCode: () => `ROOM${String(codeCounter++).padStart(2, '0')}`,
    newId: () => `p${String(++counter)}`,
    newToken: () => `t${String(counter)}`,
  });
  return {
    registry,
    advance: (ms: number) => {
      clock += ms;
    },
  };
}

describe('RoomRegistry.create', () => {
  it('makes the creator the host and marks them connected', () => {
    const { registry } = makeRegistry();
    const { room, player } = registry.create('Aiko');

    expect(room.hostId).toBe(player.id);
    expect(room.phase).toBe('lobby');
    expect(player.connected).toBe(true);
    expect(player.ready).toBe(true);
  });
});

describe('RoomRegistry.join', () => {
  it('adds a new player to a lobby', () => {
    const { registry } = makeRegistry();
    const { room } = registry.create('Aiko');

    const result = registry.join(room.code, 'Ben');
    expect(result.ok).toBe(true);
    expect(registry.find(room.code)?.players).toHaveLength(2);
  });

  it('reports an unknown room', () => {
    const { registry } = makeRegistry();
    expect(registry.join('NOPE00', 'Ben')).toEqual({ ok: false, error: 'ROOM_NOT_FOUND' });
  });

  it('rejects a ninth player', () => {
    const { registry } = makeRegistry();
    const { room } = registry.create('P1');
    for (let index = 2; index <= MAX_PLAYERS; index += 1) {
      registry.join(room.code, `P${String(index)}`);
    }
    expect(registry.join(room.code, 'Extra')).toEqual({ ok: false, error: 'ROOM_FULL' });
  });

  it('keeps the same seat when a known token rejoins', () => {
    const { registry } = makeRegistry();
    const { room, player } = registry.create('Aiko');
    registry.markDisconnected(room.code, player.id, 'socket-1');

    const result = registry.join(room.code, 'Aiko', player.token);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.reconnected).toBe(true);
    expect(result.value.player.id).toBe(player.id);
    expect(registry.find(room.code)?.players).toHaveLength(1);
  });
});

describe('RoomRegistry.leave and host migration', () => {
  it('passes the host role to the earliest joined connected player', () => {
    const { registry } = makeRegistry();
    const { room, player: host } = registry.create('Aiko');
    const second = registry.join(room.code, 'Ben');
    const third = registry.join(room.code, 'Cleo');
    if (!second.ok || !third.ok) throw new Error('join failed');

    registry.leave(room.code, host.id);

    const updated = registry.find(room.code);
    expect(updated?.hostId).toBe(second.value.player.id);
    expect(updated?.players.map((player) => player.id)).not.toContain(host.id);
  });

  it('removes the room when the last player leaves', () => {
    const { registry } = makeRegistry();
    const { room, player } = registry.create('Aiko');
    registry.leave(room.code, player.id);
    expect(registry.find(room.code)).toBeUndefined();
  });
});

describe('RoomRegistry.setReady', () => {
  it('updates ready state for a lobby player', () => {
    const { registry } = makeRegistry();
    const { room, player } = registry.create('Aiko');
    const result = registry.setReady(room.code, player.id, false);
    expect(result.ok).toBe(true);
    expect(registry.find(room.code)?.players[0]?.ready).toBe(false);
  });
});

describe('RoomRegistry.markDisconnected', () => {
  it('ignores a stale socket that the player already replaced', () => {
    const { registry } = makeRegistry();
    const { room, player } = registry.create('Aiko');
    registry.bindSocket(room.code, player.id, 'new-socket');

    expect(registry.markDisconnected(room.code, player.id, 'old-socket')).toBeNull();
    expect(registry.find(room.code)?.players[0]?.connected).toBe(true);
  });

  it('marks the current socket as gone and keeps the seat', () => {
    const { registry } = makeRegistry();
    const { room, player } = registry.create('Aiko');
    registry.bindSocket(room.code, player.id, 'socket-1');

    registry.markDisconnected(room.code, player.id, 'socket-1');
    const current = registry.find(room.code);
    expect(current?.players).toHaveLength(1);
    expect(current?.players[0]?.connected).toBe(false);
  });
});

describe('RoomRegistry.expireIdle', () => {
  it('removes rooms idle longer than the inactivity window', () => {
    const { registry, advance } = makeRegistry();
    const { room } = registry.create('Aiko');

    advance(ROOM_INACTIVITY_HOURS * 60 * 60 * 1000 + 1);
    expect(registry.expireIdle()).toEqual([room.code]);
    expect(registry.find(room.code)).toBeUndefined();
  });

  it('keeps rooms that are still active', () => {
    const { registry, advance } = makeRegistry();
    const { room } = registry.create('Aiko');

    advance(ROOM_INACTIVITY_HOURS * 60 * 60 * 1000 - 1);
    expect(registry.expireIdle()).toEqual([]);
    expect(registry.find(room.code)).toBeDefined();
  });
});

describe('RoomRegistry.toPublicState', () => {
  it('never includes session tokens', () => {
    const { registry } = makeRegistry();
    const { room, player } = registry.create('Aiko');
    const serialized = JSON.stringify(registry.toPublicState(room));
    expect(serialized).not.toContain(player.token);
  });
});

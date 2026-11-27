import { describe, expect, it } from 'vitest';
import {
  MAX_PLAYERS,
  PLAYER_ICON_COUNT,
  PLAYER_NAMES,
  RECONNECT_GRACE_SECONDS,
  ROOM_INACTIVITY_HOURS,
} from '@shisa-revenge/shared';
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
    randomInt: () => 0,
  });
  return {
    registry,
    advance: (ms: number) => {
      clock += ms;
    },
  };
}

function enterOk(registry: RoomRegistry, socketId: string, token?: string) {
  const result = registry.enter(token, socketId);
  if (!result.ok) throw new Error(`enter failed: ${result.error}`);
  return result.value;
}

describe('RoomRegistry.enter', () => {
  it('starts a new room for the first player and assigns a name', () => {
    const { registry } = makeRegistry();
    const { room, player, reconnected } = enterOk(registry, 's1');

    expect(room.phase).toBe('lobby');
    expect(room.players).toHaveLength(1);
    expect(player.name).toBe(PLAYER_NAMES[0]);
    expect(reconnected).toBe(false);
  });

  it('places the next player in the same open lobby', () => {
    const { registry } = makeRegistry();
    const first = enterOk(registry, 's1');
    const second = enterOk(registry, 's2');

    expect(second.room.code).toBe(first.room.code);
    expect(second.room.players).toHaveLength(2);
  });

  it('gives every player in a room a different name', () => {
    const { registry } = makeRegistry();
    const names = Array.from(
      { length: MAX_PLAYERS },
      (_, index) => enterOk(registry, `s${String(index)}`).player.name,
    );
    expect(new Set(names).size).toBe(MAX_PLAYERS);
    for (const name of names) expect(PLAYER_NAMES).toContain(name);
  });

  it('starts a new room when the open lobby is full', () => {
    const { registry } = makeRegistry();
    const first = enterOk(registry, 's0');
    for (let index = 1; index < MAX_PLAYERS; index += 1) {
      enterOk(registry, `s${String(index)}`);
    }
    const next = enterOk(registry, 'late');

    expect(next.room.code).not.toBe(first.room.code);
    expect(next.room.players).toHaveLength(1);
  });

  it('does not place new players in a room that has started', () => {
    const { registry } = makeRegistry();
    const first = enterOk(registry, 's0');
    registry.setPhase(first.room.code, 'selecting');

    const next = enterOk(registry, 's1');
    expect(next.room.code).not.toBe(first.room.code);
  });

  it('keeps the same seat when a known token reclaims it', () => {
    const { registry } = makeRegistry();
    const { room, player } = enterOk(registry, 's1');
    registry.markDisconnected(room.code, player.id, 's1');

    const again = enterOk(registry, 's2', player.token);
    expect(again.reconnected).toBe(true);
    expect(again.player.id).toBe(player.id);
    expect(registry.find(room.code)?.players).toHaveLength(1);
  });

  it('refuses a token while another connected socket holds the seat', () => {
    const { registry } = makeRegistry();
    const { room, player } = enterOk(registry, 's1');
    registry.bindSocket(room.code, player.id, 's1');

    expect(registry.enter(player.token, 's2')).toEqual({ ok: false, error: 'SEAT_IN_USE' });
  });

  it('allows the same socket to reclaim its own seat', () => {
    const { registry } = makeRegistry();
    const { room, player } = enterOk(registry, 's1');
    registry.bindSocket(room.code, player.id, 's1');

    expect(registry.enter(player.token, 's1').ok).toBe(true);
  });

  it('allows a new socket once the old one has disconnected', () => {
    const { registry } = makeRegistry();
    const { room, player } = enterOk(registry, 's1');
    registry.bindSocket(room.code, player.id, 's1');
    registry.markDisconnected(room.code, player.id, 's1');

    expect(registry.enter(player.token, 's2').ok).toBe(true);
  });
});

describe('RoomRegistry.leave', () => {
  it('removes the room when the last player leaves', () => {
    const { registry } = makeRegistry();
    const { room, player } = enterOk(registry, 's1');
    registry.leave(room.code, player.id);
    expect(registry.find(room.code)).toBeUndefined();
  });

  it('keeps the room for the remaining players', () => {
    const { registry } = makeRegistry();
    const first = enterOk(registry, 's1');
    enterOk(registry, 's2');
    registry.leave(first.room.code, first.player.id);
    expect(registry.find(first.room.code)?.players).toHaveLength(1);
  });
});

describe('RoomRegistry.markDisconnected', () => {
  it('ignores a stale socket that the player already replaced', () => {
    const { registry } = makeRegistry();
    const { room, player } = enterOk(registry, 's1');
    registry.bindSocket(room.code, player.id, 'new-socket');

    expect(registry.markDisconnected(room.code, player.id, 'old-socket')).toBeNull();
    expect(registry.find(room.code)?.players[0]?.connected).toBe(true);
  });

  it('marks the current socket as gone and keeps the seat', () => {
    const { registry } = makeRegistry();
    const { room, player } = enterOk(registry, 's1');
    registry.bindSocket(room.code, player.id, 's1');

    registry.markDisconnected(room.code, player.id, 's1');
    const current = registry.find(room.code);
    expect(current?.players).toHaveLength(1);
    expect(current?.players[0]?.connected).toBe(false);
  });
});

describe('RoomRegistry.expireIdle', () => {
  it('removes rooms idle longer than the inactivity window', () => {
    const { registry, advance } = makeRegistry();
    const { room } = enterOk(registry, 's1');

    advance(ROOM_INACTIVITY_HOURS * 60 * 60 * 1000 + 1);
    expect(registry.expireIdle()).toEqual([room.code]);
    expect(registry.find(room.code)).toBeUndefined();
  });

  it('keeps rooms that are still active', () => {
    const { registry, advance } = makeRegistry();
    const { room } = enterOk(registry, 's1');

    advance(ROOM_INACTIVITY_HOURS * 60 * 60 * 1000 - 1);
    expect(registry.expireIdle()).toEqual([]);
    expect(registry.find(room.code)).toBeDefined();
  });
});

describe('RoomRegistry.toPublicState', () => {
  it('never includes session tokens', () => {
    const { registry } = makeRegistry();
    const { room, player } = enterOk(registry, 's1');
    const serialized = JSON.stringify(registry.toPublicState(room));
    expect(serialized).not.toContain(player.token);
  });
});

describe('RoomRegistry player icons', () => {
  it('gives every player in a room a different icon', () => {
    const { registry } = makeRegistry();
    const icons = Array.from(
      { length: MAX_PLAYERS },
      (_, index) => enterOk(registry, `s${String(index)}`).player.icon,
    );
    expect(new Set(icons).size).toBe(MAX_PLAYERS);
    for (const icon of icons) {
      expect(icon).toBeGreaterThanOrEqual(0);
      expect(icon).toBeLessThan(PLAYER_ICON_COUNT);
    }
  });

  it('keeps the icon when a player reclaims their seat', () => {
    const { registry } = makeRegistry();
    const first = enterOk(registry, 's1');
    registry.bindSocket(first.room.code, first.player.id, 's1');
    registry.markDisconnected(first.room.code, first.player.id, 's1');
    const again = enterOk(registry, 's2', first.player.token);
    expect(again.player.icon).toBe(first.player.icon);
  });
});

describe('RoomRegistry reconnect grace in a started match', () => {
  it('lets a player come back within the grace period', () => {
    const { registry, advance } = makeRegistry();
    const first = enterOk(registry, 's1');
    first.room.phase = 'selecting';
    registry.bindSocket(first.room.code, first.player.id, 's1');
    registry.markDisconnected(first.room.code, first.player.id, 's1');
    advance(RECONNECT_GRACE_SECONDS * 1000 - 1000);
    const again = enterOk(registry, 's2', first.player.token);
    expect(again.reconnected).toBe(true);
  });

  it('refuses a return after the grace period, and does not seat a new player in the match', () => {
    const { registry, advance } = makeRegistry();
    const first = enterOk(registry, 's1');
    first.room.phase = 'selecting';
    registry.bindSocket(first.room.code, first.player.id, 's1');
    registry.markDisconnected(first.room.code, first.player.id, 's1');
    advance(RECONNECT_GRACE_SECONDS * 1000 + 1000);
    expect(registry.enter(first.player.token, 's2')).toEqual({ ok: false, error: 'GRACE_EXPIRED' });
    const fresh = enterOk(registry, 's3');
    expect(fresh.room.code).not.toBe(first.room.code);
  });
});

describe('RoomRegistry lobby with a held seat', () => {
  it('does not seat a new player in a lobby where a player has dropped', () => {
    const { registry } = makeRegistry();
    const first = enterOk(registry, 's1');
    enterOk(registry, 's2');
    registry.bindSocket(first.room.code, first.player.id, 's1');
    registry.markDisconnected(first.room.code, first.player.id, 's1');
    const fresh = enterOk(registry, 's3');
    expect(fresh.room.code).not.toBe(first.room.code);
  });

  it('seats a new player in the lobby again once the dropped seat is released', () => {
    const { registry } = makeRegistry();
    const first = enterOk(registry, 's1');
    enterOk(registry, 's2');
    registry.bindSocket(first.room.code, first.player.id, 's1');
    registry.markDisconnected(first.room.code, first.player.id, 's1');
    registry.leave(first.room.code, first.player.id);
    const fresh = enterOk(registry, 's3');
    expect(fresh.room.code).toBe(first.room.code);
  });
});

describe('RoomRegistry public team counts', () => {
  it('publishes the team counts the match set, not zeros', () => {
    const { registry } = makeRegistry();
    const first = enterOk(registry, 's1');
    registry.setTeamCounts(first.room.code, { survivors: 7, infected: 1 });
    expect(registry.toPublicState(first.room).teamCounts).toEqual({ survivors: 7, infected: 1 });
  });
});

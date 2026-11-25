import { describe, expect, it } from 'vitest';
import {
  allLockedIn,
  autoLockUnlocked,
  beginRound,
  createMatch,
  pairRound,
  resolveRound,
  submitSelection,
  type MatchState,
} from './gameEngine.js';
import type { RandomFn } from './pairing.js';
import type { CardValue } from '@shisa-revenge/shared';
import { revealPair, type Played } from './gameEngine.js';

function num(value: CardValue): { type: 'number'; value: CardValue } {
  return { type: 'number', value };
}

function seeded(seed: number): RandomFn {
  let state = seed;
  return () => {
    state = (Math.imul(state, 1103515245) + 12345) >>> 0;
    return state / 0x100000000;
  };
}

function startedMatch(count: number): MatchState {
  const players = Array.from({ length: count }, (_, index) => ({
    id: `p${String(index)}`,
    team: index === 0 ? ('infected' as const) : ('survivor' as const),
  }));
  return pairRound(beginRound(createMatch(players)), seeded(7));
}

describe('round flow', () => {
  it('moves from announce to selecting after pairing', () => {
    const state = startedMatch(4);
    expect(state.phase).toBe('selecting');
    expect(state.round).toBe(1);
    expect(state.pairs).toHaveLength(2);
  });

  it('rejects a selection outside the selecting phase', () => {
    const state = beginRound(
      createMatch([
        { id: 'a', team: 'survivor' },
        { id: 'b', team: 'survivor' },
      ]),
    );
    expect(submitSelection(state, 'a', num(3))).toEqual({ ok: false, error: 'WRONG_PHASE' });
  });

  it('rejects a player who is not in an encounter', () => {
    const state = startedMatch(5);
    const warmUp = state.warmUpId;
    expect(warmUp).not.toBeNull();
    if (warmUp === null) return;
    expect(submitSelection(state, warmUp, num(2))).toEqual({
      ok: false,
      error: 'NOT_IN_ENCOUNTER',
    });
  });

  it('rejects a card not in the hand', () => {
    const state = startedMatch(4);
    const [a] = state.pairs[0] ?? [];
    if (!a) throw new Error('no pair');
    const limited: MatchState = {
      ...state,
      players: state.players.map((p) => (p.id === a ? { ...p, hand: [1, 2] } : p)),
    };
    expect(submitSelection(limited, a, num(5))).toEqual({ ok: false, error: 'CARD_UNAVAILABLE' });
  });

  it('rejects a second lock-in from the same player', () => {
    const state = startedMatch(4);
    const [a] = state.pairs[0] ?? [];
    if (!a) throw new Error('no pair');
    const first = submitSelection(state, a, num(2));
    if (!first.ok) throw new Error('first lock failed');
    expect(submitSelection(first.value, a, num(3))).toEqual({ ok: false, error: 'ALREADY_LOCKED' });
  });

  it('resolves only after every choice is locked in', () => {
    const state = startedMatch(4);
    const [a, b] = state.pairs[0] ?? [];
    const [c, d] = state.pairs[1] ?? [];
    if (!a || !b || !c || !d) throw new Error('need two pairs');

    let current = state;
    for (const id of [a, b, c]) {
      const result = submitSelection(current, id, num(1));
      if (!result.ok) throw new Error('lock failed');
      current = result.value;
    }
    expect(allLockedIn(current)).toBe(false);

    const last = submitSelection(current, d, num(1));
    if (!last.ok) throw new Error('lock failed');
    expect(allLockedIn(last.value)).toBe(true);
    expect(resolveRound(last.value).phase).toBe('resolved');
  });

  it('auto-locks the lowest card for players who did not lock in', () => {
    const state = startedMatch(4);
    const locked = autoLockUnlocked(state);
    expect(allLockedIn(locked)).toBe(true);
    for (const player of state.players) {
      if (!state.pairs.flat().includes(player.id)) continue;
      expect(locked.locked.get(player.id)).toEqual(num(Math.min(...player.hand) as CardValue));
    }
  });
});

describe('card use invariants', () => {
  it('removes a played card from the hand and never returns it', () => {
    let state = startedMatch(4);
    state = autoLockUnlocked(state);
    const resolved = resolveRound(state);

    for (const player of resolved.players) {
      const played = state.locked.get(player.id);
      const playedValue = played?.type === 'number' ? played.value : undefined;
      expect(player.hand).not.toContain(playedValue);
      expect(new Set(player.hand).size).toBe(player.hand.length);
    }
  });

  it('gives the Warm-Up player no card change', () => {
    let state = startedMatch(5);
    const warmUp = state.warmUpId;
    const before = state.players.find((player) => player.id === warmUp)?.hand;
    state = resolveRound(autoLockUnlocked(state));
    const after = state.players.find((player) => player.id === warmUp)?.hand;
    expect(after).toEqual(before);
  });

  it('keeps the rotating bye fair over five rounds', () => {
    let state = createMatch(
      Array.from({ length: 5 }, (_, index) => ({
        id: `p${String(index)}`,
        team: 'survivor' as const,
      })),
    );
    const warmUps: Array<string | null> = [];
    for (let round = 0; round < 5; round += 1) {
      state = pairRound(beginRound(state), seeded(100 + round));
      warmUps.push(state.warmUpId);
      state = resolveRound(autoLockUnlocked(state));
    }
    expect(new Set(warmUps).size).toBe(5);
  });
});

describe('catching a cold', () => {
  it('turns a Survivor into an Army member when the Army wins the duel', () => {
    const base = startedMatch(4);
    const armyPlayer = base.players.find((p) => p.team === 'infected')?.id;
    const pair = base.pairs.find(([a, b]) => a === armyPlayer || b === armyPlayer);
    if (!armyPlayer || !pair) throw new Error('setup');
    const survivorId = pair[0] === armyPlayer ? pair[1] : pair[0];

    const locked = new Map<string, Played>([
      [armyPlayer, num(5)],
      [survivorId, num(1)],
    ]);
    const next = revealPair({ ...base, locked }, pair, seeded(1));

    expect(next.players.find((p) => p.id === survivorId)?.team).toBe('infected');
    expect(next.transformations[survivorId]).toEqual([base.round]);
    expect(next.players.find((p) => p.id === armyPlayer)?.team).toBe('infected');
  });

  it('changes no team when the Survivor wins the duel', () => {
    const base = startedMatch(4);
    const armyPlayer = base.players.find((p) => p.team === 'infected')?.id;
    const pair = base.pairs.find(([a, b]) => a === armyPlayer || b === armyPlayer);
    if (!armyPlayer || !pair) throw new Error('setup');
    const survivorId = pair[0] === armyPlayer ? pair[1] : pair[0];

    const locked = new Map<string, Played>([
      [armyPlayer, num(1)],
      [survivorId, num(5)],
    ]);
    const next = revealPair({ ...base, locked }, pair, seeded(1));

    expect(next.players.find((p) => p.id === survivorId)?.team).toBe('survivor');
    expect(next.transformations).toEqual({});
  });
});

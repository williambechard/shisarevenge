// Special cards are played in place of a number card. Rules from design/04-game-rules.md
// sections 3, 4.2, 5, 6, 7, 8, and 12. A special has a fixed strength (SPECIAL_STRENGTH).
import { describe, expect, it } from 'vitest';
import { SPECIAL_STRENGTH, type CardValue, type SpecialKind } from '@shisa-revenge/shared';
import {
  beginRound,
  createMatch,
  pairRound,
  revealPair,
  strengthOf,
  submitSelection,
  type MatchState,
  type Pair,
} from './gameEngine.js';
import type { PlayerSpecial } from './teamChanges.js';
import type { RandomFn } from './pairing.js';

function seeded(seed: number): RandomFn {
  let state = seed;
  return () => {
    state = (Math.imul(state, 1103515245) + 12345) >>> 0;
    return state / 0x100000000;
  };
}

type Card = { type: 'number'; value: CardValue } | { type: 'special' };
const N = (value: CardValue): Card => ({ type: 'number', value });
const SPECIAL: Card = { type: 'special' };

const ARMY = 'p0';

// Four players: p0 is Shisa's Army (holds a Shisa Mask). The other three are Survivors.
// Returns the round paired with the Army member's duel, and the Survivor in that duel.
function setupDuel(
  survivorSpecial: PlayerSpecial | null,
  armySpecial: PlayerSpecial | null = { kind: 'shisa-mask', status: 'available' },
) {
  const base = pairRound(
    beginRound(
      createMatch(
        [
          { id: ARMY, team: 'infected' },
          { id: 'p1', team: 'survivor' },
          { id: 'p2', team: 'survivor' },
          { id: 'p3', team: 'survivor' },
        ],
        seeded(1),
      ),
    ),
    seeded(7),
  );
  const pair = base.pairs.find(([a, b]) => a === ARMY || b === ARMY) as Pair;
  const survivorId = pair[0] === ARMY ? pair[1] : pair[0];
  const state: MatchState = {
    ...base,
    players: base.players.map((player) => {
      if (player.id === survivorId) return { ...player, special: survivorSpecial };
      if (player.id === ARMY) return { ...player, special: armySpecial };
      return player;
    }),
  };
  return { state, pair, armyId: ARMY, survivorId };
}

// Both players lock in, then the duel reveals.
function playDuel(
  state: MatchState,
  pair: Pair,
  armyId: string,
  armyCard: Card,
  survivorId: string,
  survivorCard: Card,
): MatchState {
  const armyLock = submitSelection(state, armyId, armyCard);
  if (!armyLock.ok) throw new Error(`army lock failed: ${armyLock.error}`);
  const survivorLock = submitSelection(armyLock.value, survivorId, survivorCard);
  if (!survivorLock.ok) throw new Error(`survivor lock failed: ${survivorLock.error}`);
  return revealPair(survivorLock.value, pair, seeded(2));
}

function specialOf(state: MatchState, id: string): PlayerSpecial | null | undefined {
  return state.players.find((player) => player.id === id)?.special;
}

function handOf(state: MatchState, id: string): readonly CardValue[] | undefined {
  return state.players.find((player) => player.id === id)?.hand;
}

describe('setup (design section 3)', () => {
  it('gives the origin a Shisa Mask and each Survivor one Survivor special', () => {
    const state = createMatch(
      [
        { id: 'o', team: 'infected' },
        { id: 'a', team: 'survivor' },
        { id: 'b', team: 'survivor' },
        { id: 'c', team: 'survivor' },
      ],
      seeded(3),
    );
    expect(specialOf(state, 'o')).toEqual({ kind: 'shisa-mask', status: 'available' });
    for (const id of ['a', 'b', 'c']) {
      const special = specialOf(state, id);
      expect(special?.status).toBe('available');
      expect(['protection-talisman', 'ramen']).toContain(special?.kind);
    }
  });

  it('spreads Survivor specials between Talisman and Ramen across seeded setups', () => {
    const kinds = new Set<SpecialKind>();
    for (let seed = 1; seed <= 50; seed += 1) {
      const state = createMatch(
        [
          { id: 'o', team: 'infected' },
          { id: 'a', team: 'survivor' },
        ],
        seeded(seed),
      );
      const kind = specialOf(state, 'a')?.kind;
      if (kind) kinds.add(kind);
    }
    expect(kinds).toEqual(new Set(['protection-talisman', 'ramen']));
  });
});

describe('special card strength (design section 5)', () => {
  it('plays each special at its fixed strength', () => {
    expect(strengthOf({ type: 'special', kind: 'protection-talisman' })).toBe(
      SPECIAL_STRENGTH['protection-talisman'],
    );
    expect(strengthOf({ type: 'special', kind: 'ramen' })).toBe(SPECIAL_STRENGTH.ramen);
    expect(strengthOf({ type: 'special', kind: 'shisa-mask' })).toBe(
      SPECIAL_STRENGTH['shisa-mask'],
    );
  });

  it('keeps the specials between the lowest and highest number cards', () => {
    for (const value of Object.values(SPECIAL_STRENGTH)) {
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(5);
    }
  });

  it('uses the number value for a number card', () => {
    expect(strengthOf({ type: 'number', value: 4 })).toBe(4);
  });

  it('compares a special with a number on strength: Mask (4) beats a Survivor who plays 3', () => {
    const { state, pair, armyId, survivorId } = setupDuel({ kind: 'ramen', status: 'available' });
    const next = playDuel(state, pair, armyId, SPECIAL, survivorId, N(3));
    expect(next.results[0]?.outcome.caughtCold).toBe(survivorId);
  });

  it('ties a special with a number of equal strength, and changes no team', () => {
    // Talisman has strength 2. The Army member plays 2.
    const { state, pair, armyId, survivorId } = setupDuel({
      kind: 'protection-talisman',
      status: 'available',
    });
    const next = playDuel(state, pair, armyId, N(2), survivorId, SPECIAL);
    expect(next.results[0]?.outcome.winnerId).toBeNull();
    expect(next.players.find((p) => p.id === survivorId)?.team).toBe('survivor');
  });
});

describe('playing a special card (design section 4.2)', () => {
  it('moves the special to committed on lock-in and keeps all number cards', () => {
    const { state, survivorId } = setupDuel({ kind: 'ramen', status: 'available' });
    const locked = submitSelection(state, survivorId, SPECIAL);
    if (!locked.ok) throw new Error('lock failed');
    expect(specialOf(locked.value, survivorId)?.status).toBe('committed');
    expect(handOf(locked.value, survivorId)).toEqual([1, 2, 3, 4, 5]);
  });

  it('plays a number without spending the special', () => {
    const { state, pair, armyId, survivorId } = setupDuel({ kind: 'ramen', status: 'available' });
    const next = playDuel(state, pair, armyId, N(2), survivorId, N(2));
    expect(specialOf(next, survivorId)?.status).toBe('available');
    expect(handOf(next, survivorId)).not.toContain(2);
  });

  it('rejects a special when the player has already spent it', () => {
    const { state, survivorId } = setupDuel({ kind: 'ramen', status: 'spent' });
    expect(submitSelection(state, survivorId, SPECIAL)).toEqual({
      ok: false,
      error: 'SPECIAL_UNAVAILABLE',
    });
  });

  it('rejects a special when the player holds none', () => {
    const { state, survivorId } = setupDuel(null);
    expect(submitSelection(state, survivorId, SPECIAL)).toEqual({
      ok: false,
      error: 'SPECIAL_UNAVAILABLE',
    });
  });

  it('spends the special played on a win, a loss, and a tie', () => {
    // Win: Ramen (3) beats the Army's 2. The Army member is recovered.
    const win = setupDuel({ kind: 'ramen', status: 'available' });
    const winNext = playDuel(win.state, win.pair, win.armyId, N(2), win.survivorId, SPECIAL);
    expect(specialOf(winNext, win.survivorId)?.status).toBe('spent');

    // Loss: Talisman (2) meets the Army's 5. The freeze is blocked, and the Talisman is spent.
    const loss = setupDuel({ kind: 'protection-talisman', status: 'available' });
    const lossNext = playDuel(loss.state, loss.pair, loss.armyId, N(5), loss.survivorId, SPECIAL);
    expect(specialOf(lossNext, loss.survivorId)?.status).toBe('spent');

    // Tie: Ramen (3) meets the Army's 3.
    const tie = setupDuel({ kind: 'ramen', status: 'available' });
    const tieNext = playDuel(tie.state, tie.pair, tie.armyId, N(3), tie.survivorId, SPECIAL);
    expect(specialOf(tieNext, tie.survivorId)?.status).toBe('spent');
  });
});

describe('Protection Talisman (design section 6)', () => {
  it('blocks a freeze when played, even by a large margin', () => {
    const { state, pair, armyId, survivorId } = setupDuel({
      kind: 'protection-talisman',
      status: 'available',
    });
    const next = playDuel(state, pair, armyId, N(5), survivorId, SPECIAL);
    const result = next.results[0];

    expect(result?.outcome.blocked).toBe(true);
    expect(result?.outcome.caughtCold).toBeNull();
    expect(next.players.find((p) => p.id === survivorId)?.team).toBe('survivor');
    expect(specialOf(next, survivorId)?.status).toBe('spent');
  });

  it('does not block when a number is played, so the Survivor is caught', () => {
    const { state, pair, armyId, survivorId } = setupDuel({
      kind: 'protection-talisman',
      status: 'available',
    });
    const next = playDuel(state, pair, armyId, N(5), survivorId, N(1));

    expect(next.results[0]?.outcome.caughtCold).toBe(survivorId);
    expect(next.results[0]?.caughtLostSpecial).toBe('protection-talisman');
    expect(next.players.find((p) => p.id === survivorId)?.team).toBe('infected');
  });
});

describe('Ramen (design section 8)', () => {
  it('recovers the Army member when a played Ramen wins the duel', () => {
    const { state, pair, armyId, survivorId } = setupDuel({ kind: 'ramen', status: 'available' });
    const next = playDuel(state, pair, armyId, N(1), survivorId, SPECIAL);
    const army = next.players.find((p) => p.id === armyId);

    expect(next.results[0]?.outcome.recoveredId).toBe(armyId);
    expect(army?.team).toBe('survivor');
    expect(['protection-talisman', 'ramen']).toContain(army?.special?.kind);
    expect(army?.special?.status).toBe('available');
    expect(next.results[0]?.recoveredNewSpecial).toBe(army?.special?.kind);
    expect(next.transformations[armyId]).toEqual([next.round]);
  });

  it('does not recover when the Survivor plays a number', () => {
    const { state, pair, armyId, survivorId } = setupDuel({ kind: 'ramen', status: 'available' });
    const next = playDuel(state, pair, armyId, N(1), survivorId, N(4));
    expect(next.results[0]?.outcome.recoveredId).toBeNull();
    expect(next.players.find((p) => p.id === armyId)?.team).toBe('infected');
  });

  it("does not recover when Ramen (3) loses to the Army member's Mask (4)", () => {
    const { state, pair, armyId, survivorId } = setupDuel({ kind: 'ramen', status: 'available' });
    const next = playDuel(state, pair, armyId, SPECIAL, survivorId, SPECIAL);
    expect(next.results[0]?.outcome.recoveredId).toBeNull();
    expect(next.results[0]?.outcome.caughtCold).toBe(survivorId);
  });

  it('changes no team on a tie, and the special is still spent', () => {
    const { state, pair, armyId, survivorId } = setupDuel({ kind: 'ramen', status: 'available' });
    const next = playDuel(state, pair, armyId, N(3), survivorId, SPECIAL);
    expect(next.results[0]?.outcome.winnerId).toBeNull();
    expect(next.players.find((p) => p.id === armyId)?.team).toBe('infected');
    expect(next.players.find((p) => p.id === survivorId)?.team).toBe('survivor');
    expect(specialOf(next, survivorId)?.status).toBe('spent');
  });
});

describe('Shisa Mask (design section 5 and 12)', () => {
  it('plays the Mask at strength 4, so it beats a Survivor who plays 3', () => {
    const { state, pair, armyId, survivorId } = setupDuel({ kind: 'ramen', status: 'available' });
    const next = playDuel(state, pair, armyId, SPECIAL, survivorId, N(3));
    expect(next.results[0]?.outcome.caughtCold).toBe(survivorId);
    expect(next.results[0]?.specials).toEqual(['shisa-mask', null]);
  });

  it('loses to a Survivor who plays 5, and the Army member keeps the Mask as spent', () => {
    const { state, pair, armyId, survivorId } = setupDuel({ kind: 'ramen', status: 'available' });
    const next = playDuel(state, pair, armyId, SPECIAL, survivorId, N(5));
    expect(next.results[0]?.outcome.winnerId).toBe(survivorId);
    expect(specialOf(next, armyId)?.status).toBe('spent');
    expect(next.players.find((p) => p.id === armyId)?.team).toBe('infected');
  });

  it('is blocked by a Talisman when the Army member wins with the Mask', () => {
    const { state, pair, armyId, survivorId } = setupDuel({
      kind: 'protection-talisman',
      status: 'available',
    });
    const next = playDuel(state, pair, armyId, SPECIAL, survivorId, SPECIAL);
    expect(next.results[0]?.outcome.blocked).toBe(true);
    expect(next.players.find((p) => p.id === survivorId)?.team).toBe('survivor');
  });
});

describe('caught players (design section 7)', () => {
  it('gives a caught player a fresh Shisa Mask when their special was spent', () => {
    const { state, pair, armyId, survivorId } = setupDuel({ kind: 'ramen', status: 'spent' });
    const next = playDuel(state, pair, armyId, N(5), survivorId, N(1));

    expect(next.players.find((p) => p.id === survivorId)?.team).toBe('infected');
    expect(specialOf(next, survivorId)).toEqual({ kind: 'shisa-mask', status: 'available' });
    expect(next.results[0]?.caughtLostSpecial).toBeNull();
  });

  it('loses an unused Survivor special when caught, and reports it', () => {
    const { state, pair, armyId, survivorId } = setupDuel({ kind: 'ramen', status: 'available' });
    const next = playDuel(state, pair, armyId, N(5), survivorId, N(1));

    expect(next.results[0]?.caughtLostSpecial).toBe('ramen');
    expect(specialOf(next, survivorId)).toEqual({ kind: 'shisa-mask', status: 'available' });
  });

  it('a Survivor who played Ramen and was caught gets a fresh Mask, and the Ramen is spent not lost', () => {
    const { state, pair, armyId, survivorId } = setupDuel({ kind: 'ramen', status: 'available' });
    const next = playDuel(state, pair, armyId, N(5), survivorId, SPECIAL);
    expect(next.players.find((p) => p.id === survivorId)?.team).toBe('infected');
    expect(specialOf(next, survivorId)).toEqual({ kind: 'shisa-mask', status: 'available' });
    expect(next.results[0]?.caughtLostSpecial).toBeNull();
  });
});

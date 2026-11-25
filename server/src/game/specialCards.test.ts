// Special-card rules from design/04-game-rules.md sections 3, 5, 6, 7, 8, and 12.
import { describe, expect, it } from 'vitest';
import type { CardValue, SpecialKind } from '@shisa-revenge/shared';
import {
  beginRound,
  createMatch,
  effectiveStrength,
  pairRound,
  revealPair,
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

const ARMY = 'p0';

// Four players: p0 is Shisa's Army (holds a Shisa Mask). The other three are Survivors.
// Returns the round paired with the Army member's duel, and the Survivor in that duel.
function setupDuel(survivorSpecial: PlayerSpecial | null) {
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
    players: base.players.map((player) =>
      player.id === survivorId ? { ...player, special: survivorSpecial } : player,
    ),
  };
  return { state, pair, armyId: ARMY, survivorId };
}

// Both players lock in. The Army member's commit is optional. The Survivor's commit depends on the test.
function lockDuel(
  state: MatchState,
  armyId: string,
  armyValue: CardValue,
  survivorId: string,
  survivorValue: CardValue,
  options: { army?: boolean; survivor?: boolean } = {},
): MatchState {
  const armyLock = submitSelection(state, armyId, armyValue, options.army ?? false);
  if (!armyLock.ok) throw new Error(`army lock failed: ${armyLock.error}`);
  const survivorLock = submitSelection(
    armyLock.value,
    survivorId,
    survivorValue,
    options.survivor ?? false,
  );
  if (!survivorLock.ok) throw new Error(`survivor lock failed: ${survivorLock.error}`);
  return survivorLock.value;
}

function specialOf(state: MatchState, id: string): PlayerSpecial | null | undefined {
  return state.players.find((player) => player.id === id)?.special;
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

describe('effective strength (design section 5)', () => {
  it.each([
    [1, 3],
    [3, 5],
    [4, 5],
    [5, 5],
  ] as const)('adds the Shisa Mask bonus and caps at 5: %i becomes %i', (value, expected) => {
    expect(effectiveStrength(value, 'shisa-mask')).toBe(expected);
  });

  it('adds nothing without a committed Shisa Mask', () => {
    expect(effectiveStrength(2, null)).toBe(2);
    expect(effectiveStrength(2, 'ramen')).toBe(2);
  });

  it('uses the bonus in a duel: a Mask at 1 ties a Survivor at 3', () => {
    const { state, pair, armyId, survivorId } = setupDuel({ kind: 'ramen', status: 'available' });
    const locked = lockDuel(state, armyId, 1, survivorId, 3, { army: true });
    const next = revealPair(locked, pair, seeded(1));
    expect(next.results[0]?.outcome.winnerId).toBeNull();
    expect(next.results[0]?.outcome.caughtCold).toBeNull();
  });
});

describe('committing a special (design section 4.2)', () => {
  it('moves the special to committed on lock-in', () => {
    const { state, armyId, survivorId } = setupDuel({ kind: 'ramen', status: 'available' });
    const locked = lockDuel(state, armyId, 2, survivorId, 2, { survivor: true });
    expect(specialOf(locked, survivorId)?.status).toBe('committed');
  });

  it('rejects a commit when the special is already spent', () => {
    const { state, survivorId } = setupDuel({ kind: 'ramen', status: 'spent' });
    expect(submitSelection(state, survivorId, 2, true)).toEqual({
      ok: false,
      error: 'SPECIAL_UNAVAILABLE',
    });
  });

  it('rejects a commit when the player holds no special', () => {
    const { state, survivorId } = setupDuel(null);
    expect(submitSelection(state, survivorId, 2, true)).toEqual({
      ok: false,
      error: 'SPECIAL_UNAVAILABLE',
    });
  });

  it('spends a committed special on a win, a loss, and a tie', () => {
    // Win: the Survivor plays 5 with Ramen against the Army's 1. The Army member is recovered.
    const win = setupDuel({ kind: 'ramen', status: 'available' });
    const winLocked = lockDuel(win.state, win.armyId, 1, win.survivorId, 5, { survivor: true });
    const winNext = revealPair(winLocked, win.pair, seeded(2));
    expect(specialOf(winNext, win.survivorId)?.status).toBe('spent');

    // Loss: the Survivor commits Talisman and the Army's 5 wins. The freeze is blocked.
    const loss = setupDuel({ kind: 'protection-talisman', status: 'available' });
    const lossLocked = lockDuel(loss.state, loss.armyId, 5, loss.survivorId, 1, { survivor: true });
    const lossNext = revealPair(lossLocked, loss.pair, seeded(2));
    expect(specialOf(lossNext, loss.survivorId)?.status).toBe('spent');

    // Tie: both play 3 and the Survivor commits Ramen.
    const tie = setupDuel({ kind: 'ramen', status: 'available' });
    const tieLocked = lockDuel(tie.state, tie.armyId, 3, tie.survivorId, 3, { survivor: true });
    const tieNext = revealPair(tieLocked, tie.pair, seeded(2));
    expect(specialOf(tieNext, tie.survivorId)?.status).toBe('spent');
  });
});

describe('Protection Talisman (design section 6)', () => {
  it('blocks a freeze when committed, even by a large margin', () => {
    const { state, pair, armyId, survivorId } = setupDuel({
      kind: 'protection-talisman',
      status: 'available',
    });
    const locked = lockDuel(state, armyId, 5, survivorId, 1, { survivor: true });
    const next = revealPair(locked, pair, seeded(2));
    const result = next.results[0];

    expect(result?.outcome.blocked).toBe(true);
    expect(result?.outcome.caughtCold).toBeNull();
    expect(next.players.find((p) => p.id === survivorId)?.team).toBe('survivor');
    expect(specialOf(next, survivorId)?.status).toBe('spent');
  });

  it('does not block when not committed, so the Survivor is caught', () => {
    const { state, pair, armyId, survivorId } = setupDuel({
      kind: 'protection-talisman',
      status: 'available',
    });
    const locked = lockDuel(state, armyId, 5, survivorId, 1);
    const next = revealPair(locked, pair, seeded(2));

    expect(next.results[0]?.outcome.caughtCold).toBe(survivorId);
    expect(next.results[0]?.caughtLostSpecial).toBe('protection-talisman');
    expect(next.players.find((p) => p.id === survivorId)?.team).toBe('infected');
  });
});

describe('Ramen (design section 8)', () => {
  it('recovers the Army member when a committed Ramen wins the duel', () => {
    const { state, pair, armyId, survivorId } = setupDuel({ kind: 'ramen', status: 'available' });
    const locked = lockDuel(state, armyId, 1, survivorId, 4, { survivor: true });
    const next = revealPair(locked, pair, seeded(9));
    const army = next.players.find((p) => p.id === armyId);

    expect(next.results[0]?.outcome.recoveredId).toBe(armyId);
    expect(army?.team).toBe('survivor');
    expect(['protection-talisman', 'ramen']).toContain(army?.special?.kind);
    expect(army?.special?.status).toBe('available');
    expect(next.results[0]?.recoveredNewSpecial).toBe(army?.special?.kind);
    expect(next.transformations[armyId]).toEqual([next.round]);
  });

  it('does not recover when Ramen is not committed', () => {
    const { state, pair, armyId, survivorId } = setupDuel({ kind: 'ramen', status: 'available' });
    const locked = lockDuel(state, armyId, 1, survivorId, 4);
    const next = revealPair(locked, pair, seeded(9));
    expect(next.results[0]?.outcome.recoveredId).toBeNull();
    expect(next.players.find((p) => p.id === armyId)?.team).toBe('infected');
  });

  it('changes no team on a tie, and the commit is still spent', () => {
    const { state, pair, armyId, survivorId } = setupDuel({ kind: 'ramen', status: 'available' });
    const locked = lockDuel(state, armyId, 2, survivorId, 2, { survivor: true });
    const next = revealPair(locked, pair, seeded(9));
    expect(next.results[0]?.outcome.winnerId).toBeNull();
    expect(next.players.find((p) => p.id === armyId)?.team).toBe('infected');
    expect(next.players.find((p) => p.id === survivorId)?.team).toBe('survivor');
    expect(specialOf(next, survivorId)?.status).toBe('spent');
  });
});

describe('Shisa Mask and lost specials (design sections 7 and 12)', () => {
  it('gives a caught player a fresh Shisa Mask when their special was spent', () => {
    const { state, pair, armyId, survivorId } = setupDuel({ kind: 'ramen', status: 'spent' });
    const locked = lockDuel(state, armyId, 5, survivorId, 1);
    const next = revealPair(locked, pair, seeded(9));

    expect(next.players.find((p) => p.id === survivorId)?.team).toBe('infected');
    expect(specialOf(next, survivorId)).toEqual({ kind: 'shisa-mask', status: 'available' });
    expect(next.results[0]?.caughtLostSpecial).toBeNull();
  });

  it('loses an unused Survivor special when caught, and reports it', () => {
    const { state, pair, armyId, survivorId } = setupDuel({ kind: 'ramen', status: 'available' });
    const locked = lockDuel(state, armyId, 5, survivorId, 1);
    const next = revealPair(locked, pair, seeded(9));

    expect(next.results[0]?.caughtLostSpecial).toBe('ramen');
    expect(specialOf(next, survivorId)).toEqual({ kind: 'shisa-mask', status: 'available' });
  });

  it('a player who used a Survivor special and was frozen gets a fresh Shisa Mask', () => {
    // Ramen is committed and spent on a losing duel. The next duel freezes the player.
    const { state, pair, armyId, survivorId } = setupDuel({ kind: 'ramen', status: 'available' });
    const first = revealPair(
      lockDuel(state, armyId, 5, survivorId, 1, { survivor: true }),
      pair,
      seeded(9),
    );
    expect(first.players.find((p) => p.id === survivorId)?.team).toBe('infected');
    expect(specialOf(first, survivorId)).toEqual({ kind: 'shisa-mask', status: 'available' });
  });
});

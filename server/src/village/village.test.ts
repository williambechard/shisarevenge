// Village rules from design/10-village.md: movement, accusations, and the vending machine.
import { describe, expect, it } from 'vitest';
import { parseSettings } from '../config/settings.js';
import type { CardValue } from '@shisa-revenge/shared';
import type { RandomFn } from '../game/pairing.js';
import { accuse, challenge, createVillage, moveTo, vend, type VillageState } from './village.js';

function seeded(seed: number): RandomFn {
  let state = seed;
  return () => {
    state = (Math.imul(state, 1103515245) + 12345) >>> 0;
    return state / 0x100000000;
  };
}

const settings = parseSettings({
  village: {
    villageSeconds: 60,
    moveCooldownMs: 400,
    accusationsPerPlayer: 1,
    vending: { specialChance: 0.2, usesPerVillage: 1 },
    board: ['XWWWWWX', 'WWXWXWW', 'WWWVWWW', 'WXWWWXW', 'XWWWWWX'],
  },
}).village;

// Builds a village where the players stand on known tiles, so tests do not depend on the shuffle.
function villageAt(
  placed: Record<string, { x: number; y: number }>,
  cards: Record<string, { hand: number[]; special: 'ramen' | 'protection-talisman' | null }>,
): VillageState {
  const base = createVillage(
    settings,
    Object.keys(placed).map((id) => ({
      id,
      cards: { hand: (cards[id]?.hand ?? []) as CardValue[], special: cards[id]?.special ?? null },
    })),
    seeded(1),
  );
  return { ...base, positions: { ...placed } };
}

describe('moving on the walkway', () => {
  it('steps to a neighbouring walkway tile', () => {
    const state = villageAt({ a: { x: 1, y: 0 } }, {});
    const next = moveTo(state, 'a', { x: 2, y: 0 }, 1000);
    expect(next.ok && next.value.positions.a).toEqual({ x: 2, y: 0 });
  });

  it('refuses a diagonal or a jump', () => {
    const state = villageAt({ a: { x: 1, y: 0 } }, {});
    expect(moveTo(state, 'a', { x: 2, y: 1 }, 1000)).toEqual({ ok: false, error: 'NOT_ADJACENT' });
    expect(moveTo(state, 'a', { x: 3, y: 0 }, 1000)).toEqual({ ok: false, error: 'NOT_ADJACENT' });
  });
  it('refuses a blocked tile', () => {
    const state = villageAt({ a: { x: 0, y: 1 } }, {});
    expect(moveTo(state, 'a', { x: 0, y: 0 }, 1000)).toEqual({ ok: false, error: 'BLOCKED_TILE' });
  });

  it('enforces the move cooldown', () => {
    const state = villageAt({ a: { x: 1, y: 0 } }, {});
    const first = moveTo(state, 'a', { x: 2, y: 0 }, 1000);
    if (!first.ok) throw new Error('first move failed');
    expect(moveTo(first.value, 'a', { x: 3, y: 0 }, 1200)).toEqual({
      ok: false,
      error: 'MOVE_COOLDOWN',
    });
    expect(moveTo(first.value, 'a', { x: 3, y: 0 }, 1400).ok).toBe(true);
  });

  it('never puts two players on the start tiles of the same spot', () => {
    const state = createVillage(
      settings,
      [
        { id: 'a', cards: { hand: [], special: null } },
        { id: 'b', cards: { hand: [], special: null } },
      ],
      seeded(9),
    );
    const [pa, pb] = [state.positions.a, state.positions.b];
    expect(pa).toBeDefined();
    expect(pb).toBeDefined();
    expect(pa).not.toEqual(pb);
  });
});

describe('accusations (design/10 section 4)', () => {
  const finalTeams = { a: 'survivor', b: 'infected', c: 'survivor' } as const;

  it('needs both players on the same tile', () => {
    const state = villageAt(
      { a: { x: 1, y: 0 }, b: { x: 2, y: 0 } },
      { a: { hand: [1], special: null } },
    );
    const result = accuse(state, 'a', 'b', { type: 'number', value: 1 }, finalTeams, seeded(1));
    expect(result).toEqual({ ok: false, error: 'NOT_SAME_TILE' });
  });

  it('costs the card whatever the outcome, and pays a card for a correct accusation', () => {
    const state = villageAt(
      { a: { x: 1, y: 0 }, b: { x: 1, y: 0 } },
      { a: { hand: [2, 4], special: null } },
    );
    const result = accuse(state, 'a', 'b', { type: 'number', value: 2 }, finalTeams, seeded(1));
    if (!result.ok) throw new Error('accuse failed');
    expect(result.value.correct).toBe(true);
    // The paid 2 is gone. The 4 is still there, and the correct accusation adds one random card.
    expect(result.value.state.cards.a?.hand).toHaveLength(2);
    expect(result.value.state.cards.a?.hand).toContain(4);
  });

  it('a wrong accusation costs the card and pays nothing', () => {
    const state = villageAt(
      { a: { x: 0, y: 1 }, c: { x: 0, y: 1 } },
      { a: { hand: [3], special: null } },
    );
    const result = accuse(state, 'a', 'c', { type: 'number', value: 3 }, finalTeams, seeded(1));
    if (!result.ok) throw new Error('accuse failed');
    expect(result.value.correct).toBe(false);
    expect(result.value.state.cards.a?.hand).toEqual([]);
  });

  it('lets any card pay, including a special', () => {
    const state = villageAt(
      { a: { x: 1, y: 0 }, b: { x: 1, y: 0 } },
      { a: { hand: [], special: 'ramen' } },
    );
    const result = accuse(state, 'a', 'b', { type: 'special' }, finalTeams, seeded(1));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.state.cards.a?.special).toBeNull();
  });

  it('requires a card to be chosen when the accuser holds cards', () => {
    const state = villageAt(
      { a: { x: 1, y: 0 }, b: { x: 1, y: 0 } },
      { a: { hand: [1], special: null } },
    );
    expect(accuse(state, 'a', 'b', null, finalTeams, seeded(1))).toEqual({
      ok: false,
      error: 'CARD_REQUIRED',
    });
  });

  it('stops an out player from accusing: observers only', () => {
    const state = villageAt(
      { a: { x: 1, y: 0 }, b: { x: 1, y: 0 } },
      { a: { hand: [], special: null } },
    );
    const withOut = { ...state, out: { a: true as const } };
    expect(accuse(withOut, 'a', 'b', null, finalTeams, seeded(1))).toEqual({
      ok: false,
      error: 'OBSERVER_ONLY',
    });
  });

  it('allows one accusation per player', () => {
    const state = villageAt(
      { a: { x: 1, y: 0 }, b: { x: 1, y: 0 }, c: { x: 1, y: 0 } },
      { a: { hand: [1, 2], special: null } },
    );
    const first = accuse(state, 'a', 'b', { type: 'number', value: 1 }, finalTeams, seeded(1));
    if (!first.ok) throw new Error('first accusation failed');
    expect(
      accuse(first.value.state, 'a', 'c', { type: 'number', value: 2 }, finalTeams, seeded(1)),
    ).toEqual({
      ok: false,
      error: 'ALREADY_ACCUSED',
    });
  });

  it('adds a public tag to the target for every accusation', () => {
    const state = villageAt(
      { a: { x: 1, y: 0 }, b: { x: 1, y: 0 } },
      { a: { hand: [1], special: null } },
    );
    const result = accuse(state, 'a', 'b', { type: 'number', value: 1 }, finalTeams, seeded(1));
    if (!result.ok) throw new Error('accuse failed');
    expect(result.value.state.tags.b).toBe(1);
  });
});

describe('vending machine (design/10 section 5)', () => {
  it('refuses to walk onto the machine tile', () => {
    const state = villageAt({ a: standing }, {});
    expect(moveTo(state, 'a', vendingTile, 1000)).toEqual({ ok: false, error: 'BLOCKED_TILE' });
  });

  const vendingTile = { x: 3, y: 2 };
  // The tile next to the machine, where players stand to use it.
  const standing = { x: 2, y: 2 };

  it('needs the player to stand next to the machine', () => {
    const state = villageAt({ a: { x: 1, y: 0 } }, { a: { hand: [2, 2], special: null } });
    expect(vend(state, 'a', 2, seeded(1))).toEqual({ ok: false, error: 'NOT_ON_VENDING' });
  });

  it('needs two copies of the card', () => {
    const state = villageAt({ a: standing }, { a: { hand: [2, 3], special: null } });
    expect(vend(state, 'a', 2, seeded(1))).toEqual({ ok: false, error: 'NO_DUPLICATE' });
  });

  it('takes one copy in and gives one card out, keeping the other copy', () => {
    const state = villageAt({ a: standing }, { a: { hand: [2, 2], special: null } });
    const result = vend(state, 'a', 2, seeded(5));
    if (!result.ok) throw new Error('vend failed');
    const hand = result.value.state.cards.a?.hand ?? [];
    // A number comes back in, so the hand keeps one copy and gains one. A special leaves one copy only.
    expect(hand.length).toBe(result.value.received.type === 'number' ? 2 : 1);
    expect(hand).toContain(2);
  });

  it('allows one use per village', () => {
    const state = villageAt({ a: standing }, { a: { hand: [2, 2, 2], special: null } });
    const first = vend(state, 'a', 2, seeded(5));
    if (!first.ok) throw new Error('first use failed');
    expect(vend(first.value.state, 'a', 2, seeded(6))).toEqual({
      ok: false,
      error: 'VENDING_USED',
    });
  });

  it('gives a special only to a player who holds none, and a number otherwise', () => {
    // A roll that would give a special (below specialChance) on a player who already has one must give a number.
    const state = villageAt({ a: standing }, { a: { hand: [4, 4], special: 'ramen' } });
    for (let seed = 1; seed < 40; seed += 1) {
      const result = vend(state, 'a', 4, seeded(seed));
      if (!result.ok) throw new Error('vend failed');
      expect(result.value.received.type).toBe('number');
    }
  });
});

describe('partner challenges (design/10 section 13.1)', () => {
  it('locks both players when one challenges the other on the same tile', () => {
    const state = villageAt({ a: { x: 1, y: 0 }, b: { x: 1, y: 0 } }, {});
    const result = challenge(state, 'a', 'b');
    if (!result.ok) throw new Error('challenge failed');
    expect(result.value.matched).toBe(true);
    expect([...(result.value.state.partners[0] ?? [])].sort()).toEqual(['a', 'b']);
  });

  it('refuses to challenge a player who is already locked in', () => {
    const state = villageAt({ a: { x: 1, y: 0 }, b: { x: 1, y: 0 }, c: { x: 1, y: 0 } }, {});
    const first = challenge(state, 'a', 'b');
    if (!first.ok) throw new Error('first challenge failed');
    expect(challenge(first.value.state, 'c', 'b')).toEqual({ ok: false, error: 'LOCKED_IN' });
  });

  it('keeps locked players from moving, accusing, or being walked onto', () => {
    const locked = challenge(
      villageAt({ a: { x: 1, y: 0 }, b: { x: 1, y: 0 }, c: { x: 2, y: 0 } }, {}),
      'a',
      'b',
    );
    if (!locked.ok) throw new Error('challenge failed');
    const state = locked.value.state;
    expect(moveTo(state, 'a', { x: 2, y: 0 }, 1000)).toEqual({ ok: false, error: 'LOCKED_IN' });
    expect(moveTo(state, 'c', { x: 1, y: 0 }, 1000)).toEqual({ ok: false, error: 'LOCKED_IN' });
    expect(
      accuse(state, 'c', 'b', null, { a: 'survivor', b: 'survivor', c: 'survivor' }, seeded(1)),
    ).toEqual({ ok: false, error: 'LOCKED_IN' });
  });
  it('needs both players on the same tile', () => {
    const state = villageAt({ a: { x: 1, y: 0 }, b: { x: 2, y: 0 } }, {});
    expect(challenge(state, 'a', 'b')).toEqual({ ok: false, error: 'NOT_SAME_TILE' });
  });

  it('does not let an observer challenge', () => {
    const state = {
      ...villageAt({ a: { x: 1, y: 0 }, b: { x: 1, y: 0 } }, {}),
      out: { a: true as const },
    };
    expect(challenge(state, 'a', 'b')).toEqual({ ok: false, error: 'OBSERVER_ONLY' });
  });
});

describe('public accusations (design/10 section 13.1)', () => {
  it('records every accusation in the public log, and reveals the role when correct', () => {
    const state = villageAt(
      { a: { x: 1, y: 0 }, b: { x: 1, y: 0 } },
      { a: { hand: [1], special: null } },
    );
    const result = accuse(
      state,
      'a',
      'b',
      { type: 'number', value: 1 },
      { a: 'survivor', b: 'infected' },
      seeded(1),
    );
    if (!result.ok) throw new Error('accuse failed');
    expect(result.value.state.log).toEqual([{ accuserId: 'a', targetId: 'b', correct: true }]);
    expect(result.value.state.revealed).toEqual({ b: 'infected' });
  });

  it('does not reveal a role after a wrong accusation', () => {
    const state = villageAt(
      { a: { x: 1, y: 0 }, b: { x: 1, y: 0 } },
      { a: { hand: [1], special: null } },
    );
    const result = accuse(
      state,
      'a',
      'b',
      { type: 'number', value: 1 },
      { a: 'survivor', b: 'survivor' },
      seeded(1),
    );
    if (!result.ok) throw new Error('accuse failed');
    expect(result.value.state.revealed).toEqual({});
    expect(result.value.state.log).toHaveLength(1);
  });
});

describe('meetings on the walkway', () => {
  it('records a meeting when a player steps onto another player', () => {
    const state = villageAt({ a: { x: 1, y: 0 }, b: { x: 2, y: 0 } }, {});
    const result = moveTo(state, 'a', { x: 2, y: 0 }, 1000);
    if (!result.ok) throw new Error('move failed');
    expect(result.value.meeting).toEqual({
      moverId: 'a',
      from: { x: 1, y: 0 },
      to: { x: 2, y: 0 },
      at: 1000,
    });
  });

  it('records no meeting for a step onto an empty tile', () => {
    const state = villageAt({ a: { x: 1, y: 0 }, b: { x: 3, y: 0 } }, {});
    const result = moveTo(state, 'a', { x: 2, y: 0 }, 1000);
    if (!result.ok) throw new Error('move failed');
    expect(result.value.meeting).toBeNull();
  });
});

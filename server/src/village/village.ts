// The village between matches: a walkway grid, tap-to-move, accusations, and the vending machine.
// Pure: no I/O and no timers. Rules are in design/10-village.md. Board and tuning come from data/settings.json.

import type { CardValue, ErrorCode, SpecialKind, Team } from '@shisa-revenge/shared';
import type { RandomFn } from '../game/pairing.js';
import type { GameSettings } from '../config/settings.js';

export type Cell = 'walk' | 'blocked' | 'vending';

export type Position = { x: number; y: number };

// The cards a player carries into the village. Numbers may repeat, after takes.
export type VillageCards = { hand: CardValue[]; special: SpecialKind | null };

export type VillageState = {
  cells: Cell[][];
  columns: number;
  rows: number;
  positions: Record<string, Position>;
  lastMoveAt: Record<string, number>;
  cards: Record<string, VillageCards>;
  // Public tags: how many accusations each player has received.
  tags: Record<string, number>;
  accusationsMade: Record<string, number>;
  vendingUses: Record<string, number>;
  settings: GameSettings['village'];
};

export type VillageResult<T = VillageState> =
  { ok: true; value: T } | { ok: false; error: ErrorCode };

// A card a player gives up in the village.
export type CardChoice = { type: 'number'; value: CardValue } | { type: 'special' };

// A card the vending machine gives out. A special shows its kind.
export type VendedCard =
  { type: 'number'; value: CardValue } | { type: 'special'; kind: SpecialKind };

export function parseCells(rows: readonly string[]): Cell[][] {
  return rows.map((row) =>
    Array.from(row, (char) => (char === 'W' ? 'walk' : char === 'V' ? 'vending' : 'blocked')),
  );
}

// Creates the village for the players who just finished a match. Players start on walkway
// tiles spread across the board, in a random order.
export function createVillage(
  settings: GameSettings['village'],
  players: ReadonlyArray<{ id: string; cards: VillageCards }>,
  random: RandomFn,
): VillageState {
  const cells = parseCells(settings.board);
  const walkable: Position[] = [];
  cells.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell === 'walk') walkable.push({ x, y });
    });
  });
  const shuffled = [...walkable];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swap]] = [shuffled[swap] as Position, shuffled[index] as Position];
  }

  const positions: Record<string, Position> = {};
  const cards: Record<string, VillageCards> = {};
  const tags: Record<string, number> = {};
  players.forEach((player, index) => {
    positions[player.id] = shuffled[index % shuffled.length] ?? { x: 0, y: 0 };
    cards[player.id] = { hand: [...player.cards.hand], special: player.cards.special };
    tags[player.id] = 0;
  });

  return {
    cells,
    columns: cells[0]?.length ?? 0,
    rows: cells.length,
    positions,
    lastMoveAt: {},
    cards,
    tags,
    accusationsMade: {},
    vendingUses: {},
    settings,
  };
}

function cellAt(state: VillageState, position: Position): Cell | null {
  return state.cells[position.y]?.[position.x] ?? null;
}

// One step to a neighbouring tile. Diagonals are not allowed. The cooldown keeps traffic low.
export function moveTo(
  state: VillageState,
  playerId: string,
  target: Position,
  now: number,
): VillageResult {
  const from = state.positions[playerId];
  if (!from) return { ok: false, error: 'NOT_IN_VILLAGE' };
  if (Math.abs(target.x - from.x) + Math.abs(target.y - from.y) !== 1) {
    return { ok: false, error: 'NOT_ADJACENT' };
  }
  const cell = cellAt(state, target);
  if (cell === null || cell === 'blocked') return { ok: false, error: 'BLOCKED_TILE' };
  const last = state.lastMoveAt[playerId];
  if (last !== undefined && now - last < state.settings.moveCooldownMs) {
    return { ok: false, error: 'MOVE_COOLDOWN' };
  }
  return {
    ok: true,
    value: {
      ...state,
      positions: { ...state.positions, [playerId]: { x: target.x, y: target.y } },
      lastMoveAt: { ...state.lastMoveAt, [playerId]: now },
    },
  };
}

function removeCard(cards: VillageCards, choice: CardChoice): VillageCards | null {
  if (choice.type === 'special') {
    return cards.special === null ? null : { ...cards, special: null };
  }
  const at = cards.hand.indexOf(choice.value);
  if (at < 0) return null;
  const hand = [...cards.hand];
  hand.splice(at, 1);
  return { ...cards, hand };
}

// Accuses the target of being Shisa's Army in the match that just ended (design/10 section 4).
// The accuser must stand on the target's tile. A player who holds cards pays one (any card) and,
// if the accusation is correct, receives a random number card. A player who is out pays nothing and
// receives nothing. Every accusation adds a public tag to the target.
export function accuse(
  state: VillageState,
  accuserId: string,
  targetId: string,
  paid: CardChoice | null,
  finalTeams: Record<string, Team>,
  random: RandomFn,
): VillageResult<{ state: VillageState; correct: boolean }> {
  if (!state.positions[accuserId]) return { ok: false, error: 'NOT_IN_VILLAGE' };
  if (!state.positions[targetId]) return { ok: false, error: 'NOT_IN_VILLAGE' };
  if (accuserId === targetId) return { ok: false, error: 'CANNOT_ACCUSE_SELF' };
  if (!isSameTile(state, accuserId, targetId)) return { ok: false, error: 'NOT_SAME_TILE' };
  if ((state.accusationsMade[accuserId] ?? 0) >= state.settings.accusationsPerPlayer) {
    return { ok: false, error: 'ALREADY_ACCUSED' };
  }

  const accuserCards = state.cards[accuserId] ?? { hand: [], special: null };
  const holdsCards = accuserCards.hand.length > 0 || accuserCards.special !== null;
  let cards = accuserCards;
  if (holdsCards) {
    if (paid === null) return { ok: false, error: 'CARD_REQUIRED' };
    const after = removeCard(accuserCards, paid);
    if (after === null) return { ok: false, error: 'CARD_UNAVAILABLE' };
    cards = after;
  }

  const correct = finalTeams[targetId] === 'infected';
  if (correct && holdsCards) {
    const value = (Math.floor(random() * 5) + 1) as CardValue;
    cards = { ...cards, hand: [...cards.hand, value] };
  }

  return {
    ok: true,
    value: {
      correct,
      state: {
        ...state,
        cards: { ...state.cards, [accuserId]: cards },
        tags: { ...state.tags, [targetId]: (state.tags[targetId] ?? 0) + 1 },
        accusationsMade: {
          ...state.accusationsMade,
          [accuserId]: (state.accusationsMade[accuserId] ?? 0) + 1,
        },
      },
    },
  };
}

function isSameTile(state: VillageState, a: string, b: string): boolean {
  const pa = state.positions[a];
  const pb = state.positions[b];
  return pa !== undefined && pb !== undefined && pa.x === pb.x && pa.y === pb.y;
}

// Uses the vending machine: one copy of a duplicate number card goes in, and one random card comes out.
// A special is possible (specialChance) unless the player already holds one.
export function vend(
  state: VillageState,
  playerId: string,
  duplicate: CardValue,
  random: RandomFn,
): VillageResult<{ state: VillageState; received: VendedCard }> {
  const at = state.positions[playerId];
  if (!at) return { ok: false, error: 'NOT_IN_VILLAGE' };
  if (cellAt(state, at) !== 'vending') return { ok: false, error: 'NOT_ON_VENDING' };
  if ((state.vendingUses[playerId] ?? 0) >= state.settings.vending.usesPerVillage) {
    return { ok: false, error: 'VENDING_USED' };
  }

  const cards = state.cards[playerId] ?? { hand: [], special: null };
  const copies = cards.hand.filter((value) => value === duplicate).length;
  if (copies < 2) return { ok: false, error: 'NO_DUPLICATE' };
  const hand = [...cards.hand];
  hand.splice(hand.indexOf(duplicate), 1);

  let received: VendedCard;
  let next: VillageCards;
  const wantsSpecial = random() < state.settings.vending.specialChance && cards.special === null;
  if (wantsSpecial) {
    // Survivor specials only: Protection Talisman or Ramen.
    const kind: SpecialKind = random() < 0.5 ? 'protection-talisman' : 'ramen';
    received = { type: 'special', kind };
    next = { hand, special: kind };
  } else {
    const value = (Math.floor(random() * 5) + 1) as CardValue;
    received = { type: 'number', value };
    next = { hand: [...hand, value], special: cards.special };
  }

  return {
    ok: true,
    value: {
      received,
      state: {
        ...state,
        cards: { ...state.cards, [playerId]: next },
        vendingUses: { ...state.vendingUses, [playerId]: (state.vendingUses[playerId] ?? 0) + 1 },
      },
    },
  };
}

// The cards each player leaves the village with. The next match starts from these (design/10 section 6).
export function carriedCards(state: VillageState): Record<string, VillageCards> {
  return { ...state.cards };
}

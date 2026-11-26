// The village: a walkway grid, tap-to-move, partner challenges, accusations, and the vending machine.
// Pure: no I/O and no timers. Rules are in design/10-village.md. Board and tuning come from data/settings.json.

import type { CardValue, ErrorCode, SpecialKind, Team } from '@shisa-revenge/shared';
import type { RandomFn } from '../game/pairing.js';
import type { GameSettings } from '../config/settings.js';

export type Cell = 'walk' | 'blocked' | 'vending';

export type Position = { x: number; y: number };

// The cards a player carries into the village. Numbers may repeat, after takes.
export type VillageCards = { hand: CardValue[]; special: SpecialKind | null };

// A card a player gives up in the village.
export type CardChoice = { type: 'number'; value: CardValue } | { type: 'special' };

// A card the vending machine gives out. A special shows its kind.
export type VendedCard =
  { type: 'number'; value: CardValue } | { type: 'special'; kind: SpecialKind };

// One accusation, shown to everyone (design/10 section 4 and 13.1).
export type AccusationEntry = { accuserId: string; targetId: string; correct: boolean };

// The latest time two players met on a tile. Shown as a short bounce, so no token sits on another.
export type Meeting = { moverId: string; from: Position; to: Position; at: number };

export type VillageState = {
  cells: Cell[][];
  columns: number;
  rows: number;
  positions: Record<string, Position>;
  lastMoveAt: Record<string, number>;
  // Cards of players who are still in the game. Players who are out are observers.
  cards: Record<string, VillageCards>;
  out: Record<string, true>;
  // Public tags: how many accusations each player has received in this village.
  tags: Record<string, number>;
  accusationsMade: Record<string, number>;
  vendingUses: Record<string, number>;
  // Open challenges: the player who issued each one points at the player they challenge.
  challenges: Record<string, string>;
  // Mutual challenges, waiting for the next round.
  partners: Array<[string, string]>;
  // Every accusation in this village, shown to all players.
  log: AccusationEntry[];
  // Roles revealed to everyone by correct accusations.
  revealed: Record<string, Team>;
  meeting: Meeting | null;
  settings: GameSettings['village'];
};

export type VillageResult<T = VillageState> =
  { ok: true; value: T } | { ok: false; error: ErrorCode };

export type VillagePlayer = { id: string; cards: VillageCards; out?: boolean };

export function parseCells(rows: readonly string[]): Cell[][] {
  return rows.map((row) =>
    Array.from(row, (char) => (char === 'W' ? 'walk' : char === 'V' ? 'vending' : 'blocked')),
  );
}

// Creates the village for the players now in the game. Everyone starts on walkway tiles spread across the board.
export function createVillage(
  settings: GameSettings['village'],
  players: readonly VillagePlayer[],
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
  const out: Record<string, true> = {};
  players.forEach((player, index) => {
    positions[player.id] = shuffled[index % shuffled.length] ?? { x: 0, y: 0 };
    cards[player.id] = { hand: [...player.cards.hand], special: player.cards.special };
    tags[player.id] = 0;
    if (player.out) out[player.id] = true;
  });

  return {
    cells,
    columns: cells[0]?.length ?? 0,
    rows: cells.length,
    positions,
    lastMoveAt: {},
    cards,
    out,
    tags,
    accusationsMade: {},
    vendingUses: {},
    challenges: {},
    partners: [],
    log: [],
    revealed: {},
    meeting: null,
    settings,
  };
}

// A copy of a record without the given keys. Keeps the state immutable.
function without(record: Record<string, string>, ...keys: string[]): Record<string, string> {
  return Object.fromEntries(Object.entries(record).filter(([key]) => !keys.includes(key)));
}

function cellAt(state: VillageState, position: Position): Cell | null {
  return state.cells[position.y]?.[position.x] ?? null;
}

function isSameTile(state: VillageState, a: string, b: string): boolean {
  const pa = state.positions[a];
  const pb = state.positions[b];
  return pa !== undefined && pb !== undefined && pa.x === pb.x && pa.y === pb.y;
}

// One step to a neighbouring walkway tile (up, down, left, or right). Diagonals are not allowed. The cooldown keeps traffic low.
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
  // Stepping onto a tile where someone already stands is a meeting.
  const met = Object.entries(state.positions).some(
    ([id, at]) => id !== playerId && at.x === target.x && at.y === target.y,
  );
  return {
    ok: true,
    value: {
      ...state,
      positions: { ...state.positions, [playerId]: { x: target.x, y: target.y } },
      lastMoveAt: { ...state.lastMoveAt, [playerId]: now },
      meeting: met
        ? { moverId: playerId, from: { ...from }, to: { x: target.x, y: target.y }, at: now }
        : state.meeting,
    },
  };
}

// Challenges another player on the same tile to a duel for the next round (design/10 section 13.1).
// A challenge is mutual when both players challenge each other: they are then partners.
// `target` of null withdraws the player's challenge.
export function challenge(
  state: VillageState,
  fromId: string,
  target: string | null,
): VillageResult<{ state: VillageState; matched: boolean }> {
  if (state.out[fromId]) return { ok: false, error: 'OBSERVER_ONLY' };
  if (!state.positions[fromId]) return { ok: false, error: 'NOT_IN_VILLAGE' };

  if (target === null) {
    const challenges = without(state.challenges, fromId);
    return { ok: true, value: { state: { ...state, challenges }, matched: false } };
  }
  if (target === fromId) return { ok: false, error: 'CANNOT_ACCUSE_SELF' };
  if (!state.positions[target] || state.out[target]) return { ok: false, error: 'NOT_IN_VILLAGE' };
  if (!isSameTile(state, fromId, target)) return { ok: false, error: 'NOT_SAME_TILE' };

  const open: Record<string, string> = { ...state.challenges, [fromId]: target };
  if (open[target] === fromId) {
    // Mutual: both are partners for the next round, and neither has an open challenge.
    const challenges = without(open, fromId, target);
    const partners: Array<[string, string]> = [
      ...state.partners.filter(
        ([a, b]) => a !== fromId && b !== fromId && a !== target && b !== target,
      ),
      [fromId, target],
    ];
    return { ok: true, value: { state: { ...state, challenges, partners }, matched: true } };
  }
  return { ok: true, value: { state: { ...state, challenges: open }, matched: false } };
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

// Accuses another player on the same tile (design/10 section 4). Players who are out only watch.
// A player who holds cards pays one (any card). A correct accusation pays the accuser a random number card,
// and reveals the target's role to everyone. Every accusation is added to the public log.
// `teams` are the current roles of the players in the match.
export function accuse(
  state: VillageState,
  accuserId: string,
  targetId: string,
  paid: CardChoice | null,
  teams: Record<string, Team>,
  random: RandomFn,
): VillageResult<{ state: VillageState; correct: boolean }> {
  if (state.out[accuserId]) return { ok: false, error: 'OBSERVER_ONLY' };
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

  const correct = teams[targetId] === 'infected';
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
        log: [...state.log, { accuserId, targetId, correct }],
        revealed:
          correct && teams[targetId]
            ? { ...state.revealed, [targetId]: teams[targetId] }
            : state.revealed,
      },
    },
  };
}

// Uses the vending machine with one duplicate number card (design/10 section 5).
export function vend(
  state: VillageState,
  playerId: string,
  duplicate: CardValue,
  random: RandomFn,
): VillageResult<{ state: VillageState; received: VendedCard }> {
  if (state.out[playerId]) return { ok: false, error: 'OBSERVER_ONLY' };
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

// The cards each player leaves the village with.
export function carriedCards(state: VillageState): Record<string, VillageCards> {
  return { ...state.cards };
}

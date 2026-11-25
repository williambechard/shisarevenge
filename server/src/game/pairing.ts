// Pairing and the Warm-Up rule. Rules from design/04-game-rules.md section 4.1.
// Pure: randomness is injected, so tests can use a fixed sequence.

export type RandomFn = () => number;

export type PairingInput = {
  playerIds: readonly string[];
  byeCounts: Readonly<Record<string, number>>;
  // Keys from pairKey() for pairs used in the previous round.
  previousPairs: ReadonlySet<string>;
  random: RandomFn;
};

export type PairingResult = {
  pairs: Array<[string, string]>;
  warmUpId: string | null;
  byeCounts: Record<string, number>;
  // True when no attempt avoided every repeat. The least-repeating attempt is used.
  repeatsForced: boolean;
};

const MAX_SHUFFLES = 50;

export function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function shuffle<T>(items: readonly T[], random: RandomFn): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    const current = result[index];
    const other = result[swapIndex];
    if (current === undefined || other === undefined) continue;
    result[index] = other;
    result[swapIndex] = current;
  }
  return result;
}

// Picks the Warm-Up player: fewest byes so far, ties broken at random.
function chooseWarmUp(
  playerIds: readonly string[],
  byeCounts: Readonly<Record<string, number>>,
  random: RandomFn,
): string {
  const fewest = Math.min(...playerIds.map((id) => byeCounts[id] ?? 0));
  const candidates = playerIds.filter((id) => (byeCounts[id] ?? 0) === fewest);
  const index = Math.floor(random() * candidates.length);
  const chosen = candidates[index] ?? candidates[0];
  if (chosen === undefined) throw new Error('No Warm-Up candidate');
  return chosen;
}

function pairsFrom(ids: readonly string[]): Array<[string, string]> {
  const pairs: Array<[string, string]> = [];
  for (let index = 0; index + 1 < ids.length; index += 2) {
    const a = ids[index];
    const b = ids[index + 1];
    if (a !== undefined && b !== undefined) pairs.push([a, b]);
  }
  return pairs;
}

function countRepeats(
  pairs: ReadonlyArray<[string, string]>,
  previous: ReadonlySet<string>,
): number {
  return pairs.filter(([a, b]) => previous.has(pairKey(a, b))).length;
}

export function pairPlayers(input: PairingInput): PairingResult {
  const byeCounts: Record<string, number> = { ...input.byeCounts };
  let pool = [...input.playerIds];
  let warmUpId: string | null = null;

  if (pool.length % 2 === 1) {
    warmUpId = chooseWarmUp(pool, byeCounts, input.random);
    byeCounts[warmUpId] = (byeCounts[warmUpId] ?? 0) + 1;
    pool = pool.filter((id) => id !== warmUpId);
  }

  let best: { pairs: Array<[string, string]>; repeats: number } | null = null;
  for (let attempt = 0; attempt < MAX_SHUFFLES; attempt += 1) {
    const pairs = pairsFrom(shuffle(pool, input.random));
    const repeats = countRepeats(pairs, input.previousPairs);
    if (best === null || repeats < best.repeats) best = { pairs, repeats };
    if (repeats === 0) break;
  }

  const chosen = best ?? { pairs: [], repeats: 0 };
  return {
    pairs: chosen.pairs,
    warmUpId,
    byeCounts,
    repeatsForced: chosen.repeats > 0,
  };
}

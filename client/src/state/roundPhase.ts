import type { Phase } from '@shisa-revenge/shared';

// A player may still pick a card while the room is `selecting`, and also while it is `revealed`.
// The room becomes `revealed` as soon as the first duel reveals, so players in other duels can still lock in.
export function canChooseCard(phase: Phase | null): boolean {
  return phase === 'selecting' || phase === 'revealed';
}

// The opponent in this round's pairing, taken from the pairings for the round, not from stale private state.
export function opponentIn(
  pairings: ReadonlyArray<{ a: string; b: string }>,
  playerId: string | null,
): string | null {
  if (playerId === null) return null;
  const pair = pairings.find((candidate) => candidate.a === playerId || candidate.b === playerId);
  if (!pair) return null;
  return pair.a === playerId ? pair.b : pair.a;
}

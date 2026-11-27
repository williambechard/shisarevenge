// Resolves one duel from the effective strengths. Rules from design/04-game-rules.md sections 5 and 6.
// Effective strength (including the Shisa Mask bonus) is computed by the caller.

import type { SpecialKind, Team } from '@shisa-revenge/shared';

export type Combatant = {
  id: string;
  team: Team;
  effectiveStrength: number;
  // The special committed in this duel, or null. Spending happens in the caller.
  committed: SpecialKind | null;
  // A player who caught a cold earlier, and has not yet rebounded. See design/04 section 8.
  rebound?: boolean;
};

export type DuelOutcome = {
  // The stronger side. Null for a tie.
  winnerId: string | null;
  // A Survivor that loses to a Shisa's Army member catches a cold. Null otherwise.
  caughtCold: string | null;
  // True when a committed Protection Talisman stopped a freeze.
  blocked: boolean;
  // The Shisa's Army member recovered by a Survivor who committed Ramen and won. Null otherwise.
  recoveredId: string | null;
  // The Shisa's Army member who rebounds: a caught player who won a duel against another Army member. Null otherwise.
  reboundId: string | null;
};

export function resolveDuel(a: Combatant, b: Combatant): DuelOutcome {
  const none: DuelOutcome = {
    winnerId: null,
    caughtCold: null,
    blocked: false,
    recoveredId: null,
    reboundId: null,
  };
  if (a.effectiveStrength === b.effectiveStrength) return none;

  const winner = a.effectiveStrength > b.effectiveStrength ? a : b;

  // Only a mixed-team duel can change teams. Same-team duels never do.
  if (a.team === b.team) {
    // A caught player who wins against another Army member rebounds, once.
    const rebounds = winner.team === 'infected' && winner.rebound === true;
    return { ...none, winnerId: winner.id, reboundId: rebounds ? winner.id : null };
  }

  const armyMember = a.team === 'infected' ? a : b;
  const survivor = armyMember.id === a.id ? b : a;

  if (winner.id === armyMember.id) {
    // A committed Talisman blocks the freeze whatever the margin.
    if (survivor.committed === 'protection-talisman') {
      return { ...none, winnerId: winner.id, blocked: true };
    }
    return { ...none, winnerId: winner.id, caughtCold: survivor.id };
  }

  // The Survivor won. The attack is repelled, and Ramen also recovers the Army member.
  if (survivor.committed === 'ramen') {
    return { ...none, winnerId: winner.id, recoveredId: armyMember.id };
  }
  return { ...none, winnerId: winner.id };
}

// Resolves one duel from the played numbers. Rules from design/04-game-rules.md sections 5 and 6.
// Special cards are added in plan 05. The effective strength is already passed in.

import type { Team } from '@shisa-revenge/shared';

export type Combatant = {
  id: string;
  team: Team;
  effectiveStrength: number;
};

export type DuelOutcome = {
  // The stronger side. Null for a tie.
  winnerId: string | null;
  // A Survivor that loses to a Shisa's Army member catches a cold. Null otherwise.
  caughtCold: string | null;
};

export function resolveDuel(a: Combatant, b: Combatant): DuelOutcome {
  if (a.effectiveStrength === b.effectiveStrength) {
    return { winnerId: null, caughtCold: null };
  }

  const winner = a.effectiveStrength > b.effectiveStrength ? a : b;

  // Only a mixed-team duel can change teams. Same-team duels never do.
  const mixed = a.team !== b.team;
  const armyMember = a.team === 'infected' ? a : b;
  const survivor = armyMember.id === a.id ? b : a;
  const armyWon = winner.id === armyMember.id;

  if (mixed && armyWon && survivor.team === 'survivor') {
    return { winnerId: winner.id, caughtCold: survivor.id };
  }
  return { winnerId: winner.id, caughtCold: null };
}

// Win checks from design/04-game-rules.md section 9. Run after every round is resolved.

import type { Team } from '@shisa-revenge/shared';
import type { TeamMember } from './teamChanges.js';

export type WinResult = {
  winner: Team;
  reason: 'all-infected' | 'no-infected' | 'round-limit' | 'shared-elimination';
};

// The caller passes only active players (design section 4.7).
// If every player is out in the same round, the Survivors win (design section 9).
// Otherwise, with no active survivor, the Army wins.
export function checkWin(
  players: readonly TeamMember[],
  round: number,
  roundCount: number,
): WinResult | null {
  if (players.length === 0) {
    return { winner: 'survivor', reason: 'shared-elimination' };
  }
  if (!players.some((player) => player.team === 'survivor')) {
    return { winner: 'infected', reason: 'all-infected' };
  }
  if (!players.some((player) => player.team === 'infected')) {
    return { winner: 'survivor', reason: 'no-infected' };
  }
  if (round >= roundCount) {
    return { winner: 'survivor', reason: 'round-limit' };
  }
  return null;
}

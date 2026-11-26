// Win checks from design/04-game-rules.md section 9. Run after every round is resolved.

import { ROUND_COUNT, type Team } from '@shisa-revenge/shared';
import type { TeamMember } from './teamChanges.js';

export type WinResult = {
  winner: Team;
  reason: 'all-infected' | 'no-infected' | 'round-limit';
};

// The caller passes only active players (design section 4.7). With no active survivor, the Army wins.
export function checkWin(players: readonly TeamMember[], round: number): WinResult | null {
  if (!players.some((player) => player.team === 'survivor')) {
    return { winner: 'infected', reason: 'all-infected' };
  }
  if (!players.some((player) => player.team === 'infected')) {
    return { winner: 'survivor', reason: 'no-infected' };
  }
  if (round >= ROUND_COUNT) {
    return { winner: 'survivor', reason: 'round-limit' };
  }
  return null;
}

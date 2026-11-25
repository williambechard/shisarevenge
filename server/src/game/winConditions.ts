// Win checks from design/04-game-rules.md section 9. Run after every round is resolved.

import { ROUND_COUNT, type Team } from '@shisa-revenge/shared';
import type { TeamMember } from './teamChanges.js';

export type WinResult = {
  winner: Team;
  reason: 'all-infected' | 'no-infected' | 'round-limit';
};

export function checkWin(players: readonly TeamMember[], round: number): WinResult | null {
  if (players.length === 0) return null;

  if (players.every((player) => player.team === 'infected')) {
    return { winner: 'infected', reason: 'all-infected' };
  }
  if (players.every((player) => player.team === 'survivor')) {
    return { winner: 'survivor', reason: 'no-infected' };
  }
  if (round >= ROUND_COUNT) {
    const anySurvivor = players.some((player) => player.team === 'survivor');
    return { winner: anySurvivor ? 'survivor' : 'infected', reason: 'round-limit' };
  }
  return null;
}

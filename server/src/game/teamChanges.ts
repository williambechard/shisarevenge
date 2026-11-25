// Team changes from design/04-game-rules.md sections 7 and 8. Pure: the caller applies the result.
// Special-card handling (losing and gaining specials) is added in plan 05.

import type { Team } from '@shisa-revenge/shared';

export type TeamMember = { id: string; team: Team };

// A Survivor who loses a duel to a Shisa's Army member catches a cold and joins the Army.
export function catchCold<T extends TeamMember>(players: readonly T[], playerId: string): T[] {
  return players.map((player) =>
    player.id === playerId && player.team === 'survivor'
      ? { ...player, team: 'infected' as const }
      : player,
  );
}

// A Shisa's Army member who loses to a Survivor who committed a recovering card rejoins the Survivors.
export function recover<T extends TeamMember>(players: readonly T[], playerId: string): T[] {
  return players.map((player) =>
    player.id === playerId && player.team === 'infected'
      ? { ...player, team: 'survivor' as const }
      : player,
  );
}

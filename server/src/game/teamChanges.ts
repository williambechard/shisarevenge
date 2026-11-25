// Team changes from design/04-game-rules.md sections 7 and 8. Pure: the caller applies the result.
// Each function also updates the player's special card, as the spec describes.

import type { SpecialKind, SpecialStatus, Team } from '@shisa-revenge/shared';
import type { RandomFn } from './pairing.js';

export type PlayerSpecial = { kind: SpecialKind; status: SpecialStatus };

export type TeamMember = { id: string; team: Team; special: PlayerSpecial | null };

export type CatchResult<T> = {
  players: T[];
  // The Survivor special the player lost. Null when it was spent or absent.
  lostSpecial: SpecialKind | null;
};

export type RecoverResult<T> = {
  players: T[];
  newSpecial: SpecialKind;
};

// Design section 12.4: each Survivor gets one of the two Survivor specials at random.
export function randomSurvivorSpecial(random: RandomFn): SpecialKind {
  return random() < 0.5 ? 'protection-talisman' : 'ramen';
}

// A Survivor who loses a duel to a Shisa's Army member catches a cold and joins the Army.
// An unused Survivor special is lost. A spent one is kept as spent. The player then gets a fresh Shisa Mask.
export function catchCold<T extends TeamMember>(
  players: readonly T[],
  playerId: string,
): CatchResult<T> {
  let lostSpecial: SpecialKind | null = null;
  const updated = players.map((player) => {
    if (player.id !== playerId || player.team !== 'survivor') return player;
    if (player.special?.status === 'available') lostSpecial = player.special.kind;
    return {
      ...player,
      team: 'infected' as const,
      special: { kind: 'shisa-mask' as const, status: 'available' as const },
    };
  });
  return { players: updated, lostSpecial };
}

// A Shisa's Army member who loses to a Survivor who committed Ramen rejoins the Survivors.
// The Shisa Mask is lost, and the player gets a fresh random Survivor special.
export function recover<T extends TeamMember>(
  players: readonly T[],
  playerId: string,
  random: RandomFn,
): RecoverResult<T> {
  const newSpecial = randomSurvivorSpecial(random);
  const updated = players.map((player) => {
    if (player.id !== playerId || player.team !== 'infected') return player;
    return {
      ...player,
      team: 'survivor' as const,
      special: { kind: newSpecial, status: 'available' as const },
    };
  });
  return { players: updated, newSpecial };
}

import type { PublicPlayer } from '@shisa-revenge/shared';
import { PlayerChip } from '../molecules/PlayerChip.js';

type PlayerListProps = {
  players: PublicPlayer[];
  selfId: string | null;
};

export function PlayerList({ players, selfId }: PlayerListProps) {
  return (
    <section aria-labelledby="players-heading" className="flex w-full flex-col gap-2">
      <h2 id="players-heading" className="text-sm font-semibold text-navy">
        Players ({players.length} of 8)
      </h2>
      <ul className="flex flex-col gap-2">
        {players.map((player) => (
          <PlayerChip key={player.id} player={player} isSelf={player.id === selfId} />
        ))}
      </ul>
    </section>
  );
}

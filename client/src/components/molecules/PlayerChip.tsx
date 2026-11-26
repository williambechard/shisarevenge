import type { PublicPlayer } from '@shisa-revenge/shared';
import { Avatar } from './Avatar.js';

type PlayerChipProps = {
  player: PublicPlayer;
  isSelf: boolean;
};

// Icon, name, and connection text. Each state uses words, not only color.
export function PlayerChip({ player, isSelf }: PlayerChipProps) {
  const tags = [isSelf ? 'You' : null, player.connected ? null : 'Disconnected'].filter(
    (tag): tag is string => tag !== null,
  );

  return (
    <li className="flex min-h-11 items-center justify-between gap-3 rounded-xl bg-white/60 px-4 py-2">
      <span className="flex min-w-0 items-center gap-2">
        <Avatar name={player.name} icon={player.icon} self={isSelf} />
        <span className="truncate font-semibold text-navy">{player.name}</span>
      </span>
      {tags.length > 0 ? <span className="text-xs text-navy/70">{tags.join(' · ')}</span> : null}
    </li>
  );
}

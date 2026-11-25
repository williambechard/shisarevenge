import type { PublicPlayer } from '@shisa-revenge/shared';

type PlayerChipProps = {
  player: PublicPlayer;
  isSelf: boolean;
};

// Name and connection text. Each state uses words, not only color.
export function PlayerChip({ player, isSelf }: PlayerChipProps) {
  const tags = [isSelf ? 'You' : null, player.connected ? null : 'Disconnected'].filter(
    (tag): tag is string => tag !== null,
  );

  return (
    <li className="flex min-h-11 items-center justify-between gap-3 rounded-xl bg-white/60 px-4 py-2">
      <span className="font-semibold text-navy">{player.name}</span>
      {tags.length > 0 ? <span className="text-xs text-navy/70">{tags.join(' · ')}</span> : null}
    </li>
  );
}

import { playerIconSrc } from '../../assets/playericons/index.js';

type AvatarProps = {
  name: string;
  // Index of the player's icon. Each seat in a room has its own.
  icon: number;
  // Marks the player's own icon.
  self: boolean;
  // A bigger icon, for announcements.
  large?: boolean;
};

// A player's icon. The picture stands in for the player everywhere: the lobby, the header, and the walkway.
export function Avatar({ name, icon, self, large = false }: AvatarProps) {
  return (
    <img
      src={playerIconSrc(icon)}
      alt={`${name}${self ? ' (you)' : ''}`}
      draggable={false}
      className={`${large ? 'size-20' : 'size-9'} shrink-0 rounded-full bg-sand object-cover shadow-lg ${self ? 'ring-2 ring-gold' : ''}`}
    />
  );
}

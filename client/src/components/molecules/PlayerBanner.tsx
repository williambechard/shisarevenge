import { Avatar } from './Avatar.js';

type PlayerBannerProps = {
  name: string;
  // The player's icon index. Null before the player has one.
  icon: number | null;
  // The role, such as Survivor. Null before the role is known.
  role: string | null;
};

// The header of the screen: this player's name and role, across the full width, in light text on
// the same coral as the current round chip.
export function PlayerBanner({ name, icon, role }: PlayerBannerProps) {
  return (
    <header
      aria-label="Your name and role"
      className="-mx-5 -mt-[max(1.5rem,env(safe-area-inset-top))] mb-2 bg-coral px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-3 text-center text-base font-bold text-sand"
    >
      <span className="flex items-center justify-center gap-2">
        {icon !== null ? <Avatar name={name} icon={icon} self /> : null}
        <span>{role ? `${name} \u00B7 ${role}` : name}</span>
      </span>
    </header>
  );
}

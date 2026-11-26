type PlayerBannerProps = {
  name: string;
  // The role, such as Survivor. Null before the role is known.
  role: string | null;
};

// The header of the screen: this player's name and role, across the full width, in light text on
// the coral used for the current round.
export function PlayerBanner({ name, role }: PlayerBannerProps) {
  return (
    <header
      aria-label="Your name and role"
      className="-mx-5 -mt-[max(1.5rem,env(safe-area-inset-top))] mb-2 bg-coral-deep px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-3 text-center text-base font-bold text-sand"
    >
      {role ? `${name} \u00B7 ${role}` : name}
    </header>
  );
}

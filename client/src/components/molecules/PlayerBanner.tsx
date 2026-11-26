type PlayerBannerProps = {
  name: string;
  // The role, such as Survivor. Null before the role is known.
  role: string | null;
};

// The top of the screen: this player's name and role, in strong contrast on the bingata red.
export function PlayerBanner({ name, role }: PlayerBannerProps) {
  return (
    <p
      aria-label="Your name and role"
      className="w-full rounded-xl bg-shisa px-4 py-2 text-center text-base font-bold text-sand shadow-md"
    >
      {role ? `${name} * ${role}` : name}
    </p>
  );
}

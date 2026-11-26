type AvatarProps = {
  name: string;
  // Index into the eight colours, so each player keeps the same colour.
  colour: number;
  // Marks the player's own token.
  self: boolean;
};

const COLOURS = [
  'bg-coral',
  'bg-navy',
  'bg-bingata-green',
  'bg-sea',
  'bg-gold',
  'bg-indigo',
  'bg-bingata-pink',
  'bg-bingata-yellow',
] as const;

// A player's token on the walkway: their first letter on a colour. Code-drawn, so it needs no art.
export function Avatar({ name, colour, self }: AvatarProps) {
  const background = COLOURS[colour % COLOURS.length] ?? 'bg-navy';
  return (
    <span
      aria-label={`${name}${self ? ' (you)' : ''}`}
      className={`flex size-6 items-center justify-center rounded-full text-xs font-bold text-sand shadow ${background} ${self ? 'ring-2 ring-gold' : ''}`}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

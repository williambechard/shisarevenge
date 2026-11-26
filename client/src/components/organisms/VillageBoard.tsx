import type { PublicPlayer, PublicVillage } from '@shisa-revenge/shared';
import { VENDING_ART } from '../../assets/village/index.js';
import { DirectionArrow } from '../atoms/DirectionArrow.js';
import { Token, type Bounce } from '../molecules/Token.js';

type Position = { x: number; y: number };

type VillageBoardProps = {
  board: string[];
  positions: Record<string, Position>;
  meeting: PublicVillage['meeting'];
  players: PublicPlayer[];
  selfId: string | null;
  // Called with the tile a player taps. Only the four tiles next to the player's own token are enabled.
  onStep: (x: number, y: number) => void;
  // Called when the player taps the vending machine from a tile next to it.
  onVendingTap: () => void;
};

// Horizontal gap in pixels between two tokens that share one tile.
const TOKEN_SPREAD_PX = 14;

const keyOf = (position: Position): string => `${String(position.x)},${String(position.y)}`;

// One step up, down, left, or right. Diagonals do not count.
function isNeighbour(a: Position | undefined, b: Position): boolean {
  return a !== undefined && Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1;
}

// The walkway grid. Tiles are see-through, so the village background shows through. The tiles next to
// the player's own token are outlined and carry a direction arrow from that token. Tokens sit in a layer
// above the tiles, so they glide between tiles. A player who meets another stays on the tile they
// stepped onto, and gives a small recoil there. The server keeps the same tile, so arrows and moves agree.
export function VillageBoard({
  board,
  positions,
  meeting,
  players,
  selfId,
  onStep,
  onVendingTap,
}: VillageBoardProps) {
  const columns = board[0]?.length ?? 0;
  const rows = board.length;
  const own = selfId === null ? undefined : positions[selfId];

  const seats = players.filter((player) => positions[player.id] !== undefined);
  const tokensOn = new Map<string, PublicPlayer[]>();
  for (const player of seats) {
    const at = positions[player.id];
    if (!at) continue;
    const key = keyOf(at);
    tokensOn.set(key, [...(tokensOn.get(key) ?? []), player]);
  }

  return (
    <div className="relative w-full">
      <div
        role="group"
        aria-label="Walkway"
        className="grid w-full"
        style={{ gridTemplateColumns: `repeat(${String(columns)}, minmax(0, 1fr))` }}
      >
        {board.flatMap((row, y) =>
          Array.from(row, (char, x) => {
            const here = { x, y };
            const enabled = isNeighbour(own, here) && (char === 'W' || char === 'V');
            return (
              <button
                key={keyOf(here)}
                type="button"
                disabled={!enabled}
                aria-label={
                  char === 'V'
                    ? 'Vending machine'
                    : `Tile ${String(x + 1)}, ${String(y + 1)}${enabled ? ', you can walk here' : ''}`
                }
                onClick={() => {
                  if (char === 'V') {
                    onVendingTap();
                  } else {
                    onStep(x, y);
                  }
                }}
                className={`relative aspect-square overflow-hidden bg-transparent focus-visible:outline-3 focus-visible:outline-gold ${enabled ? 'ring-2 ring-inset ring-gold' : ''}`}
              >
                {char === 'V' ? (
                  <img
                    src={VENDING_ART}
                    alt=""
                    className="absolute inset-0 size-full object-contain"
                    draggable={false}
                  />
                ) : null}
                {enabled && own ? (
                  <DirectionArrow
                    dx={x - own.x}
                    dy={y - own.y}
                    className="absolute inset-0 m-auto"
                  />
                ) : null}
              </button>
            );
          }),
        )}
      </div>

      <div className="pointer-events-none absolute inset-0">
        {seats.map((player) => {
          const at = positions[player.id];
          if (!at) return null;
          const sharing = tokensOn.get(keyOf(at)) ?? [];
          const index = sharing.indexOf(player);
          const spread = (index - (sharing.length - 1) / 2) * TOKEN_SPREAD_PX;
          // The mover recoils, opposite to the way they walked in, once they have arrived on the tile.
          const bounce: Bounce =
            meeting &&
            meeting.moverId === player.id &&
            at.x === meeting.to.x &&
            at.y === meeting.to.y
              ? {
                  dx: -Math.sign(meeting.to.x - meeting.from.x),
                  dy: -Math.sign(meeting.to.y - meeting.from.y),
                  at: meeting.at,
                }
              : null;
          return (
            <Token
              key={player.id}
              name={player.name}
              colour={players.indexOf(player)}
              self={player.id === selfId}
              x={at.x}
              y={at.y}
              cols={columns}
              rows={rows}
              spread={spread}
              bounce={bounce}
            />
          );
        })}
      </div>
    </div>
  );
}

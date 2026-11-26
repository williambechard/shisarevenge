import {
  isWalkableChar,
  reachableTiles,
  type PublicPlayer,
  type PublicVillage,
} from '@shisa-revenge/shared';
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
  // Called with the tile a player taps. Every open tile the player can reach is enabled.
  onStep: (x: number, y: number) => void;
};

// Horizontal gap in pixels between two tokens that share one tile.
const TOKEN_SPREAD_PX = 14;

const keyOf = (position: Position): string => `${String(position.x)},${String(position.y)}`;

// Where a token is drawn. After a meeting the mover is drawn back on the tile they came from, until the
// mover moves again. That keeps two tokens from sharing one tile on screen during the bounce.
function drawnAt(
  playerId: string,
  positions: Record<string, Position>,
  meeting: PublicVillage['meeting'],
): Position | undefined {
  const actual = positions[playerId];
  if (
    meeting &&
    meeting.moverId === playerId &&
    actual &&
    actual.x === meeting.to.x &&
    actual.y === meeting.to.y
  ) {
    return meeting.from;
  }
  return actual;
}

// The walkway grid. Tiles are see-through, so the village background shows through. Each reachable tile
// is outlined and carries a direction arrow from the player's own tile. Tokens sit in a layer above the
// tiles, so they can glide between tiles. When two players meet, the mover lunges toward the other
// player's tile and bounces back to where they came from.
export function VillageBoard({
  board,
  positions,
  meeting,
  players,
  selfId,
  onStep,
}: VillageBoardProps) {
  const columns = board[0]?.length ?? 0;
  const rows = board.length;
  const own = selfId === null ? undefined : positions[selfId];
  const reachable = new Set(
    own
      ? reachableTiles(columns, rows, (x, y) => isWalkableChar(board[y]?.[x]), own).map(keyOf)
      : [],
  );

  const seats = players.filter((player) => positions[player.id] !== undefined);
  const tokensOn = new Map<string, PublicPlayer[]>();
  for (const player of seats) {
    const at = drawnAt(player.id, positions, meeting);
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
            const enabled = reachable.has(keyOf(here));
            return (
              <button
                key={keyOf(here)}
                type="button"
                disabled={!enabled}
                aria-label={`Tile ${String(x + 1)}, ${String(y + 1)}${enabled ? ', you can walk here' : ''}`}
                onClick={() => {
                  onStep(x, y);
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
          const at = drawnAt(player.id, positions, meeting);
          if (!at) return null;
          const sharing = tokensOn.get(keyOf(at)) ?? [];
          const index = sharing.indexOf(player);
          const spread = (index - (sharing.length - 1) / 2) * TOKEN_SPREAD_PX;
          const actual = positions[player.id];
          const bounce: Bounce =
            meeting &&
            meeting.moverId === player.id &&
            actual?.x === meeting.to.x &&
            actual.y === meeting.to.y
              ? {
                  dx: Math.sign(meeting.to.x - meeting.from.x),
                  dy: Math.sign(meeting.to.y - meeting.from.y),
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

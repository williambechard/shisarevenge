import { Avatar } from '../molecules/Avatar.js';
import { VENDING_ART, WALKWAY_ART } from '../../assets/village/index.js';
import type { PublicPlayer } from '@shisa-revenge/shared';

type Position = { x: number; y: number };

type VillageBoardProps = {
  board: string[];
  positions: Record<string, Position>;
  players: PublicPlayer[];
  selfId: string | null;
  // Called with the tile a player taps. Only the tiles next to the player's own token are enabled.
  onStep: (x: number, y: number) => void;
};

function isNeighbour(a: Position | undefined, b: Position): boolean {
  if (!a) return false;
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1;
}

// The walkway grid. Stone tiles, the vending machine tile, blocked sand, and each player's token.
export function VillageBoard({ board, positions, players, selfId, onStep }: VillageBoardProps) {
  const own = selfId === null ? undefined : positions[selfId];
  const seats = players.filter((player) => positions[player.id] !== undefined);

  return (
    <div
      role="group"
      aria-label="Walkway"
      className="grid w-full gap-px rounded-xl bg-navy/30 p-1"
      style={{ gridTemplateColumns: `repeat(${String(board[0]?.length ?? 0)}, minmax(0, 1fr))` }}
    >
      {board.flatMap((row, y) =>
        Array.from(row, (char, x) => {
          const here = { x, y };
          const tokens = seats.filter((player) => {
            const at = positions[player.id];
            return at !== undefined && at.x === x && at.y === y;
          });
          const enabled = char !== 'X' && isNeighbour(own, here);
          const art = WALKWAY_ART[(x + y * 2) % WALKWAY_ART.length];
          return (
            <button
              key={`${String(x)}-${String(y)}`}
              type="button"
              disabled={!enabled}
              aria-label={`Tile ${String(x + 1)}, ${String(y + 1)}${enabled ? ', you can step here' : ''}`}
              onClick={() => {
                onStep(x, y);
              }}
              className={`relative aspect-square overflow-hidden focus-visible:outline-3 focus-visible:outline-gold ${
                char === 'X' ? 'bg-[#d9c39a]' : 'bg-cover bg-center'
              } ${enabled ? 'ring-2 ring-inset ring-gold' : ''}`}
              style={char === 'X' ? undefined : { backgroundImage: `url(${art ?? ''})` }}
            >
              {char === 'V' ? (
                <img
                  src={VENDING_ART}
                  alt=""
                  className="absolute inset-0 size-full object-contain"
                  draggable={false}
                />
              ) : null}
              <span className="absolute inset-0 flex flex-wrap items-center justify-center gap-0.5">
                {tokens.map((player) => (
                  <Avatar
                    key={player.id}
                    name={player.name}
                    colour={players.indexOf(player)}
                    self={player.id === selfId}
                  />
                ))}
              </span>
            </button>
          );
        }),
      )}
    </div>
  );
}

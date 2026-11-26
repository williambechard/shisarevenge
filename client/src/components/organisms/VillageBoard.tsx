import { motion } from 'motion/react';
import type { PublicPlayer, PublicVillage } from '@shisa-revenge/shared';
import { VENDING_ART } from '../../assets/village/index.js';
import { Avatar } from '../molecules/Avatar.js';

type Position = { x: number; y: number };

type VillageBoardProps = {
  board: string[];
  positions: Record<string, Position>;
  meeting: PublicVillage['meeting'];
  players: PublicPlayer[];
  selfId: string | null;
  // Called with the tile a player taps. Only the tiles next to the player's own token are enabled.
  onStep: (x: number, y: number) => void;
};

function isNeighbour(a: Position | undefined, b: Position): boolean {
  if (!a) return false;
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1;
}

// Where a token is drawn. After a meeting the mover is drawn back on the tile they came from. That keeps
// two tokens from sharing one tile on screen, until the mover moves again.
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

// The walkway grid. Tiles are see-through, so the village background shows through. The only mark on a
// tile is its available highlight, and the vending machine on its tile. Each player's token sits on its tile.
// When two players meet, the mover lunges toward the other's tile and bounces back to where they came from.
export function VillageBoard({
  board,
  positions,
  meeting,
  players,
  selfId,
  onStep,
}: VillageBoardProps) {
  const own = selfId === null ? undefined : positions[selfId];
  const seats = players.filter((player) => positions[player.id] !== undefined);
  const drawn = (player: PublicPlayer): Position | undefined =>
    drawnAt(player.id, positions, meeting);

  return (
    <div
      role="group"
      aria-label="Walkway"
      className="grid w-full gap-px p-1"
      style={{ gridTemplateColumns: `repeat(${String(board[0]?.length ?? 0)}, minmax(0, 1fr))` }}
    >
      {board.flatMap((row, y) =>
        Array.from(row, (char, x) => {
          const here = { x, y };
          const tokens = seats.filter((player) => {
            const at = drawn(player);
            return at !== undefined && at.x === x && at.y === y;
          });
          const enabled = char !== 'X' && isNeighbour(own, here);
          // The bounce: the mover lunges toward the other player's tile, then returns.
          const bounce = meeting && meeting.from.x === x && meeting.from.y === y ? meeting : null;
          const dx = bounce ? Math.sign(bounce.to.x - bounce.from.x) : 0;
          const dy = bounce ? Math.sign(bounce.to.y - bounce.from.y) : 0;
          return (
            <button
              key={`${String(x)}-${String(y)}`}
              type="button"
              disabled={!enabled}
              aria-label={`Tile ${String(x + 1)}, ${String(y + 1)}${enabled ? ', you can step here' : ''}`}
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
              <span className="absolute inset-0 flex flex-wrap items-center justify-center gap-0.5">
                {tokens.map((player) => {
                  const mover = bounce !== null && bounce.moverId === player.id;
                  const avatar = (
                    <Avatar
                      name={player.name}
                      colour={players.indexOf(player)}
                      self={player.id === selfId}
                    />
                  );
                  if (!mover) return <span key={player.id}>{avatar}</span>;
                  return (
                    <motion.span
                      key={`${player.id}-${String(bounce.at)}`}
                      initial={{ x: '0%', y: '0%' }}
                      animate={{
                        x: ['0%', `${String(dx * 60)}%`, '0%'],
                        y: ['0%', `${String(dy * 60)}%`, '0%'],
                      }}
                      transition={{ duration: 0.7, times: [0, 0.5, 1], ease: 'easeInOut' }}
                    >
                      {avatar}
                    </motion.span>
                  );
                })}
              </span>
            </button>
          );
        }),
      )}
    </div>
  );
}

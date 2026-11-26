// Walkway grid helpers shared by the server (which checks moves) and the client (which shows where a
// player can go). A tile is open when `isOpen` says so: walkway and vending tiles are open, blocked
// tiles are not. Players walk up, down, left, or right through open tiles.

export type TilePosition = { x: number; y: number };

const STEPS: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

// Every open tile a player can reach from `from`. The start tile is not included.
export function reachableTiles(
  columns: number,
  rows: number,
  isOpen: (x: number, y: number) => boolean,
  from: TilePosition,
): TilePosition[] {
  const seen = new Set<string>([`${String(from.x)},${String(from.y)}`]);
  const queue: TilePosition[] = [from];
  const found: TilePosition[] = [];
  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];
    if (!current) continue;
    for (const [dx, dy] of STEPS) {
      const next = { x: current.x + dx, y: current.y + dy };
      if (next.x < 0 || next.y < 0 || next.x >= columns || next.y >= rows) continue;
      const key = `${String(next.x)},${String(next.y)}`;
      if (seen.has(key) || !isOpen(next.x, next.y)) continue;
      seen.add(key);
      queue.push(next);
      found.push(next);
    }
  }
  return found;
}

// Whether a board character is a tile players can walk on. `W` is walkway, `V` is the vending machine.
export function isWalkableChar(char: string | undefined): boolean {
  return char === 'W' || char === 'V';
}

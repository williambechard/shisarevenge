// Loads data/settings.json at startup and checks every value. A bad value stops the server with a clear message.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const boardRow = z.string().regex(/^[WXV]{7}$/, 'each board row is 7 characters of W, X or V');

const settingsSchema = z.object({
  village: z.object({
    villageSeconds: z.number().int().min(5).max(600),
    moveCooldownMs: z.number().int().min(0).max(5000),
    accusationsPerPlayer: z.number().int().min(0).max(10),
    vending: z.object({
      specialChance: z.number().min(0).max(1),
      usesPerVillage: z.number().int().min(0).max(10),
    }),
    board: z.array(boardRow).length(5),
  }),
});

export type GameSettings = z.infer<typeof settingsSchema>;

// data/ sits at the repository root. Works from both server/src and server/dist.
const SETTINGS_PATH = fileURLToPath(new URL('../../../data/settings.json', import.meta.url));

export function parseSettings(raw: unknown): GameSettings {
  const parsed = settingsSchema.safeParse(raw);
  if (!parsed.success) {
    const problems = parsed.error.issues.map(
      (issue) => `${issue.path.join('.')}: ${issue.message}`,
    );
    throw new Error(`Invalid data/settings.json: ${problems.join('; ')}`);
  }
  const vendingTiles = parsed.data.village.board.join('').split('V').length - 1;
  if (vendingTiles !== 1) throw new Error('Invalid data/settings.json: board needs exactly one V');
  return parsed.data;
}

export function loadSettings(path: string = SETTINGS_PATH): GameSettings {
  return parseSettings(JSON.parse(readFileSync(path, 'utf8')) as unknown);
}

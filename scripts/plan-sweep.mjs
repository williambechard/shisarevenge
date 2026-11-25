// Moves finished plans from plan/wip to plan/complete.
// A plan is finished when it has at least one checklist item and no unchecked items.
// Run with: npm run plans:sweep

import { readdirSync, readFileSync, renameSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const wipDir = join(root, 'plan', 'wip');
const completeDir = join(root, 'plan', 'complete');

const checkbox = /^\s*-\s\[( |x|X)\]/;

function isFinished(text) {
  const boxes = text.split(/\r?\n/).filter((line) => checkbox.test(line));
  if (boxes.length === 0) return false;
  return boxes.every((line) => /\[(x|X)\]/.test(line));
}

if (!existsSync(wipDir)) {
  console.log('No plan/wip folder. Nothing to do.');
  process.exit(0);
}

mkdirSync(completeDir, { recursive: true });

const moved = [];
const pending = [];

for (const file of readdirSync(wipDir)
  .filter((f) => f.endsWith('.md'))
  .sort()) {
  const source = join(wipDir, file);
  if (isFinished(readFileSync(source, 'utf8'))) {
    renameSync(source, join(completeDir, file));
    moved.push(file);
  } else {
    pending.push(file);
  }
}

for (const file of moved) console.log(`moved: plan/wip/${file} -> plan/complete/${file}`);
for (const file of pending) console.log(`open:  plan/wip/${file}`);
if (moved.length === 0 && pending.length === 0) console.log('No plans in plan/wip.');

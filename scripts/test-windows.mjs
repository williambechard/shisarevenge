// Opens several separate browser windows on the game, side by side, for local testing.
// Each window uses its own browser profile, so each one holds its own seat.
//
// Usage: npm run test:windows              (4 windows, http://localhost:5173)
//        npm run test:windows -- --count 8 --url http://localhost:5173 --width 400 --height 820

import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const profilesDir = join(root, '.testprofiles');

const BROWSERS = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
];

function option(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  return value === undefined ? fallback : value;
}

const count = Number.parseInt(option('count', '4'), 10);
const url = option('url', 'http://localhost:5173');
const width = Number.parseInt(option('width', '400'), 10);
const height = Number.parseInt(option('height', '820'), 10);
const gap = 10;
const top = 40;

const browser = BROWSERS.find((path) => existsSync(path));
if (!browser) {
  console.error('No Microsoft Edge or Google Chrome found in the standard locations.');
  process.exit(1);
}

if (!Number.isInteger(count) || count < 1 || count > 8) {
  console.error('--count must be a whole number from 1 to 8.');
  process.exit(1);
}

// Earlier runs leave windows behind: the browser restores each profile's last session on launch.
// Close any test windows still open, then clear the saved sessions, so each run starts clean.
function closeOldTestWindows() {
  // Only browser processes whose profile lives under .testprofiles are closed.
  const script = [
    "Get-CimInstance Win32_Process -Filter \"Name='msedge.exe' OR Name='chrome.exe'\"",
    "Where-Object { $_.CommandLine -like '*user-data-dir=*testprofiles*' }",
    'ForEach-Object { Stop-Process -Id .ProcessId -Force -ErrorAction SilentlyContinue }',
  ].join(' | ');
  spawnSync('powershell', ['-NoProfile', '-Command', script], { stdio: 'ignore' });
}
const SESSION_ENTRIES = [
  // sessionStorage holds each tab's seat. The browser restores it with the tab, so it must go too.
  'Session Storage',
  'Sessions',
  'Current Session',
  'Last Session',
  'Current Tabs',
  'Last Tabs',
];

function clearSavedSession(profile) {
  for (const entry of SESSION_ENTRIES) {
    try {
      rmSync(join(profile, 'Default', entry), { recursive: true, force: true });
    } catch {
      // A file still locked by a closing browser is skipped. The next run clears it.
    }
  }
}

closeOldTestWindows();
// Give the closing browsers a moment to release their files.
Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1500);
mkdirSync(profilesDir, { recursive: true });

for (let index = 0; index < count; index += 1) {
  const profile = join(profilesDir, `window-${String(index + 1)}`);
  clearSavedSession(profile);
  const args = [
    `--user-data-dir=${profile}`,
    '--no-first-run',
    '--no-default-browser-check',
    `--window-size=${String(width)},${String(height)}`,
    `--window-position=${String(index * (width + gap))},${String(top)}`,
    `--app=${url}`,
  ];
  const child = spawn(browser, args, { detached: true, stdio: 'ignore' });
  child.unref();
}

console.log(`Opened ${String(count)} windows at ${url} using ${browser}.`);
console.log(`Profiles are kept in ${profilesDir} (ignored by git).`);

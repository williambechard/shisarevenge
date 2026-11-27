// Music and sound effects. Browsers block sound until the player taps the page, so nothing plays before the
// first tap. Music the screen asked for starts at that tap. The mute setting is saved in localStorage.
import { MUSIC, SFX, type MusicTrack, type SfxName } from './tracks.js';

const MUTE_KEY = 'shisa-revenge:muted';
const MUSIC_VOLUME = 0.45;

type Listener = () => void;

function readMuted(): boolean {
  try {
    return window.localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

let muted = readMuted();
let unlocked = false;
// The track the current screen wants. Null means no music.
let wanted: MusicTrack | null = null;
let music: HTMLAudioElement | null = null;
let playing: MusicTrack | null = null;
const listeners = new Set<Listener>();

function notify(): void {
  for (const listener of listeners) listener();
}

function applyMusic(): void {
  if (wanted === null) {
    music?.pause();
    music = null;
    playing = null;
    return;
  }
  if (!unlocked || muted) {
    music?.pause();
    return;
  }
  if (music && playing === wanted) {
    if (music.paused) void music.play().catch(() => undefined);
    return;
  }
  music?.pause();
  music = new Audio(MUSIC[wanted]);
  music.loop = true;
  music.volume = MUSIC_VOLUME;
  playing = wanted;
  void music.play().catch(() => undefined);
}

// The first tap unlocks sound. Anything the screen asked for is started then.
function unlock(): void {
  if (unlocked) return;
  unlocked = true;
  applyMusic();
}

if (typeof document !== 'undefined') {
  document.addEventListener('pointerdown', unlock);
}

// Asks for a background track. The same track keeps playing, so a re-render does not restart it.
export function setMusic(track: MusicTrack | null): void {
  wanted = track;
  applyMusic();
}

// Plays a one-shot sound. Each play gets its own element, so quick repeats overlap instead of cutting off.
export function playSfx(name: SfxName, volume = 0.8): void {
  if (!unlocked || muted) return;
  const audio = new Audio(SFX[name]);
  audio.volume = volume;
  void audio.play().catch(() => undefined);
}

export function isMuted(): boolean {
  return muted;
}

export function toggleMuted(): void {
  muted = !muted;
  try {
    window.localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch {
    // Storage can be blocked. The setting then lasts for this page only.
  }
  applyMusic();
  notify();
}

// For components that show the mute state. Subscribers are told when it changes.
export function subscribeMuted(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

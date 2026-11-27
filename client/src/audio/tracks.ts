// Audio files and the names the game uses for them. Files live in assets/audio (design/11-audio.md).
import duel from '../assets/audio/music/duel.mp3';
import lobby from '../assets/audio/music/lobby.mp3';
import story from '../assets/audio/music/story.mp3';
import village from '../assets/audio/music/village.mp3';
import bad from '../assets/audio/sfx/bad.wav';
import no from '../assets/audio/sfx/no.wav';
import select from '../assets/audio/sfx/select.wav';
import step from '../assets/audio/sfx/step.mp3';
import success from '../assets/audio/sfx/success.mp3';
import tick from '../assets/audio/sfx/repeatedTimeAlmostUp.wav';

// Looping background tracks. The story track is for the story screen, which is not built yet.
export const MUSIC = { lobby, duel, village, story } as const;
export type MusicTrack = keyof typeof MUSIC;

// One-shot sound effects.
export const SFX = { bad, no, select, step, success, tick } as const;
export type SfxName = keyof typeof SFX;

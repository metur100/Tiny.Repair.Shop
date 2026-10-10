import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

import { useGameStore } from '@/store/useGameStore';

const SOURCES = {
  tap: require('../../assets/sounds/tap.wav'),
  clean: require('../../assets/sounds/clean.wav'),
  screw: require('../../assets/sounds/screw.wav'),
  wire: require('../../assets/sounds/wire.wav'),
  tool: require('../../assets/sounds/tool.wav'),
  repair: require('../../assets/sounds/repair.wav'),
  powerOn: require('../../assets/sounds/powerOn.wav'),
  happy: require('../../assets/sounds/happy.wav'),
  coins: require('../../assets/sounds/coins.wav'),
  upgrade: require('../../assets/sounds/upgrade.wav'),
  error: require('../../assets/sounds/error.wav'),
  sparkle: require('../../assets/sounds/sparkle.wav'),
  static: require('../../assets/sounds/static.wav'),
  note: require('../../assets/sounds/note.wav'),
  sourNote: require('../../assets/sounds/sourNote.wav'),
  shutter: require('../../assets/sounds/shutter.wav'),
  rattle: require('../../assets/sounds/rattle.wav'),
  pump: require('../../assets/sounds/pump.wav'),
} as const;

export type SoundName = keyof typeof SOURCES;

const players = new Map<SoundName, AudioPlayer>();
let music: AudioPlayer | null = null;
let ready = false;

/** Sets the audio mode once (mix with other apps, respect the silent switch). */
export async function initAudio(): Promise<void> {
  if (ready) return;
  ready = true;
  try {
    await setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' });
  } catch {
    // Audio is optional: the game is fully playable without it.
  }
}

function player(name: SoundName): AudioPlayer | null {
  let p = players.get(name);
  if (!p) {
    try {
      p = createAudioPlayer(SOURCES[name]);
      players.set(name, p);
    } catch {
      return null;
    }
  }
  return p;
}

const lastPlayed = new Map<SoundName, number>();

/**
 * Plays a sound effect if sound is on. Optional pitch for variation (e.g. tuning) and `minGap` (ms)
 * to skip repeats of the same sound during continuous gestures like scrubbing or tuning.
 */
export function playSound(name: SoundName, opts: { volume?: number; rate?: number; minGap?: number } = {}): void {
  if (!useGameStore.getState().settings.sound) return;
  if (opts.minGap) {
    const now = Date.now();
    if (now - (lastPlayed.get(name) ?? 0) < opts.minGap) return;
    lastPlayed.set(name, now);
  }
  const p = player(name);
  if (!p) return;
  try {
    p.volume = opts.volume ?? 0.8;
    if (opts.rate) p.setPlaybackRate(opts.rate);
    void p.seekTo(0);
    p.play();
  } catch {
    // Ignore playback errors.
  }
}

/** Starts or stops the background music loop according to the settings. */
export function syncMusic(): void {
  const on = useGameStore.getState().settings.music;
  try {
    if (on) {
      if (!music) {
        music = createAudioPlayer(require('../../assets/sounds/music.wav'));
        music.loop = true;
        music.volume = 0.32;
      }
      if (!music.playing) music.play();
    } else if (music?.playing) {
      music.pause();
    }
  } catch {
    // Ignore.
  }
}

export function pauseMusic(): void {
  try {
    music?.pause();
  } catch {
    // Ignore.
  }
}

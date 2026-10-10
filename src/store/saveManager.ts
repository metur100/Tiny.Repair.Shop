import AsyncStorage from '@react-native-async-storage/async-storage';

import { startingCosmetics } from '@/data/cosmetics';
import type { Customization } from '@/data/types';

export const SAVE_KEY = 'tiny-repair-shop/save';
export const SAVE_VERSION = 2;

export interface Settings {
  sound: boolean;
  music: boolean;
  vibration: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
}

export interface JobRecord {
  bestQuality: number;
  stars: 1 | 2 | 3;
  bestSatisfaction: number;
  timesCompleted: number;
  /** The look the object left the shop with (favourite design shown in the collection). */
  design: Customization;
  lastCompletedAt: number;
}

export interface SaveData {
  version: typeof SAVE_VERSION;
  coins: number;
  reputation: number;
  tickets: number;
  completedJobs: string[];
  records: Record<string, JobRecord>;
  upgrades: string[];
  cosmetics: string[];
  /** Last chosen paint settings, used as the default in the paint studio. */
  favoriteDesign: Partial<Customization>;
  settings: Settings;
  daily: { date: string; bestScore: number; plays: number };
  onboardingDone: boolean;
  stats: { jobsCompleted: number; perfectRepairs: number; coinsEarned: number };
  createdAt: number;
}

export const DEFAULT_SETTINGS: Settings = { sound: true, music: true, vibration: true, reducedMotion: false, highContrast: false };

export function defaultSave(now = Date.now()): SaveData {
  return {
    version: SAVE_VERSION,
    coins: 60,
    reputation: 0,
    tickets: 0,
    completedJobs: [],
    records: {},
    upgrades: [],
    cosmetics: startingCosmetics(),
    favoriteDesign: {},
    settings: { ...DEFAULT_SETTINGS },
    daily: { date: '', bestScore: 0, plays: 0 },
    onboardingDone: false,
    stats: { jobsCompleted: 0, perfectRepairs: 0, coinsEarned: 0 },
    createdAt: now,
  };
}

/** Version 1 (first test builds) stored a flatter structure. Kept for migration. */
export interface SaveDataV1 {
  version: 1;
  coins: number;
  rep: number;
  done: string[];
  stations: string[];
  sound?: boolean;
  vibration?: boolean;
}

/**
 * Brings any older save up to the current version. Unknown or corrupt data falls back to a fresh save
 * instead of crashing; fields missing from older versions get their defaults.
 */
export function migrate(raw: unknown): SaveData {
  if (!raw || typeof raw !== 'object') return defaultSave();
  const data = raw as { version?: number };
  if (data.version === 1) {
    const v1 = raw as SaveDataV1;
    const base = defaultSave();
    return {
      ...base,
      coins: Number(v1.coins) || 0,
      reputation: Number(v1.rep) || 0,
      completedJobs: Array.isArray(v1.done) ? v1.done.filter((x) => typeof x === 'string') : [],
      upgrades: Array.isArray(v1.stations) ? v1.stations.filter((x) => typeof x === 'string') : [],
      settings: { ...base.settings, sound: v1.sound ?? true, vibration: v1.vibration ?? true },
      onboardingDone: true,
    };
  }
  if (data.version === SAVE_VERSION) {
    const base = defaultSave();
    const v2 = raw as Partial<SaveData>;
    return {
      ...base,
      ...v2,
      version: SAVE_VERSION,
      settings: { ...base.settings, ...(v2.settings ?? {}) },
      daily: { ...base.daily, ...(v2.daily ?? {}) },
      stats: { ...base.stats, ...(v2.stats ?? {}) },
      records: v2.records ?? {},
      cosmetics: Array.from(new Set([...(v2.cosmetics ?? []), ...base.cosmetics])),
    };
  }
  // A save from a newer app version: keep what we understand rather than wiping progress.
  if (typeof data.version === 'number' && data.version > SAVE_VERSION) {
    return migrate({ ...(raw as object), version: SAVE_VERSION });
  }
  return defaultSave();
}

export async function loadSave(storage: Pick<typeof AsyncStorage, 'getItem'> = AsyncStorage): Promise<SaveData> {
  try {
    const json = await storage.getItem(SAVE_KEY);
    return json ? migrate(JSON.parse(json)) : defaultSave();
  } catch {
    return defaultSave();
  }
}

export async function writeSave(data: SaveData, storage: Pick<typeof AsyncStorage, 'setItem'> = AsyncStorage): Promise<void> {
  try {
    await storage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {
    // Storage full or unavailable: the game keeps running with the in-memory state.
  }
}

export async function clearSave(storage: Pick<typeof AsyncStorage, 'removeItem'> = AsyncStorage): Promise<void> {
  try {
    await storage.removeItem(SAVE_KEY);
  } catch {
    // Ignore.
  }
}

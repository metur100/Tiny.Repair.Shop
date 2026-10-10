import AsyncStorage from '@react-native-async-storage/async-storage';

import { UPGRADES } from '@/data/upgrades';
import { clearSave, defaultSave, loadSave, migrate, SAVE_KEY, SAVE_VERSION, writeSave, type SaveDataV1 } from '@/store/saveManager';
import { useGameStore } from '@/store/useGameStore';
import { dailyJob } from '@/utils/daily';
import { job, perfectRun, resetStore } from '../helpers';

/** In-memory storage passed to the save functions. */
function memoryStorage(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: jest.fn(async (k: string) => data[k] ?? null),
    setItem: jest.fn(async (k: string, v: string) => {
      data[k] = v;
    }),
    removeItem: jest.fn(async (k: string) => {
      delete data[k];
    }),
  };
}

describe('save system', () => {
  it('round-trips a save', async () => {
    const storage = memoryStorage();
    const save = { ...defaultSave(1), coins: 321, completedJobs: ['s1-1'] };
    await writeSave(save, storage);
    expect(await loadSave(storage)).toEqual(save);
    await clearSave(storage);
    expect(storage.data[SAVE_KEY]).toBeUndefined();
  });

  it('falls back to a fresh save on missing or corrupt data', async () => {
    expect((await loadSave(memoryStorage())).coins).toBe(defaultSave().coins);
    expect((await loadSave(memoryStorage({ [SAVE_KEY]: '{not json' }))).version).toBe(SAVE_VERSION);
    expect(migrate(null).coins).toBe(defaultSave().coins);
    expect(migrate('garbage').version).toBe(SAVE_VERSION);
  });

  it('migrates version 1 saves', () => {
    const v1: SaveDataV1 = { version: 1, coins: 140, rep: 22, done: ['s1-1', 's1-2'], stations: ['cleaningStation'], sound: false };
    const out = migrate(v1);
    expect(out.version).toBe(SAVE_VERSION);
    expect(out.coins).toBe(140);
    expect(out.reputation).toBe(22);
    expect(out.completedJobs).toEqual(['s1-1', 's1-2']);
    expect(out.upgrades).toEqual(['cleaningStation']);
    expect(out.settings.sound).toBe(false);
    expect(out.settings.music).toBe(true);
    expect(out.onboardingDone).toBe(true);
  });

  it('fills fields missing from partial current saves and keeps newer saves', () => {
    const partial = { version: SAVE_VERSION, coins: 5, settings: { music: false } };
    const out = migrate(partial);
    expect(out.coins).toBe(5);
    expect(out.settings).toEqual({ ...defaultSave().settings, music: false });
    expect(out.daily).toEqual(defaultSave().daily);
    expect(migrate({ ...defaultSave(), version: 99, coins: 77 }).coins).toBe(77);
  });
});

describe('game store', () => {
  beforeEach(() => {
    resetStore();
    (AsyncStorage.setItem as jest.Mock).mockClear();
  });

  it('completing a job pays out, records it, unlocks the collection card and saves', () => {
    const j = job();
    const before = useGameStore.getState().coins;
    const outcome = useGameStore.getState().completeJob(j, perfectRun(j));
    const s = useGameStore.getState();
    expect(outcome.quality.stars).toBe(3);
    expect(s.coins).toBe(before + outcome.reward.coins);
    expect(s.reputation).toBe(outcome.reward.reputation);
    expect(s.completedJobs).toContain(j.id);
    expect(s.records[j.id].timesCompleted).toBe(1);
    expect(s.stats.jobsCompleted).toBe(1);
    expect(s.pendingCoins).toBe(outcome.reward.coins);
    expect(s.lastOutcome).toEqual(outcome);
    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });

  it('replaying keeps the best record and does not duplicate completion', () => {
    const j = job();
    useGameStore.getState().completeJob(j, perfectRun(j));
    const worse = useGameStore.getState().completeJob(j, perfectRun(j, { cleaned: 0.6, testPassed: false }));
    const s = useGameStore.getState();
    expect(worse.newBest).toBe(false);
    expect(s.completedJobs.filter((id) => id === j.id)).toHaveLength(1);
    expect(s.records[j.id].timesCompleted).toBe(2);
    expect(s.records[j.id].stars).toBe(3);
  });

  it('reports a stage unlock when reputation crosses a threshold', () => {
    resetStore({ reputation: 16 });
    const j = job();
    const outcome = useGameStore.getState().completeJob(j, perfectRun(j));
    expect(outcome.stageUnlocked).toBe(2);
  });

  it('daily jobs give a ticket once per day and are not added to the campaign', () => {
    const daily = dailyJob(['radio', 'bicycle']);
    const first = useGameStore.getState().completeJob(daily, perfectRun(daily));
    const ticketsAfterFirst = useGameStore.getState().tickets;
    expect(ticketsAfterFirst).toBe(first.reward.tickets + 1);
    const second = useGameStore.getState().completeJob(daily, perfectRun(daily));
    expect(useGameStore.getState().tickets).toBe(ticketsAfterFirst + second.reward.tickets);
    expect(useGameStore.getState().completedJobs).not.toContain(daily.id);
    expect(useGameStore.getState().daily.plays).toBe(2);
  });

  it('buys upgrades only when affordable and spends coins', () => {
    const u = UPGRADES[0];
    resetStore({ coins: u.cost - 1 });
    expect(useGameStore.getState().buyUpgrade(u.id)).toBe(false);
    resetStore({ coins: u.cost + 5 });
    expect(useGameStore.getState().buyUpgrade(u.id)).toBe(true);
    expect(useGameStore.getState().coins).toBe(5);
    expect(useGameStore.getState().upgrades).toContain(u.id);
    expect(useGameStore.getState().buyUpgrade(u.id)).toBe(false);
    expect(AsyncStorage.setItem).toHaveBeenCalled();
  });

  it('buys cosmetics with coins or tickets', () => {
    resetStore({ coins: 100, tickets: 2 });
    expect(useGameStore.getState().buyCosmetic('sticker:bolt')).toBe(true);
    expect(useGameStore.getState().coins).toBe(50);
    expect(useGameStore.getState().buyCosmetic('pattern:stars')).toBe(true);
    expect(useGameStore.getState().tickets).toBe(0);
    expect(useGameStore.getState().buyCosmetic('sticker:smile')).toBe(false);
  });

  it('reset clears progress but keeps settings', async () => {
    resetStore({ coins: 999, completedJobs: ['s1-1'] });
    useGameStore.getState().updateSettings({ highContrast: true });
    await useGameStore.getState().resetProgress();
    const s = useGameStore.getState();
    expect(s.coins).toBe(defaultSave().coins);
    expect(s.completedJobs).toEqual([]);
    expect(s.settings.highContrast).toBe(true);
  });
});

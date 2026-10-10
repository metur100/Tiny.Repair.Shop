import { create } from 'zustand';

import { COSMETICS } from '@/data/cosmetics';
import { customerById } from '@/data/customers';
import { jobById } from '@/data/jobs';
import type { Customization, Job } from '@/data/types';
import { UPGRADES } from '@/data/upgrades';
import { paintColors } from '@/theme/colors';
import { isDailyId } from '@/utils/daily';
import { dayKey } from '@/utils/dateSeed';
import { computeReward, customerSatisfaction, happinessBonus, moodFor, type Mood, type Reward } from '@/utils/economy';
import { computeQuality, requestMet, type QualityBreakdown, type RunRecord } from '@/utils/scoring';
import { canBuyUpgrade, stageForReputation } from '@/utils/unlocks';
import { clearSave, defaultSave, writeSave, type SaveData, type Settings } from './saveManager';

export function colorIdOf(hex: string): string | undefined {
  return paintColors.find((c) => c.color.toLowerCase() === hex.toLowerCase())?.id;
}

/** Everything shown on the results screen after a job. */
export interface JobOutcome {
  jobId: string;
  quality: QualityBreakdown;
  satisfaction: number;
  mood: Mood;
  reward: Reward;
  requestMet: boolean;
  newBest: boolean;
  /** Stage unlocked by this job's reputation (null if none). */
  stageUnlocked: number | null;
  seconds: number;
  before: Customization;
  after: Customization;
}

interface GameState extends SaveData {
  hydrated: boolean;
  /** The job being played (campaign or daily). */
  currentJob: Job | null;
  lastOutcome: JobOutcome | null;
  /** UI: amount of coins currently flying into the balance (animation). */
  pendingCoins: number;

  hydrate(data: SaveData): void;
  startJob(job: Job): void;
  /** Scores a finished run, pays out and saves. */
  completeJob(job: Job, run: RunRecord): JobOutcome;
  buyUpgrade(id: string): boolean;
  buyCosmetic(id: string): boolean;
  setFavoriteDesign(d: Partial<Customization>): void;
  updateSettings(patch: Partial<Settings>): void;
  finishOnboarding(): void;
  consumePendingCoins(): void;
  resetProgress(): Promise<void>;
}

function snapshot(s: GameState): SaveData {
  return {
    version: s.version,
    coins: s.coins,
    reputation: s.reputation,
    tickets: s.tickets,
    completedJobs: s.completedJobs,
    records: s.records,
    upgrades: s.upgrades,
    cosmetics: s.cosmetics,
    favoriteDesign: s.favoriteDesign,
    settings: s.settings,
    daily: s.daily,
    onboardingDone: s.onboardingDone,
    stats: s.stats,
    createdAt: s.createdAt,
  };
}

export const useGameStore = create<GameState>((set, get) => {
  const persist = () => void writeSave(snapshot(get()));
  return {
    ...defaultSave(),
    hydrated: false,
    currentJob: null,
    lastOutcome: null,
    pendingCoins: 0,

    hydrate: (data) => set({ ...data, hydrated: true }),

    startJob: (job) => set({ currentJob: job }),

    completeJob: (job, run) => {
      const s = get();
      const quality = computeQuality(run, job, colorIdOf);
      const customer = customerById(job.customerId);
      const met = requestMet(job, run.customization, colorIdOf);
      const satisfaction = customerSatisfaction(customer.personality, quality, {
        seconds: run.totalSeconds,
        expectedSeconds: job.minutes * 60,
        requestMet: met,
        hasRequest: !!job.special,
        bonus: happinessBonus(s.upgrades),
        rare: job.rare,
      });
      const reward = computeReward(job, quality, satisfaction, s.upgrades);
      const prev = s.records[job.id];
      const newBest = !prev || quality.total > prev.bestQuality;
      const reputation = s.reputation + reward.reputation;
      const stageBefore = stageForReputation(s.reputation);
      const stageAfter = stageForReputation(reputation);
      const daily = isDailyId(job.id);
      const record = {
        bestQuality: Math.max(prev?.bestQuality ?? 0, quality.total),
        stars: Math.max(prev?.stars ?? 1, quality.stars) as 1 | 2 | 3,
        bestSatisfaction: Math.max(prev?.bestSatisfaction ?? 0, satisfaction),
        timesCompleted: (prev?.timesCompleted ?? 0) + 1,
        design: newBest || !prev ? run.customization : prev.design,
        lastCompletedAt: Date.now(),
      };
      const today = dayKey();
      set({
        coins: s.coins + reward.coins,
        reputation,
        tickets: s.tickets + reward.tickets + (daily && s.daily.date !== today ? 1 : 0),
        completedJobs: daily || s.completedJobs.includes(job.id) ? s.completedJobs : [...s.completedJobs, job.id],
        records: { ...s.records, [job.id]: record },
        daily: daily
          ? { date: today, bestScore: Math.max(s.daily.date === today ? s.daily.bestScore : 0, quality.total), plays: (s.daily.date === today ? s.daily.plays : 0) + 1 }
          : s.daily,
        stats: {
          jobsCompleted: s.stats.jobsCompleted + 1,
          perfectRepairs: s.stats.perfectRepairs + (quality.perfect ? 1 : 0),
          coinsEarned: s.stats.coinsEarned + reward.coins,
        },
        pendingCoins: reward.coins,
        currentJob: null,
      });
      const outcome: JobOutcome = {
        jobId: job.id,
        quality,
        satisfaction,
        mood: moodFor(satisfaction),
        reward,
        requestMet: met,
        newBest,
        stageUnlocked: stageAfter > stageBefore ? stageAfter : null,
        seconds: run.totalSeconds,
        before: job.original,
        after: run.customization,
      };
      set({ lastOutcome: outcome });
      persist();
      return outcome;
    },

    buyUpgrade: (id) => {
      const s = get();
      const check = canBuyUpgrade(id, s.coins, s.reputation, s.upgrades);
      const u = UPGRADES.find((x) => x.id === id);
      if (!check.ok || !u) return false;
      set({ coins: s.coins - u.cost, upgrades: [...s.upgrades, id] });
      persist();
      return true;
    },

    buyCosmetic: (id) => {
      const s = get();
      const item = COSMETICS.find((c) => c.id === id);
      if (!item || s.cosmetics.includes(id)) return false;
      if (item.tickets) {
        if (s.tickets < item.tickets) return false;
        set({ tickets: s.tickets - item.tickets, cosmetics: [...s.cosmetics, id] });
      } else {
        if (s.coins < item.cost) return false;
        set({ coins: s.coins - item.cost, cosmetics: [...s.cosmetics, id] });
      }
      persist();
      return true;
    },

    setFavoriteDesign: (d) => {
      set({ favoriteDesign: { ...get().favoriteDesign, ...d } });
    },

    updateSettings: (patch) => {
      set({ settings: { ...get().settings, ...patch } });
      persist();
    },

    finishOnboarding: () => {
      set({ onboardingDone: true });
      persist();
    },

    consumePendingCoins: () => set({ pendingCoins: 0 }),

    resetProgress: async () => {
      await clearSave();
      const fresh = defaultSave();
      set({ ...fresh, onboardingDone: true, settings: get().settings, hydrated: true, currentJob: null, lastOutcome: null, pendingCoins: 0 });
      persist();
    },
  };
});

/** Settings selector hook (used by theme, audio and haptics). */
export function useSettings<T>(selector: (s: Settings) => T): T {
  return useGameStore((s) => selector(s.settings));
}

export function jobFromId(id: string, daily: Job | null): Job | undefined {
  if (daily && daily.id === id) return daily;
  return jobById(id);
}

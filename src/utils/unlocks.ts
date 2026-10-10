import { JOBS, STAGE_REPUTATION } from '@/data/jobs';
import { CATEGORIES, CATEGORY_ORDER } from '@/data/objects';
import { STARTING_STATIONS, UPGRADES } from '@/data/upgrades';
import type { Category, Job } from '@/data/types';

/** Highest workshop stage open at this reputation (1..6). */
export function stageForReputation(rep: number): number {
  let stage = 1;
  STAGE_REPUTATION.forEach((need, i) => {
    if (rep >= need) stage = i + 1;
  });
  return stage;
}

function hasStation(station: string | null, owned: readonly string[]): boolean {
  return station === null || STARTING_STATIONS.includes(station) || owned.includes(station);
}

/** Object categories the player can take jobs for (each needs its workshop station). */
export function unlockedCategories(owned: readonly string[]): Category[] {
  return CATEGORY_ORDER.filter((c) => hasStation(CATEGORIES[c].station, owned));
}

export type JobLock = null | { reason: 'stage'; needed: number } | { reason: 'station'; station: string };

/** Why a job is not available yet (null = available). */
export function jobLock(job: Job, rep: number, owned: readonly string[]): JobLock {
  if (job.stage > stageForReputation(rep)) return { reason: 'stage', needed: STAGE_REPUTATION[job.stage - 1] };
  const station = CATEGORIES[job.category].station;
  if (!hasStation(station, owned)) return { reason: 'station', station: station as string };
  return null;
}

/** Jobs on the board: open, not yet completed jobs, in campaign order. */
export function availableJobs(completed: readonly string[], rep: number, owned: readonly string[]): Job[] {
  return JOBS.filter((j) => !completed.includes(j.id) && jobLock(j, rep, owned) === null);
}

/** Upcoming jobs that are locked, with the reason (shown greyed out on the board). */
export function lockedJobs(completed: readonly string[], rep: number, owned: readonly string[]): { job: Job; lock: Exclude<JobLock, null> }[] {
  const out: { job: Job; lock: Exclude<JobLock, null> }[] = [];
  for (const job of JOBS) {
    if (completed.includes(job.id)) continue;
    const lock = jobLock(job, rep, owned);
    if (lock) out.push({ job, lock });
  }
  return out;
}

export function canBuyUpgrade(id: string, coins: number, rep: number, owned: readonly string[]): { ok: boolean; reason?: 'owned' | 'coins' | 'reputation' | 'unknown' } {
  const u = UPGRADES.find((x) => x.id === id);
  if (!u) return { ok: false, reason: 'unknown' };
  if (owned.includes(id)) return { ok: false, reason: 'owned' };
  if (rep < u.reputation) return { ok: false, reason: 'reputation' };
  if (coins < u.cost) return { ok: false, reason: 'coins' };
  return { ok: true };
}

/** Workshop level: 1 + number of upgrades bought. */
export function shopLevel(owned: readonly string[]): number {
  return 1 + owned.filter((id) => UPGRADES.some((u) => u.id === id)).length;
}

/** A collection card unlocks once its job has been completed. */
export function collectionUnlocked(jobId: string, completed: readonly string[]): boolean {
  return completed.includes(jobId);
}

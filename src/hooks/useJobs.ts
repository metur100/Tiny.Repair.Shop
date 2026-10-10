import { useMemo } from 'react';

import { jobById } from '@/data/jobs';
import type { Job } from '@/data/types';
import { useGameStore } from '@/store/useGameStore';
import { dailyJob } from '@/utils/daily';
import { dayKey } from '@/utils/dateSeed';
import { availableJobs, lockedJobs, unlockedCategories } from '@/utils/unlocks';

/** Today's daily job (memoised per day and unlocked categories). */
export function useDailyJob(): Job {
  const upgrades = useGameStore((s) => s.upgrades);
  const day = dayKey();
  // Midday of the current day key, so the memo refreshes when the date changes.
  return useMemo(() => dailyJob(unlockedCategories(upgrades), new Date(`${day}T12:00:00`)), [upgrades, day]);
}

/** Open and locked campaign jobs for the board. */
export function useBoard() {
  const completed = useGameStore((s) => s.completedJobs);
  const rep = useGameStore((s) => s.reputation);
  const upgrades = useGameStore((s) => s.upgrades);
  return useMemo(
    () => ({ open: availableJobs(completed, rep, upgrades), locked: lockedJobs(completed, rep, upgrades).slice(0, 4) }),
    [completed, rep, upgrades],
  );
}

/** Resolves a job id from the route (campaign or today's daily). */
export function useJob(id: string | undefined): Job | undefined {
  const daily = useDailyJob();
  return useMemo(() => {
    if (!id) return undefined;
    if (id === daily.id) return daily;
    return jobById(id);
  }, [id, daily]);
}

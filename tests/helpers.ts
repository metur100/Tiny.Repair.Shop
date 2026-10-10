import type { Job } from '@/data/types';
import { jobById } from '@/data/jobs';
import { defaultSave } from '@/store/saveManager';
import { useGameStore } from '@/store/useGameStore';
import type { RunRecord } from '@/utils/scoring';

/** Resets the zustand store to a fresh, hydrated save (sound and vibration off for quiet tests). */
export function resetStore(patch: Partial<ReturnType<typeof defaultSave>> = {}): void {
  const base = defaultSave(0);
  useGameStore.setState({
    ...base,
    onboardingDone: true,
    // Quiet and calm: no sounds, and reduced motion skips count-up animations.
    settings: { ...base.settings, sound: false, music: false, vibration: false, reducedMotion: true },
    ...patch,
    hydrated: true,
    currentJob: null,
    lastOutcome: null,
    pendingCoins: 0,
  });
}

export function job(id = 's1-1'): Job {
  const j = jobById(id);
  if (!j) throw new Error(`missing job ${id}`);
  return j;
}

/** A run where everything went perfectly. */
export function perfectRun(j: Job, patch: Partial<RunRecord> = {}): RunRecord {
  const relevant = j.clues.filter((c) => c.relevant).length;
  return {
    cluesFound: relevant,
    cluesTotal: relevant,
    wrongTaps: 0,
    diagnosisCorrect: true,
    cleaned: 1,
    cleanSeconds: 10,
    tasks: j.tasks.map(() => ({ accuracy: 1, seconds: 8, mistakes: 0 })),
    testPassed: true,
    testAccuracy: 1,
    customization: j.original,
    totalSeconds: 60,
    ...patch,
  };
}

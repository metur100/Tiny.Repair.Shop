import type { Customization, Job } from '@/data/types';

/** Result of one repair mini-game task. */
export interface TaskResult {
  /** 0..1 how precisely the task was done. */
  accuracy: number;
  /** Seconds taken. */
  seconds: number;
  /** Wrong moves (wrong wire, overshoot…). */
  mistakes: number;
}

/** Everything the player did in one job, used to compute the quality. */
export interface RunRecord {
  /** Relevant clues found and relevant clues in total. */
  cluesFound: number;
  cluesTotal: number;
  /** Taps on harmless spots. */
  wrongTaps: number;
  diagnosisCorrect: boolean;
  /** 0..1 dirt removed. */
  cleaned: number;
  cleanSeconds: number;
  tasks: TaskResult[];
  /** The test stage was passed. */
  testPassed: boolean;
  testAccuracy: number;
  customization: Customization;
  totalSeconds: number;
}

/** Expected seconds per task (forgiving) used for the speed part of task scores. */
export const PAR_SECONDS = 20;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** 0..100 score of a single mini-game task: mostly accuracy, a little speed, a small mistake penalty. */
export function taskScore(r: TaskResult, parSeconds = PAR_SECONDS): number {
  const speed = clamp01(1 - Math.max(0, r.seconds - parSeconds) / (parSeconds * 3));
  const penalty = Math.min(0.3, r.mistakes * 0.06);
  return Math.round(100 * clamp01(r.accuracy * 0.8 + speed * 0.2 - penalty));
}

export function inspectionScore(r: Pick<RunRecord, 'cluesFound' | 'cluesTotal' | 'wrongTaps' | 'diagnosisCorrect'>): number {
  const found = r.cluesTotal > 0 ? r.cluesFound / r.cluesTotal : 1;
  // Exploring is fine: only many wrong taps cost a little.
  const explore = Math.max(0, r.wrongTaps - 2) * 0.05;
  return Math.round(100 * clamp01(found * 0.6 + (r.diagnosisCorrect ? 0.4 : 0.15) - explore));
}

/** Cleaning: 50% clean scores 0, 95% or more scores 100. */
export function cleaningScore(cleaned: number): number {
  return Math.round(100 * clamp01((cleaned - 0.5) / 0.45));
}

/** Whether the customisation meets the job's special request. */
export function requestMet(job: Pick<Job, 'special'>, c: Customization, colorIdOf: (hex: string) => string | undefined): boolean {
  const s = job.special;
  if (!s) return true;
  switch (s.kind) {
    case 'color':
      return colorIdOf(c.baseColor) === s.value;
    case 'pattern':
      return c.pattern === s.value;
    case 'finish':
      return c.finish === s.value;
    case 'sticker':
      return (c.stickers as string[]).includes(s.value);
    case 'accessory':
      return c.accessory;
  }
}

export interface QualityBreakdown {
  inspection: number;
  cleaning: number;
  repair: number;
  test: number;
  request: number;
  /** Weighted total, 0..100. */
  total: number;
  stars: 1 | 2 | 3;
  perfect: boolean;
}

/** Weights of the stages in the final quality. */
export const WEIGHTS = { inspection: 0.15, cleaning: 0.2, repair: 0.45, test: 0.1, request: 0.1 };

export function computeQuality(r: RunRecord, job: Pick<Job, 'special'>, colorIdOf: (hex: string) => string | undefined): QualityBreakdown {
  const inspection = inspectionScore(r);
  const cleaning = cleaningScore(r.cleaned);
  const repair = r.tasks.length ? Math.round(r.tasks.reduce((a, t) => a + taskScore(t), 0) / r.tasks.length) : 100;
  const test = r.testPassed ? Math.round(60 + 40 * clamp01(r.testAccuracy)) : 30;
  const request = job.special ? (requestMet(job, r.customization, colorIdOf) ? 100 : 40) : 100;
  const total = Math.round(
    inspection * WEIGHTS.inspection + cleaning * WEIGHTS.cleaning + repair * WEIGHTS.repair + test * WEIGHTS.test + request * WEIGHTS.request,
  );
  const stars: 1 | 2 | 3 = total >= 85 ? 3 : total >= 65 ? 2 : 1;
  return { inspection, cleaning, repair, test, request, total, stars, perfect: total >= 95 };
}

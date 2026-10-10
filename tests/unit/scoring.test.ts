import { JOBS } from '@/data/jobs';
import { colorIdOf } from '@/store/useGameStore';
import { paintColors } from '@/theme/colors';
import { cleaningScore, computeQuality, inspectionScore, requestMet, taskScore } from '@/utils/scoring';
import { job, perfectRun } from '../helpers';

describe('scoring', () => {
  it('scores a perfect run as a 3-star perfect repair', () => {
    const j = job();
    const q = computeQuality(perfectRun(j), j, colorIdOf);
    expect(q.total).toBeGreaterThanOrEqual(95);
    expect(q.stars).toBe(3);
    expect(q.perfect).toBe(true);
  });

  it('lowers quality for sloppy repairs and a failed test', () => {
    const j = job();
    const good = computeQuality(perfectRun(j), j, colorIdOf);
    const sloppy = computeQuality(
      perfectRun(j, { tasks: j.tasks.map(() => ({ accuracy: 0.4, seconds: 70, mistakes: 4 })), testPassed: false, testAccuracy: 0.2, cleaned: 0.8 }),
      j,
      colorIdOf,
    );
    expect(sloppy.total).toBeLessThan(good.total);
    expect(sloppy.stars).toBeLessThan(3);
    expect(sloppy.perfect).toBe(false);
  });

  it('task score rewards accuracy and penalises mistakes', () => {
    expect(taskScore({ accuracy: 1, seconds: 5, mistakes: 0 })).toBe(100);
    expect(taskScore({ accuracy: 1, seconds: 5, mistakes: 3 })).toBeLessThan(100);
    expect(taskScore({ accuracy: 0.5, seconds: 5, mistakes: 0 })).toBeLessThan(taskScore({ accuracy: 0.9, seconds: 5, mistakes: 0 }));
    // Speed matters only a little: a slow but precise repair still scores well.
    expect(taskScore({ accuracy: 1, seconds: 60, mistakes: 0 })).toBeGreaterThanOrEqual(80);
  });

  it('inspection score lets the player explore a little for free', () => {
    const base = { cluesFound: 2, cluesTotal: 2, diagnosisCorrect: true };
    expect(inspectionScore({ ...base, wrongTaps: 2 })).toBe(100);
    expect(inspectionScore({ ...base, wrongTaps: 6 })).toBeLessThan(100);
    expect(inspectionScore({ ...base, wrongTaps: 0, diagnosisCorrect: false })).toBeLessThan(100);
  });

  it('cleaning score maps 50% → 0 and 95%+ → 100', () => {
    expect(cleaningScore(0.5)).toBe(0);
    expect(cleaningScore(0.95)).toBe(100);
    expect(cleaningScore(1)).toBe(100);
    expect(cleaningScore(0.725)).toBe(50);
  });

  it('checks special requests', () => {
    const special = JOBS.find((j) => j.special?.kind === 'color');
    expect(special).toBeDefined();
    if (!special?.special) return;
    const wanted = paintColors.find((p) => p.id === special.special?.value);
    expect(wanted).toBeDefined();
    expect(requestMet(special, { ...special.original, baseColor: wanted!.color }, colorIdOf)).toBe(true);
    const other = paintColors.find((p) => p.id !== special.special?.value)!;
    expect(requestMet(special, { ...special.original, baseColor: other.color }, colorIdOf)).toBe(false);
    // A job without a request is always "met".
    expect(requestMet({ special: undefined }, special.original, colorIdOf)).toBe(true);
  });
});

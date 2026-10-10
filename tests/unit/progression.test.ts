import { JOBS, STAGE_REPUTATION } from '@/data/jobs';
import { UPGRADES } from '@/data/upgrades';
import { dailyJob, isDailyId } from '@/utils/daily';
import { dayKey } from '@/utils/dateSeed';
import { computeReward, customerSatisfaction, moodFor, payoutMultiplier, repairTolerance } from '@/utils/economy';
import type { QualityBreakdown } from '@/utils/scoring';
import { availableJobs, canBuyUpgrade, collectionUnlocked, jobLock, lockedJobs, shopLevel, stageForReputation, unlockedCategories } from '@/utils/unlocks';

const quality = (total: number, extra: Partial<QualityBreakdown> = {}): QualityBreakdown => ({
  inspection: total,
  cleaning: total,
  repair: total,
  test: total,
  request: 100,
  total,
  stars: total >= 85 ? 3 : total >= 65 ? 2 : 1,
  perfect: total >= 95,
  ...extra,
});

describe('content', () => {
  it('has at least 30 jobs over 6 stages and all 6 categories', () => {
    expect(JOBS.length).toBeGreaterThanOrEqual(30);
    expect(new Set(JOBS.map((j) => j.stage))).toEqual(new Set([1, 2, 3, 4, 5, 6]));
    expect(new Set(JOBS.map((j) => j.category)).size).toBe(6);
    expect(new Set(JOBS.map((j) => j.id)).size).toBe(JOBS.length);
  });

  it('has at least 10 workshop upgrades', () => {
    expect(UPGRADES.length).toBeGreaterThanOrEqual(10);
  });
});

describe('unlocks', () => {
  it('maps reputation to stages', () => {
    expect(stageForReputation(0)).toBe(1);
    expect(stageForReputation(STAGE_REPUTATION[1])).toBe(2);
    expect(stageForReputation(STAGE_REPUTATION[1] - 1)).toBe(1);
    expect(stageForReputation(10_000)).toBe(6);
  });

  it('starts with radios and bicycles; stations unlock new categories', () => {
    expect(unlockedCategories([])).toEqual(['radio', 'bicycle']);
    expect(unlockedCategories(['robotStation'])).toContain('robot');
  });

  it('locks jobs by stage and by station, and hides completed jobs', () => {
    const open = availableJobs([], 0, []);
    expect(open.length).toBeGreaterThan(0);
    expect(open.every((j) => j.stage === 1)).toBe(true);
    const robot = JOBS.find((j) => j.category === 'robot')!;
    expect(jobLock(robot, 10_000, [])).toEqual({ reason: 'station', station: 'robotStation' });
    expect(jobLock(robot, 10_000, ['robotStation'])).toBeNull();
    const first = open[0];
    expect(availableJobs([first.id], 0, []).some((j) => j.id === first.id)).toBe(false);
    expect(lockedJobs([], 0, []).length).toBe(JOBS.length - open.length);
  });

  it('collection cards unlock when the job is completed', () => {
    expect(collectionUnlocked('s1-1', [])).toBe(false);
    expect(collectionUnlocked('s1-1', ['s1-1'])).toBe(true);
  });
});

describe('upgrades and currency', () => {
  it('checks coins, reputation and ownership before buying', () => {
    const u = UPGRADES.find((x) => x.reputation > 0)!;
    expect(canBuyUpgrade(u.id, u.cost - 1, u.reputation, [])).toEqual({ ok: false, reason: 'coins' });
    expect(canBuyUpgrade(u.id, u.cost, u.reputation - 1, [])).toEqual({ ok: false, reason: 'reputation' });
    expect(canBuyUpgrade(u.id, u.cost, u.reputation, [u.id])).toEqual({ ok: false, reason: 'owned' });
    expect(canBuyUpgrade(u.id, u.cost, u.reputation, [])).toEqual({ ok: true });
    expect(canBuyUpgrade('nope', 9999, 9999, [])).toEqual({ ok: false, reason: 'unknown' });
  });

  it('upgrade costs rise with the progression', () => {
    const cheapest = Math.min(...UPGRADES.map((u) => u.cost));
    const priciest = Math.max(...UPGRADES.map((u) => u.cost));
    expect(cheapest).toBeLessThanOrEqual(150);
    expect(priciest).toBeGreaterThan(cheapest * 5);
    expect(UPGRADES.every((u) => u.cost > 0)).toBe(true);
  });

  it('upgrades change payouts, tolerance and the shop level', () => {
    expect(payoutMultiplier([])).toBe(1);
    expect(payoutMultiplier(['storefront'])).toBeCloseTo(1.15);
    expect(repairTolerance(['toolBench', 'electronicsTable'])).toBeCloseTo(0.4);
    expect(shopLevel(['cleaningStation', 'toolBench'])).toBe(3);
  });

  it('rewards are higher for better quality and include a perfect bonus', () => {
    const j = JOBS[0];
    const ok = computeReward(j, quality(70), 70, []);
    const perfect = computeReward(j, quality(98), 95, []);
    expect(perfect.coins).toBeGreaterThan(ok.coins);
    expect(perfect.perfectBonus).toBeGreaterThan(0);
    expect(ok.perfectBonus).toBe(0);
    expect(perfect.tickets).toBeGreaterThanOrEqual(1);
    expect(ok.coins).toBe(ok.base + ok.qualityBonus + ok.perfectBonus + ok.customerBonus);
  });
});

describe('customer satisfaction', () => {
  const opts = { seconds: 100, expectedSeconds: 180, requestMet: true, hasRequest: false, bonus: 0 };

  it('perfectionists are harsh below 85% and pleased above', () => {
    expect(customerSatisfaction('perfectionist', quality(80), opts)).toBeLessThan(80);
    expect(customerSatisfaction('perfectionist', quality(90), opts)).toBeGreaterThan(90);
  });

  it('busy customers mind slow repairs', () => {
    const fast = customerSatisfaction('busy', quality(80), opts);
    const slow = customerSatisfaction('busy', quality(80), { ...opts, seconds: 400 });
    expect(slow).toBeLessThan(fast);
  });

  it('missed special requests hurt; the waiting area helps; result is clamped', () => {
    const met = customerSatisfaction('student', quality(80), { ...opts, hasRequest: true, requestMet: true });
    const missed = customerSatisfaction('student', quality(80), { ...opts, hasRequest: true, requestMet: false });
    expect(missed).toBeLessThan(met);
    expect(customerSatisfaction('student', quality(80), { ...opts, bonus: 8 })).toBeGreaterThan(customerSatisfaction('student', quality(80), opts));
    expect(customerSatisfaction('grandparent', quality(100), { ...opts, bonus: 50 })).toBe(100);
  });

  it('maps satisfaction to a mood', () => {
    expect(moodFor(95)).toBe('delighted');
    expect(moodFor(70)).toBe('happy');
    expect(moodFor(50)).toBe('neutral');
    expect(moodFor(10)).toBe('disappointed');
  });
});

describe('daily job', () => {
  it('is deterministic for a date and differs between days', () => {
    const a = dailyJob(['radio', 'bicycle'], new Date(2026, 9, 10, 9));
    const b = dailyJob(['radio', 'bicycle'], new Date(2026, 9, 10, 21));
    expect(a).toEqual(b);
    expect(a.id).toBe('daily-2026-10-10');
    expect(isDailyId(a.id)).toBe(true);
    expect(isDailyId('s1-1')).toBe(false);
    const days = new Set(Array.from({ length: 7 }, (_, i) => JSON.stringify(dailyJob(['radio', 'bicycle'], new Date(2026, 9, 10 + i)).damage + dailyJob(['radio', 'bicycle'], new Date(2026, 9, 10 + i)).variant)));
    expect(days.size).toBeGreaterThan(1);
  });

  it('only uses unlocked categories', () => {
    for (let i = 0; i < 20; i++) {
      expect(['radio', 'bicycle']).toContain(dailyJob(['radio', 'bicycle'], new Date(2026, 0, 1 + i)).category);
    }
    expect(dayKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

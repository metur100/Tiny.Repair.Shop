import { UPGRADES } from '@/data/upgrades';
import type { Job, Personality } from '@/data/types';
import type { QualityBreakdown } from './scoring';

/** Payout multiplier from owned upgrades (storefront, display shelves). */
export function payoutMultiplier(owned: readonly string[]): number {
  let m = 1;
  for (const u of UPGRADES) {
    if (!owned.includes(u.id)) continue;
    if (u.effect.kind === 'payout') m *= u.effect.multiplier;
    if (u.effect.kind === 'display') m *= 1.05;
  }
  return m;
}

/** Extra customer happiness from owned upgrades (waiting area). */
export function happinessBonus(owned: readonly string[]): number {
  let bonus = 0;
  for (const u of UPGRADES) if (owned.includes(u.id) && u.effect.kind === 'happiness') bonus += u.effect.bonus;
  return bonus;
}

/** Extra tolerance for dials, timing and alignment from owned upgrades (0..0.4). */
export function repairTolerance(owned: readonly string[]): number {
  let t = 0;
  for (const u of UPGRADES) if (owned.includes(u.id) && u.effect.kind === 'repairHelp') t += u.effect.tolerance;
  return Math.min(0.4, t);
}

/** Cleaning brush size multiplier. */
export function brushScale(owned: readonly string[]): number {
  let s = 1;
  for (const u of UPGRADES) if (owned.includes(u.id) && u.effect.kind === 'cleaningBrush') s *= u.effect.scale;
  return s;
}

export interface SatisfactionInput {
  seconds: number;
  expectedSeconds: number;
  requestMet: boolean;
  hasRequest: boolean;
  bonus: number;
  rare?: boolean;
}

/** Customer satisfaction 0..100 from quality, time and the special request, shaped by personality. */
export function customerSatisfaction(personality: Personality, q: QualityBreakdown, opts: SatisfactionInput): number {
  let s = q.total;
  const late = Math.max(0, opts.seconds - opts.expectedSeconds) / opts.expectedSeconds;
  switch (personality) {
    case 'perfectionist':
      s = q.total < 85 ? q.total - 8 : q.total + 4;
      break;
    case 'busy':
      s -= Math.round(late * 25);
      if (late === 0) s += 6;
      break;
    case 'sentimental':
    case 'grandparent':
      // They value care over speed.
      s += 6;
      break;
    case 'collector':
      s += opts.rare ? (q.total >= 85 ? 8 : -6) : 0;
      break;
    case 'student':
      s += 4;
      break;
    case 'inventor':
      s += Math.round((q.repair - 70) / 6);
      break;
    case 'musician':
      s += Math.round((q.test - 70) / 5);
      break;
  }
  if (opts.hasRequest) s += opts.requestMet ? 8 : -12;
  s += opts.bonus;
  return Math.max(0, Math.min(100, Math.round(s)));
}

export type Mood = 'delighted' | 'happy' | 'neutral' | 'disappointed';

export function moodFor(satisfaction: number): Mood {
  if (satisfaction >= 88) return 'delighted';
  if (satisfaction >= 65) return 'happy';
  if (satisfaction >= 45) return 'neutral';
  return 'disappointed';
}

export interface Reward {
  coins: number;
  reputation: number;
  tickets: number;
  /** Parts of the coin payout, for the results screen. */
  base: number;
  qualityBonus: number;
  perfectBonus: number;
  customerBonus: number;
}

/** Coins and reputation for a finished job. Fair and predictable: no randomness. */
export function computeReward(job: Pick<Job, 'reward' | 'reputation' | 'rare'>, q: QualityBreakdown, satisfaction: number, owned: readonly string[]): Reward {
  const mult = payoutMultiplier(owned);
  const base = Math.round(job.reward * 0.6 * mult);
  const qualityBonus = Math.round(job.reward * 0.5 * (q.total / 100) * mult);
  const perfectBonus = q.perfect ? Math.round(job.reward * 0.25 * mult) : 0;
  const customerBonus = satisfaction >= 88 ? Math.round(job.reward * 0.15) : 0;
  const reputation = Math.max(1, Math.round(job.reputation * (0.5 + 0.5 * (q.total / 100)) + (satisfaction >= 88 ? 1 : 0)));
  const tickets = (q.perfect ? 1 : 0) + (job.rare && q.stars === 3 ? 1 : 0);
  return { coins: base + qualityBonus + perfectBonus + customerBonus, reputation, tickets, base, qualityBonus, perfectBonus, customerBonus };
}

/** Reputation needed for each level shown in the HUD. */
export const REP_LEVELS = [0, 10, 25, 48, 75, 95, 125, 160, 200, 245, 300, 380];

export function reputationLevel(rep: number): { level: number; progress: number; next: number | null } {
  let level = 1;
  for (let i = 1; i < REP_LEVELS.length; i++) if (rep >= REP_LEVELS[i]) level = i + 1;
  const cur = REP_LEVELS[level - 1];
  const next = REP_LEVELS[level] ?? null;
  return { level, progress: next === null ? 1 : (rep - cur) / (next - cur), next };
}

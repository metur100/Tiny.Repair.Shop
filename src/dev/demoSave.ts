import { startingCosmetics } from '@/data/cosmetics';
import type { Customization, StickerId } from '@/data/types';
import { DEFAULT_SETTINGS, SAVE_VERSION, type JobRecord, type SaveData } from '@/store/saveManager';

/**
 * A believable mid-game save (stage 4, eight upgrades, thirteen restored objects) for capturing store
 * screenshots. Only reachable in development builds via `/?demo=1`; never shipped to players.
 */
const DESIGNS: [string, string, Customization['pattern'], Customization['finish'], StickerId[], boolean][] = [
  ['#EE6352', '#F4E3C3', 'stripes', 'gloss', ['heart'], false],
  ['#7FD3B4', '#1F2A44', 'none', 'matte', [], true],
  ['#7CC6F2', '#F2C14E', 'dots', 'gloss', ['star'], false],
  ['#F2C14E', '#8A5A3B', 'none', 'metallic', [], false],
  ['#B9A3E3', '#F4E3C3', 'waves', 'pastel', ['note'], false],
  ['#F28C38', '#1F2A44', 'checker', 'gloss', [], true],
  ['#F2A7B8', '#EE6352', 'dots', 'pastel', ['flower'], false],
  ['#3F7D5A', '#F2C14E', 'stripes', 'matte', [], true],
  ['#1F2A44', '#F28C38', 'none', 'metallic', ['bolt'], false],
  ['#7FD3B4', '#EE6352', 'waves', 'gloss', ['smile'], false],
  ['#F4E3C3', '#8A5A3B', 'none', 'gloss', [], false],
  ['#7CC6F2', '#1F2A44', 'checker', 'metallic', ['star'], false],
  ['#EE6352', '#F2C14E', 'dots', 'gloss', ['heart', 'star'], false],
];

const DONE = ['s1-1', 's1-2', 's1-3', 's1-4', 's1-5', 's2-1', 's2-2', 's2-3', 's2-4', 's2-5', 's3-1', 's3-2', 's3-4'];

export function demoSave(now = Date.now()): SaveData {
  const records: Record<string, JobRecord> = {};
  DONE.forEach((id, i) => {
    const [baseColor, accentColor, pattern, finish, stickers, accessory] = DESIGNS[i % DESIGNS.length];
    const stars = (i % 4 === 2 ? 2 : 3) as 2 | 3;
    records[id] = {
      bestQuality: stars === 3 ? 92 + (i % 7) : 78 + (i % 5),
      stars,
      bestSatisfaction: stars === 3 ? 95 : 82,
      timesCompleted: 1,
      design: { baseColor, accentColor, pattern, finish, stickers, accessory },
      lastCompletedAt: now - (DONE.length - i) * 3_600_000,
    };
  });
  return {
    version: SAVE_VERSION,
    coins: 685,
    reputation: 118,
    tickets: 3,
    completedJobs: DONE,
    records,
    upgrades: ['cleaningStation', 'toolBench', 'paintStation', 'robotStation', 'cameraBench', 'musicCorner', 'waitingArea', 'electronicsTable'],
    cosmetics: [...startingCosmetics(), 'pattern:stripes', 'pattern:dots', 'pattern:checker', 'pattern:waves', 'finish:gloss', 'finish:metallic', 'finish:pastel', 'sticker:heart', 'sticker:star', 'sticker:bolt', 'sticker:flower', 'sticker:note', 'color:cream', 'color:wood', 'color:lilac', 'color:rose', 'color:forest'],
    favoriteDesign: { baseColor: '#EE6352', accentColor: '#F4E3C3' },
    settings: { ...DEFAULT_SETTINGS },
    daily: { date: '', bestScore: 0, plays: 4 },
    onboardingDone: true,
    stats: { jobsCompleted: DONE.length, perfectRepairs: 9, coinsEarned: 2140 },
    createdAt: now - 6 * 86_400_000,
  };
}

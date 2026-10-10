import { CUSTOMERS } from '@/data/customers';
import { tasksFor } from '@/data/jobs';
import { CATEGORIES, cluesFor } from '@/data/objects';
import type { Category, DirtKind, Job, SpecialRequest } from '@/data/types';
import { palette } from '@/theme/colors';
import { createRng, dayKey, hashString, pick } from './dateSeed';

const DAILY_REQUESTS: SpecialRequest[] = [
  { kind: 'color', value: 'coral', text: 'Paint it coral' },
  { kind: 'color', value: 'sky', text: 'Paint it sky blue' },
  { kind: 'pattern', value: 'stripes', text: 'Add stripes' },
  { kind: 'pattern', value: 'dots', text: 'Add polka dots' },
  { kind: 'sticker', value: 'heart', text: 'Add a heart sticker' },
  { kind: 'finish', value: 'gloss', text: 'Gloss finish' },
];

const DIRT: DirtKind[] = ['dust', 'grease', 'rust', 'mud'];

/**
 * Today's special job – the same for everyone on the same calendar day and fully offline: the date
 * seeds the object, damage, customer and request. Only categories the player has unlocked are used.
 */
export function dailyJob(categories: readonly Category[], date: Date = new Date()): Job {
  const key = dayKey(date);
  const rng = createRng(hashString(`daily-${key}`));
  const category = pick(rng, categories.length ? categories : (['radio'] as Category[]));
  const info = CATEGORIES[category];
  const damage = pick(rng, info.damages);
  const variant = Math.floor(rng() * 5);
  const customer = pick(rng, CUSTOMERS);
  const special = pick(rng, DAILY_REQUESTS);
  const difficulty = rng() < 0.5 ? 'medium' : 'advanced';
  return {
    id: `daily-${key}`,
    stage: 0,
    title: 'Daily special',
    customerId: customer.id,
    category,
    variant,
    objectName: info.variants[variant],
    difficulty,
    priority: 'normal',
    damage,
    dirt: pick(rng, DIRT),
    dirtAmount: Math.round((0.55 + rng() * 0.3) * 100) / 100,
    tasks: tasksFor(category, damage, difficulty),
    reward: difficulty === 'medium' ? 140 : 190,
    reputation: difficulty === 'medium' ? 8 : 11,
    minutes: difficulty === 'medium' ? 4 : 5,
    targetQuality: 75,
    request: `${customer.lines.greeting} My ${info.variants[variant].toLowerCase()} needs some love today.`,
    special,
    original: { baseColor: palette.woodLight, accentColor: palette.mustard, pattern: 'none', finish: 'matte', stickers: [], accessory: false },
    clues: cluesFor(category, damage, hashString(key) % 7),
  };
}

export function isDailyId(id: string): boolean {
  return id.startsWith('daily-');
}

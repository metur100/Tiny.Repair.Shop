import { paintColors } from '@/theme/colors';
import type { FinishId, PatternId, StickerId } from './types';

export interface CosmeticItem {
  id: string;
  kind: 'color' | 'pattern' | 'finish' | 'sticker';
  name: string;
  /** Coins to unlock (0 = free from the start). */
  cost: number;
  /** Paid with tickets instead of coins (optional currency, never required). */
  tickets?: number;
  /** Needs the paint station. */
  needsPaintStation?: boolean;
}

const FREE_COLORS = new Set(['coral', 'orange', 'mustard', 'mint', 'sky', 'navy']);

export const COSMETICS: CosmeticItem[] = [
  ...paintColors.map<CosmeticItem>((c) => ({ id: `color:${c.id}`, kind: 'color', name: c.name, cost: FREE_COLORS.has(c.id) ? 0 : 60 })),
  { id: 'pattern:stripes', kind: 'pattern', name: 'Stripes', cost: 0, needsPaintStation: true },
  { id: 'pattern:dots', kind: 'pattern', name: 'Polka dots', cost: 0, needsPaintStation: true },
  { id: 'pattern:checker', kind: 'pattern', name: 'Checker', cost: 90, needsPaintStation: true },
  { id: 'pattern:waves', kind: 'pattern', name: 'Waves', cost: 90, needsPaintStation: true },
  { id: 'pattern:stars', kind: 'pattern', name: 'Stars', cost: 0, tickets: 2, needsPaintStation: true },
  { id: 'finish:gloss', kind: 'finish', name: 'Gloss', cost: 0, needsPaintStation: true },
  { id: 'finish:metallic', kind: 'finish', name: 'Metallic', cost: 120, needsPaintStation: true },
  { id: 'finish:pastel', kind: 'finish', name: 'Pastel', cost: 80, needsPaintStation: true },
  { id: 'sticker:heart', kind: 'sticker', name: 'Heart', cost: 0, needsPaintStation: true },
  { id: 'sticker:star', kind: 'sticker', name: 'Star', cost: 0, needsPaintStation: true },
  { id: 'sticker:bolt', kind: 'sticker', name: 'Lightning', cost: 50, needsPaintStation: true },
  { id: 'sticker:flower', kind: 'sticker', name: 'Flower', cost: 50, needsPaintStation: true },
  { id: 'sticker:note', kind: 'sticker', name: 'Music note', cost: 50, needsPaintStation: true },
  { id: 'sticker:smile', kind: 'sticker', name: 'Smiley', cost: 0, tickets: 1, needsPaintStation: true },
];

export const PATTERNS: PatternId[] = ['none', 'stripes', 'dots', 'checker', 'waves', 'stars'];
export const FINISHES: FinishId[] = ['matte', 'gloss', 'metallic', 'pastel'];
export const STICKERS: StickerId[] = ['heart', 'star', 'bolt', 'flower', 'note', 'smile'];

export const FINISH_LABEL: Record<FinishId, string> = { matte: 'Matte', gloss: 'Gloss', metallic: 'Metallic', pastel: 'Pastel' };
export const PATTERN_LABEL: Record<PatternId, string> = { none: 'Plain', stripes: 'Stripes', dots: 'Polka dots', checker: 'Checker', waves: 'Waves', stars: 'Stars' };

export function startingCosmetics(): string[] {
  return COSMETICS.filter((c) => c.cost === 0 && !c.tickets).map((c) => c.id).concat('pattern:none', 'finish:matte');
}

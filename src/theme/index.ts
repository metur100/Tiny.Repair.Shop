import { useMemo } from 'react';

import { useSettings } from '@/store/useGameStore';
import { highContrastColors, lightColors, type ThemeColors } from './colors';

export * from './colors';
export * from './shadows';
export * from './spacing';
export * from './typography';

/** Current colour set (high-contrast mode swaps the palette). */
export function useColors(): ThemeColors {
  const highContrast = useSettings((s) => s.highContrast);
  return useMemo(() => (highContrast ? highContrastColors : lightColors), [highContrast]);
}

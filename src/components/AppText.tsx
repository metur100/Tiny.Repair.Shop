import { memo } from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';

import { type as typeScale, useColors } from '@/theme';

export type TextVariant = keyof typeof typeScale;

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
  color?: string;
  muted?: boolean;
  center?: boolean;
}

/** Text in the game's typeface; respects the system font scale up to a comfortable maximum. */
export const AppText = memo(function AppText({ variant = 'body', color, muted, center, style, ...rest }: AppTextProps) {
  const c = useColors();
  const base: TextStyle = { ...typeScale[variant], color: color ?? (muted ? c.textMuted : c.text) };
  if (center) base.textAlign = 'center';
  return <Text maxFontSizeMultiplier={1.4} {...rest} style={[base, style]} />;
});

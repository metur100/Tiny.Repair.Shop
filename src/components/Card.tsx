import { memo, type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { radius, shadows, spacing, useColors } from '@/theme';

export interface CardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Warm wooden frame (workshop look). */
  wood?: boolean;
  tint?: string;
  padded?: boolean;
  accessibilityLabel?: string;
}

/** Rounded paper card with a soft warm shadow. */
export const Card = memo(function Card({ children, style, wood, tint, padded = true, accessibilityLabel }: CardProps) {
  const c = useColors();
  return (
    <View
      accessible={!!accessibilityLabel}
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.card,
        shadows.md,
        { backgroundColor: tint ?? c.surface, borderColor: wood ? c.wood : c.border, borderWidth: wood ? 3 : 1.5 },
        padded && styles.padded,
        style,
      ]}
    >
      {children}
    </View>
  );
});

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg },
  padded: { padding: spacing.lg },
});

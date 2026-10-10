import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo, useCallback } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { useReduceMotion } from '@/hooks/useMotion';
import { haptic } from '@/services/haptics';
import { playSound } from '@/services/audio';
import { palette, radius, shadows, spacing, touch, useColors } from '@/theme';
import { AppText } from './AppText';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'wood';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  size?: 'md' | 'lg' | 'sm';
  disabled?: boolean;
  /** Spoken label if different from the visible text. */
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  /** Sub label under the main text (e.g. a price). */
  sub?: string;
  silent?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Big, friendly, springy button with sound and haptic feedback. */
export const Button = memo(function Button({ label, onPress, variant = 'primary', icon, size = 'md', disabled, accessibilityLabel, accessibilityHint, style, testID, sub, silent }: ButtonProps) {
  const c = useColors();
  const reduce = useReduceMotion();
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const colors: Record<ButtonVariant, { bg: string; fg: string; edge: string }> = {
    primary: { bg: c.primary, fg: c.primaryText, edge: palette.orangeDeep },
    secondary: { bg: c.surface, fg: c.text, edge: c.border },
    ghost: { bg: 'transparent', fg: c.text, edge: 'transparent' },
    danger: { bg: palette.coral, fg: '#3A0E06', edge: palette.coralDeep },
    success: { bg: palette.mint, fg: '#0E3A2C', edge: palette.mintDeep },
    wood: { bg: palette.woodLight, fg: '#2E190C', edge: palette.woodDark },
  };
  const v = colors[variant];
  const height = size === 'lg' ? 64 : size === 'sm' ? 44 : touch;

  const handlePress = useCallback(() => {
    if (disabled) return;
    if (!silent) {
      playSound('tap', { volume: 0.5 });
      haptic('tap');
    }
    onPress();
  }, [disabled, onPress, silent]);

  return (
    <AnimatedPressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? (sub ? `${label}, ${sub}` : label)}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      onPress={handlePress}
      onPressIn={() => {
        if (!reduce && !disabled) scale.value = withSpring(0.94, { damping: 14, stiffness: 400 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 10, stiffness: 300 });
      }}
      hitSlop={size === 'sm' ? 6 : 0}
      style={[anim, style]}
    >
      <View
        style={[
          styles.base,
          {
            minHeight: height,
            backgroundColor: v.bg,
            borderColor: v.edge,
            borderBottomWidth: variant === 'ghost' ? 0 : 4,
            borderWidth: variant === 'secondary' ? 2 : 0,
            opacity: disabled ? 0.5 : 1,
            paddingHorizontal: size === 'sm' ? spacing.md : spacing.lg,
          },
          variant !== 'ghost' && shadows.sm,
        ]}
      >
        {icon ? <MaterialCommunityIcons name={icon} size={size === 'lg' ? 26 : 22} color={v.fg} /> : null}
        <View style={styles.textCol}>
          <AppText variant={size === 'lg' ? 'heading' : 'bodyStrong'} color={v.fg} numberOfLines={1}>
            {label}
          </AppText>
          {sub ? (
            <AppText variant="caption" color={v.fg} style={styles.sub} numberOfLines={1}>
              {sub}
            </AppText>
          ) : null}
        </View>
      </View>
    </AnimatedPressable>
  );
});

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  textCol: { alignItems: 'center' },
  sub: { opacity: 0.85, marginTop: -2 },
});

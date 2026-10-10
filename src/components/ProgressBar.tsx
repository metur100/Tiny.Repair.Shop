import { memo, useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useReduceMotion } from '@/hooks/useMotion';
import { palette, radius, useColors } from '@/theme';
import { AppText } from './AppText';

export interface ProgressBarProps {
  /** 0..1 */
  value: number;
  color?: string;
  height?: number;
  label?: string;
  /** Show the percentage inside the label row. */
  showPercent?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Optional target marker (0..1), e.g. the goal for cleaning. */
  marker?: number;
}

/** Smoothly animated progress bar with an accessible value. */
export const ProgressBar = memo(function ProgressBar({ value, color, height = 14, label, showPercent, style, marker }: ProgressBarProps) {
  const c = useColors();
  const reduce = useReduceMotion();
  const v = Math.max(0, Math.min(1, value));
  const w = useSharedValue(v);
  useEffect(() => {
    w.value = reduce ? v : withTiming(v, { duration: 260 });
  }, [v, reduce, w]);
  const fill = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));
  const pct = Math.round(v * 100);
  return (
    <View style={style} accessible accessibilityRole="progressbar" accessibilityLabel={label} accessibilityValue={{ min: 0, max: 100, now: pct }}>
      {label || showPercent ? (
        <View style={styles.row}>
          {label ? <AppText variant="label">{label}</AppText> : <View />}
          {showPercent ? <AppText variant="label">{pct}%</AppText> : null}
        </View>
      ) : null}
      <View style={[styles.track, { height, borderRadius: radius.pill, backgroundColor: c.surfaceAlt, borderColor: c.border }]}>
        <Animated.View style={[styles.fill, { backgroundColor: color ?? palette.mint, borderRadius: radius.pill }, fill]} />
        {marker !== undefined ? <View style={[styles.marker, { left: `${marker * 100}%`, backgroundColor: c.text }]} /> : null}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  track: { overflow: 'hidden', borderWidth: 1.5 },
  fill: { height: '100%' },
  marker: { position: 'absolute', top: 0, bottom: 0, width: 3, marginLeft: -1.5, opacity: 0.6 },
});

import { Canvas, Circle, Group, Line, vec } from '@shopify/react-native-skia';
import { memo, useMemo, type ReactNode } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSettings } from '@/store/useGameStore';
import { spacing, useColors } from '@/theme';
import { createRng } from '@/utils/dateSeed';

/** Faint paper texture: fibres and specks drawn once with Skia (static, cheap). */
export const PaperTexture = memo(function PaperTexture() {
  const { width, height } = useWindowDimensions();
  const highContrast = useSettings((s) => s.highContrast);
  const marks = useMemo(() => {
    const rng = createRng(42);
    const fibres = Array.from({ length: 60 }, () => {
      const x = rng() * width;
      const y = rng() * height;
      const a = rng() * Math.PI;
      const l = 6 + rng() * 18;
      return { x, y, x2: x + Math.cos(a) * l, y2: y + Math.sin(a) * l };
    });
    const specks = Array.from({ length: 90 }, () => ({ x: rng() * width, y: rng() * height, r: 0.6 + rng() * 1.4 }));
    return { fibres, specks };
  }, [width, height]);
  if (highContrast) return null;
  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      <Group opacity={0.18}>
        {marks.fibres.map((f, i) => (
          <Line key={i} p1={vec(f.x, f.y)} p2={vec(f.x2, f.y2)} color="#C8A97A" strokeWidth={1} />
        ))}
        {marks.specks.map((s, i) => (
          <Circle key={`s${i}`} cx={s.x} cy={s.y} r={s.r} color="#B08A5A" />
        ))}
      </Group>
    </Canvas>
  );
});

export interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  /** Extra space at the bottom (e.g. above the tab bar). */
  bottomInset?: number;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  padded?: boolean;
  testID?: string;
}

/** Safe-area aware screen on the cream paper background. Tablets get a centred, readable column. */
export const Screen = memo(function Screen({ children, scroll, bottomInset = 0, style, contentStyle, padded = true, testID }: ScreenProps) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const maxWidth = width > 700 ? 640 : undefined;
  const inner: StyleProp<ViewStyle> = [
    { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + bottomInset + spacing.lg },
    padded && { paddingHorizontal: spacing.lg },
    maxWidth ? { maxWidth, width: '100%', alignSelf: 'center' } : null,
    contentStyle,
  ];
  return (
    <View style={[styles.root, { backgroundColor: c.background }, style]} testID={testID}>
      <PaperTexture />
      {scroll ? (
        <ScrollView contentContainerStyle={inner} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.root, inner]}>{children}</View>
      )}
      {/* Scrolled content slides under an opaque strip instead of behind the status bar icons. */}
      {scroll ? <View style={[styles.statusStrip, { height: insets.top, backgroundColor: c.background }]} pointerEvents="none" /> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  statusStrip: { position: 'absolute', top: 0, left: 0, right: 0 },
});

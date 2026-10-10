import { Canvas, Circle, Group, Path, Skia } from '@shopify/react-native-skia';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeIn, useDerivedValue, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { AppText } from '@/components/AppText';
import { PaperTexture } from '@/components/Screen';
import { demoSave } from '@/dev/demoSave';
import { useReduceMotion } from '@/hooks/useMotion';
import { writeSave } from '@/store/saveManager';
import { useGameStore } from '@/store/useGameStore';
import { palette, spacing } from '@/theme';

function gear(cx: number, cy: number, r: number, teeth: number) {
  const b = Skia.PathBuilder.Make();
  for (let i = 0; i < teeth * 2; i++) {
    const a = (i / (teeth * 2)) * Math.PI * 2;
    const rr = i % 2 === 0 ? r : r * 0.8;
    if (i === 0) b.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    else b.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
  }
  b.close();
  b.addCircle(cx, cy, r * 0.35);
  return b.build();
}

/** In-app splash: spinning gears and the logo while the workshop opens, then onboarding or the workshop. */
export default function Splash() {
  const reduce = useReduceMotion();
  const onboardingDone = useGameStore((s) => s.onboardingDone);
  const { demo } = useLocalSearchParams<{ demo?: string }>();
  const spin = useSharedValue(0);
  useEffect(() => {
    // Development builds can load a mid-game save (used to capture store screenshots).
    if (__DEV__ && demo === '1') {
      const save = demoSave();
      useGameStore.getState().hydrate(save);
      void writeSave(save);
    }
  }, [demo]);
  useEffect(() => {
    if (!reduce) spin.value = withRepeat(withTiming(1, { duration: 2400, easing: Easing.linear }), -1, false);
    const t = setTimeout(() => router.replace(onboardingDone ? '/workshop' : '/onboarding'), reduce ? 400 : 1600);
    return () => clearTimeout(t);
  }, [reduce, onboardingDone, spin]);
  const big = useMemo(() => gear(80, 80, 46, 10), []);
  const small = useMemo(() => gear(136, 46, 24, 7), []);
  const tBig = useDerivedValue(() => [{ translateX: 80 }, { translateY: 80 }, { rotate: spin.value * Math.PI * 2 }, { translateX: -80 }, { translateY: -80 }]);
  const tSmall = useDerivedValue(() => [{ translateX: 136 }, { translateY: 46 }, { rotate: -spin.value * Math.PI * 2 * 1.8 }, { translateX: -136 }, { translateY: -46 }]);
  return (
    <View style={[styles.root, { backgroundColor: palette.cream }]} accessibilityLabel="Tiny Repair Shop is loading">
      <PaperTexture />
      <Canvas style={styles.gears}>
        <Circle cx={90} cy={86} r={80} color="#FBE0B8" />
        <Group transform={tBig}>
          <Path path={big} color={palette.orange} />
        </Group>
        <Group transform={tSmall}>
          <Path path={small} color={palette.brass} />
        </Group>
      </Canvas>
      <Animated.View entering={FadeIn.duration(500)} style={styles.text}>
        <AppText variant="display" center>
          Tiny Repair Shop
        </AppText>
        <AppText muted center>
          Opening the workshop…
        </AppText>
      </Animated.View>
      <ActivityIndicator color={palette.orange} size="large" style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  gears: { width: 180, height: 170 },
  text: { marginTop: spacing.lg },
  spinner: { marginTop: spacing.xl },
});

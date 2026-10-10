import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInRight } from 'react-native-reanimated';

import { ObjectArt } from '@/art/ObjectArt';
import { WorkshopScene } from '@/art/WorkshopScene';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { useReduceMotion } from '@/hooks/useMotion';
import { useGameStore } from '@/store/useGameStore';
import { palette, spacing } from '@/theme';

const SLIDES = [
  { title: 'Repair unusual objects', body: 'Radios, bicycles, robots, cameras and more. Find the fault, clean off the grime and fix it with your own hands.' },
  { title: 'Customize them', body: 'Paint, patterns, stickers and shiny finishes. Make every customer’s treasure look better than new.' },
  { title: 'Grow your workshop', body: 'Earn coins and reputation, unlock new stations and turn your tiny shop into the best in town.' },
];

export default function Onboarding() {
  const [index, setIndex] = useState(0);
  const { width } = useWindowDimensions();
  const reduce = useReduceMotion();
  const finish = useGameStore((s) => s.finishOnboarding);
  const done = () => {
    finish();
    router.replace('/workshop');
  };
  const slide = SLIDES[index];
  const art = Math.min(width - spacing.xxl * 2, 300);
  return (
    <Screen testID="onboarding-screen" contentStyle={styles.root}>
      <View style={styles.skipRow}>
        <AppText variant="label" muted>
          {index + 1} / {SLIDES.length}
        </AppText>
        <Button label="Skip" variant="ghost" size="sm" onPress={done} accessibilityHint="Skips the introduction" />
      </View>
      <Animated.View key={index} entering={reduce ? FadeIn : SlideInRight.springify().damping(18)} exiting={FadeOut.duration(120)} style={styles.center}>
        <Card wood style={styles.artCard}>
          {index === 0 ? (
            <View style={styles.pair}>
              <ObjectArt size={art / 2} category="radio" variant={0} broken look={{ baseColor: palette.woodLight, accentColor: palette.mustard, pattern: 'none', finish: 'matte', stickers: [], accessory: false }} />
              <AppText variant="title">→</AppText>
              <ObjectArt size={art / 2} category="radio" variant={0} on look={{ baseColor: palette.mint, accentColor: palette.mustard, pattern: 'none', finish: 'gloss', stickers: ['heart'], accessory: false }} />
            </View>
          ) : index === 1 ? (
            <View style={styles.pair}>
              {[palette.coral, palette.sky, palette.mustard].map((col, i) => (
                <ObjectArt key={col} size={art / 3} category="robot" variant={i} look={{ baseColor: col, accentColor: palette.navy, pattern: i === 1 ? 'dots' : i === 2 ? 'stripes' : 'none', finish: i === 0 ? 'gloss' : 'matte', stickers: i === 0 ? ['star'] : [], accessory: i === 2 }} on />
              ))}
            </View>
          ) : (
            <WorkshopScene width={art} owned={['toolBench', 'paintStation', 'arcadeRoom', 'waitingArea', 'storefront', 'musicCorner']} display={[]} reducedMotion={reduce} />
          )}
        </Card>
        <AppText variant="display" center accessibilityRole="header" style={styles.title}>
          {slide.title}
        </AppText>
        <AppText center muted style={styles.body}>
          {slide.body}
        </AppText>
      </Animated.View>
      <View style={styles.dots} accessibilityElementsHidden>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, { backgroundColor: i === index ? palette.orange : '#E3CFA9', width: i === index ? 28 : 10 }]} />
        ))}
      </View>
      <Button label={index === SLIDES.length - 1 ? 'Open the workshop' : 'Continue'} icon={index === SLIDES.length - 1 ? 'store' : 'arrow-right'} size="lg" onPress={() => (index === SLIDES.length - 1 ? done() : setIndex(index + 1))} testID="onboarding-next" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: { justifyContent: 'space-between' },
  skipRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  center: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  artCard: { alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl },
  pair: { flexDirection: 'row', alignItems: 'center' },
  title: { marginBottom: spacing.sm },
  body: { maxWidth: 420 },
  dots: { flexDirection: 'row', gap: 6, alignSelf: 'center', marginBottom: spacing.lg },
  dot: { height: 10, borderRadius: 5 },
});

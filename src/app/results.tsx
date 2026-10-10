import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withDelay, withTiming, ZoomIn } from 'react-native-reanimated';

import { CustomerAvatar } from '@/art/CustomerAvatar';
import { ObjectArt } from '@/art/ObjectArt';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { StarRow } from '@/components/Misc';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { customerById } from '@/data/customers';
import { STAGE_NAMES } from '@/data/jobs';
import { useDailyJob } from '@/hooks/useJobs';
import { useReduceMotion } from '@/hooks/useMotion';
import { playSound } from '@/services/audio';
import { haptic } from '@/services/haptics';
import { jobFromId, useGameStore } from '@/store/useGameStore';
import { palette, radius, spacing } from '@/theme';
import type { Mood } from '@/utils/economy';

const MOOD_TEXT: Record<Mood, string> = { delighted: 'Delighted', happy: 'Happy', neutral: 'Satisfied', disappointed: 'Disappointed' };

/** One coin that flies up towards the balance. */
function FlyingCoin({ index }: { index: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(index * 70, withTiming(1, { duration: 900 }));
  }, [t, index]);
  const dx = ((index * 37) % 9) * 14 - 60;
  const style = useAnimatedStyle(() => ({
    opacity: t.value < 0.85 ? 1 : (1 - t.value) / 0.15,
    transform: [{ translateX: dx * (1 - t.value) }, { translateY: -t.value * 260 }, { scale: 1 - t.value * 0.4 }],
  }));
  return (
    <Animated.View style={[styles.coin, style]} pointerEvents="none">
      <MaterialCommunityIcons name="circle-multiple" size={26} color={palette.mustardDeep} />
    </Animated.View>
  );
}

/** Drag the handle to compare the object before and after. */
function BeforeAfter({ size, children }: { size: number; children: [React.ReactNode, React.ReactNode] }) {
  const [split, setSplit] = useState(0.5);
  const pan = Gesture.Pan()
    .runOnJS(true)
    .minDistance(0)
    .onBegin((e) => setSplit(Math.max(0, Math.min(1, e.x / size))))
    .onUpdate((e) => setSplit(Math.max(0, Math.min(1, e.x / size))));
  return (
    <GestureDetector gesture={pan}>
      <View style={{ width: size, height: size }} accessible accessibilityLabel="Before and after comparison. Drag to compare." accessibilityRole="adjustable">
        <View style={StyleSheet.absoluteFill}>{children[1]}</View>
        <View style={[styles.beforeClip, { width: size * split }]}>{children[0]}</View>
        <View style={[styles.divider, { left: size * split - 2 }]}>
          <View style={styles.handle}>
            <MaterialCommunityIcons name="arrow-split-vertical" size={20} color={palette.navy} />
          </View>
        </View>
        <AppText variant="caption" style={[styles.tag, styles.tagLeft]}>
          Before
        </AppText>
        <AppText variant="caption" style={[styles.tag, styles.tagRight]}>
          After
        </AppText>
      </View>
    </GestureDetector>
  );
}

export default function Results() {
  const outcome = useGameStore((s) => s.lastOutcome);
  const consume = useGameStore((s) => s.consumePendingCoins);
  const pending = useGameStore((s) => s.pendingCoins);
  const records = useGameStore((s) => s.records);
  const daily = useDailyJob();
  const reduce = useReduceMotion();
  const { width } = useWindowDimensions();
  const job = outcome ? jobFromId(outcome.jobId, daily) : undefined;

  useEffect(() => {
    if (!outcome) return;
    playSound(outcome.mood === 'disappointed' ? 'tap' : 'happy');
    const t = setTimeout(() => {
      playSound('coins');
      haptic('sale');
    }, 500);
    return () => clearTimeout(t);
  }, [outcome]);

  if (!outcome || !job) {
    return (
      <Screen>
        <AppText>No finished job to show.</AppText>
        <Button label="Back to the workshop" onPress={() => router.replace('/workshop')} />
      </Screen>
    );
  }

  const customer = customerById(job.customerId);
  const q = outcome.quality;
  const line = outcome.mood === 'delighted' ? customer.lines.delighted : outcome.mood === 'disappointed' ? customer.lines.disappointed : customer.lines.happy;
  const size = Math.min(width - spacing.lg * 2 - 8, 300);
  const firstTime = (records[job.id]?.timesCompleted ?? 0) === 1 && job.stage > 0;
  const rows: [string, number][] = [
    ['Inspection', q.inspection],
    ['Cleaning', q.cleaning],
    ['Repair', q.repair],
    ['Test', q.test],
    ...(job.special ? ([['Special request', q.request]] as [string, number][]) : []),
  ];

  return (
    <Screen scroll testID="results-screen">
      <Animated.View entering={reduce ? undefined : ZoomIn.springify()} style={styles.center}>
        <AppText variant="display" center accessibilityRole="header">
          {q.perfect ? 'Perfect repair!' : q.stars === 3 ? 'Great job!' : q.stars === 2 ? 'Nice work!' : 'All fixed!'}
        </AppText>
        <StarRow value={q.stars} size={44} />
        <AppText variant="title" center>
          Quality {q.total}%{outcome.newBest && job.stage > 0 ? '  ·  New best!' : ''}
        </AppText>
      </Animated.View>

      <Card wood padded={false} style={styles.compare}>
        <BeforeAfter size={size}>
          {[
            <ObjectArt key="b" size={size} category={job.category} variant={job.variant} look={outcome.before} broken />,
            <ObjectArt key="a" size={size} category={job.category} variant={job.variant} look={outcome.after} on />,
          ]}
        </BeforeAfter>
      </Card>

      <Animated.View entering={reduce ? FadeIn : FadeInDown.delay(200)}>
        <Card style={styles.customer}>
          <CustomerAvatar customer={customer} size={84} mood={outcome.mood} />
          <View style={styles.flex}>
            <AppText variant="label" color={palette.orangeDeep}>
              {customer.name} · {MOOD_TEXT[outcome.mood]}
            </AppText>
            <AppText variant="bodyStrong">“{line}”</AppText>
            <ProgressBar value={outcome.satisfaction / 100} label="Happiness" showPercent color={outcome.satisfaction >= 65 ? palette.mintDeep : palette.mustardDeep} style={styles.happy} />
          </View>
        </Card>
      </Animated.View>

      <Animated.View entering={reduce ? FadeIn : FadeInDown.delay(350)}>
        <Card style={styles.gap}>
          <AppText variant="heading">Rewards</AppText>
          <View style={styles.rewardRow}>
            <View style={styles.reward} accessible accessibilityLabel={`${outcome.reward.coins} coins earned`}>
              <MaterialCommunityIcons name="circle-multiple" size={30} color={palette.mustardDeep} />
              <AppText variant="title">+{outcome.reward.coins}</AppText>
              {!reduce && pending > 0 ? Array.from({ length: 8 }, (_, i) => <FlyingCoin key={i} index={i} />) : null}
            </View>
            <View style={styles.reward} accessible accessibilityLabel={`${outcome.reward.reputation} reputation earned`}>
              <MaterialCommunityIcons name="star-four-points" size={28} color={palette.coral} />
              <AppText variant="title">+{outcome.reward.reputation}</AppText>
            </View>
            {outcome.reward.tickets > 0 ? (
              <View style={styles.reward} accessible accessibilityLabel={`${outcome.reward.tickets} tickets earned`}>
                <MaterialCommunityIcons name="ticket-confirmation" size={28} color={palette.skyDeep} />
                <AppText variant="title">+{outcome.reward.tickets}</AppText>
              </View>
            ) : null}
          </View>
          <AppText variant="caption" muted>
            Base {outcome.reward.base} · Quality +{outcome.reward.qualityBonus}
            {outcome.reward.perfectBonus ? ` · Perfect +${outcome.reward.perfectBonus}` : ''}
            {outcome.reward.customerBonus ? ` · Tip +${outcome.reward.customerBonus}` : ''}
          </AppText>
        </Card>
      </Animated.View>

      <Animated.View entering={reduce ? FadeIn : FadeInDown.delay(500)}>
        <Card style={styles.gap}>
          <AppText variant="heading">How it went</AppText>
          {rows.map(([label, v]) => (
            <ProgressBar key={label} value={v / 100} label={label} showPercent color={v >= 85 ? palette.mintDeep : v >= 65 ? palette.sky : palette.mustard} />
          ))}
          <AppText variant="caption" muted>
            Time {Math.round(outcome.seconds)} s{job.special ? (outcome.requestMet ? ' · Request met' : ' · Request missed') : ''}
          </AppText>
        </Card>
      </Animated.View>

      {outcome.stageUnlocked || firstTime ? (
        <Animated.View entering={reduce ? FadeIn : ZoomIn.delay(650).springify()}>
          <Card tint="#FFF0C9" style={styles.unlock}>
            {outcome.stageUnlocked ? (
              <View style={styles.unlockRow}>
                <MaterialCommunityIcons name="lock-open-variant" size={26} color={palette.orangeDeep} />
                <AppText variant="bodyStrong" style={styles.flex}>
                  New stage unlocked: {STAGE_NAMES[outcome.stageUnlocked - 1]}! Fresh jobs are on the board.
                </AppText>
              </View>
            ) : null}
            {firstTime ? (
              <View style={styles.unlockRow}>
                <MaterialCommunityIcons name="bookshelf" size={26} color={palette.woodDark} />
                <AppText variant="bodyStrong" style={styles.flex}>
                  Added to your collection: {job.objectName}
                </AppText>
              </View>
            ) : null}
          </Card>
        </Animated.View>
      ) : null}

      <Button
        label="Back to the workshop"
        icon="home"
        size="lg"
        testID="results-continue"
        style={styles.continue}
        onPress={() => {
          consume();
          router.replace('/workshop');
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', gap: spacing.xs, marginTop: spacing.md },
  compare: { alignSelf: 'center', overflow: 'hidden', marginVertical: spacing.md, padding: 4, backgroundColor: '#FBEBD0' },
  beforeClip: { position: 'absolute', left: 0, top: 0, bottom: 0, overflow: 'hidden' },
  divider: { position: 'absolute', top: 0, bottom: 0, width: 4, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  handle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: palette.orange },
  tag: { position: 'absolute', top: 8, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.85)', overflow: 'hidden' },
  tagLeft: { left: 8 },
  tagRight: { right: 8 },
  customer: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  flex: { flex: 1 },
  happy: { marginTop: spacing.sm },
  gap: { gap: spacing.sm, marginTop: spacing.md },
  rewardRow: { flexDirection: 'row', gap: spacing.xl },
  reward: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  coin: { position: 'absolute', left: 0, top: 0 },
  unlock: { gap: spacing.sm, marginTop: spacing.md },
  unlockRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  continue: { marginTop: spacing.lg },
});

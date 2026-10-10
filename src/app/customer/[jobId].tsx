import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInUp, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming, ZoomIn } from 'react-native-reanimated';

import { CustomerAvatar } from '@/art/CustomerAvatar';
import { ObjectArt } from '@/art/ObjectArt';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { DIFFICULTY, PRIORITY } from '@/components/JobCard';
import { IconButton, Pill } from '@/components/Misc';
import { Screen } from '@/components/Screen';
import { customerById, PERSONALITY_LABEL } from '@/data/customers';
import { CATEGORIES } from '@/data/objects';
import { useJob } from '@/hooks/useJobs';
import { useReduceMotion } from '@/hooks/useMotion';
import { useGameStore } from '@/store/useGameStore';
import { palette, radius, spacing, useColors } from '@/theme';

/** Types the greeting out letter by letter (instant with reduced motion). */
function useTypewriter(text: string, reduce: boolean): string {
  const [typed, setTyped] = useState({ text, n: 0 });
  // A new text starts typing from the beginning (state adjusted during render, no effect needed).
  if (typed.text !== text) setTyped({ text, n: 0 });
  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => setTyped((v) => (v.n >= v.text.length ? v : { ...v, n: v.n + 1 })), 22);
    return () => clearInterval(t);
  }, [text, reduce]);
  return reduce ? text : text.slice(0, typed.n);
}

export default function CustomerRequest() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const job = useJob(jobId);
  const c = useColors();
  const reduce = useReduceMotion();
  const { width } = useWindowDimensions();
  const startJob = useGameStore((s) => s.startJob);
  const bob = useSharedValue(0);
  useEffect(() => {
    if (!reduce) bob.value = withRepeat(withSequence(withTiming(-6, { duration: 900 }), withTiming(0, { duration: 900 })), -1, true);
  }, [reduce, bob]);
  const bobStyle = useAnimatedStyle(() => ({ transform: [{ translateY: bob.value }] }));
  const customer = job ? customerById(job.customerId) : null;
  const text = useTypewriter(customer && job ? `${customer.lines.greeting} ${job.request}` : '', reduce);

  if (!job || !customer) {
    return (
      <Screen>
        <AppText>This job could not be found.</AppText>
        <Button label="Back" onPress={() => router.back()} />
      </Screen>
    );
  }
  const cat = CATEGORIES[job.category];
  const art = Math.min(width * 0.6, 260);
  return (
    <Screen scroll testID="customer-screen">
      <View style={styles.top}>
        <IconButton icon="close" label="Close" onPress={() => router.back()} />
        <Pill label={PERSONALITY_LABEL[customer.personality]} color={c.surfaceAlt} icon="account-heart" />
      </View>

      <View style={styles.speaker}>
        <Animated.View entering={reduce ? undefined : ZoomIn.springify()}>
          <CustomerAvatar customer={customer} size={110} mood="neutral" />
        </Animated.View>
        <Animated.View entering={reduce ? undefined : FadeInUp.delay(150)} style={[styles.bubble, { backgroundColor: c.surface, borderColor: c.border }]} accessible accessibilityLabel={`${customer.name} says: ${customer.lines.greeting} ${job.request}`}>
          <AppText variant="label" color={palette.orangeDeep}>
            {customer.name}
          </AppText>
          <AppText variant="bodyStrong">{text}</AppText>
        </Animated.View>
      </View>

      <Animated.View style={[styles.stand, bobStyle]}>
        <ObjectArt size={art} category={job.category} variant={job.variant} look={job.original} broken accessibilityLabel={`The damaged ${job.objectName}`} />
      </Animated.View>
      <View style={[styles.standBase, { backgroundColor: palette.woodLight, borderColor: palette.woodDark }]} />

      <Card style={styles.details}>
        <AppText variant="title">{job.title}</AppText>
        <AppText muted>
          {job.objectName} · {cat.plural}
        </AppText>
        <View style={styles.pills}>
          <Pill label={DIFFICULTY[job.difficulty].label} color={DIFFICULTY[job.difficulty].color} icon={DIFFICULTY[job.difficulty].icon} />
          <Pill label={PRIORITY[job.priority].label} color={PRIORITY[job.priority].color} icon={PRIORITY[job.priority].icon} />
          <Pill label={`~${job.minutes} min`} color={c.surfaceAlt} icon="timer-sand" />
          <Pill label={`Hopes for ${job.targetQuality}%`} color="#E4D7FA" icon="target" />
        </View>
        <View style={styles.rewardRow}>
          <View style={styles.reward}>
            <MaterialCommunityIcons name="circle-multiple" size={22} color={palette.mustardDeep} />
            <AppText variant="number">~{job.reward} coins</AppText>
          </View>
          <View style={styles.reward}>
            <MaterialCommunityIcons name="star-four-points" size={20} color={palette.coral} />
            <AppText variant="number">+{job.reputation} rep</AppText>
          </View>
        </View>
        <AppText variant="label" style={styles.stepsTitle}>
          The job: inspect · clean · repair ({job.tasks.length} {job.tasks.length === 1 ? 'step' : 'steps'}) · paint · test
        </AppText>
        {job.special ? (
          <View style={[styles.special, { backgroundColor: '#FDE2DC' }]}>
            <MaterialCommunityIcons name="star-shooting" size={20} color={palette.coralDeep} />
            <AppText variant="bodyStrong" style={styles.flex}>
              Special request: {job.special.text}
            </AppText>
          </View>
        ) : null}
      </Card>

      <Button
        label="Accept job"
        icon="handshake"
        size="lg"
        onPress={() => {
          startJob(job);
          router.replace(`/repair/${job.id}`);
        }}
        testID="accept-job"
        style={styles.accept}
      />
      <Button label="Not now" variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  speaker: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginTop: spacing.md },
  bubble: { flex: 1, borderRadius: radius.lg, borderWidth: 1.5, padding: spacing.md, minHeight: 90, borderTopLeftRadius: 4 },
  stand: { alignItems: 'center', marginTop: spacing.lg },
  standBase: { height: 16, width: '70%', alignSelf: 'center', borderRadius: 8, borderBottomWidth: 4, marginTop: -18 },
  details: { marginTop: spacing.lg, gap: 4 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: spacing.sm },
  rewardRow: { flexDirection: 'row', gap: spacing.lg },
  reward: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepsTitle: { marginTop: spacing.sm },
  special: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, alignItems: 'center', marginTop: spacing.sm },
  flex: { flex: 1 },
  accept: { marginTop: spacing.lg },
});

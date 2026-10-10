import { router } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { CustomerAvatar } from '@/art/CustomerAvatar';
import { WorkshopScene, type DisplayItem } from '@/art/WorkshopScene';
import { AppText } from '@/components/AppText';
import { TAB_BAR_HEIGHT } from '@/components/BottomTabBar';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CoinBalance, ReputationBadge, TicketBadge } from '@/components/CoinBalance';
import { IconButton, Pill } from '@/components/Misc';
import { ProgressBar } from '@/components/ProgressBar';
import { Screen } from '@/components/Screen';
import { customerById } from '@/data/customers';
import { jobById, STAGE_NAMES, STAGE_REPUTATION } from '@/data/jobs';
import { useBoard, useDailyJob } from '@/hooks/useJobs';
import { useReduceMotion } from '@/hooks/useMotion';
import { useGameStore } from '@/store/useGameStore';
import { palette, radius, spacing, useColors } from '@/theme';
import { shopLevel, stageForReputation } from '@/utils/unlocks';

export default function WorkshopScreen() {
  const c = useColors();
  const { width } = useWindowDimensions();
  const reduce = useReduceMotion();
  const upgrades = useGameStore((s) => s.upgrades);
  const records = useGameStore((s) => s.records);
  const rep = useGameStore((s) => s.reputation);
  const daily = useDailyJob();
  const dailyState = useGameStore((s) => s.daily);
  const { open } = useBoard();
  const next = open[0];
  const visitor = next ? customerById(next.customerId) : null;
  const stage = stageForReputation(rep);
  const nextStageRep = STAGE_REPUTATION[stage] ?? null;
  const sceneWidth = Math.min(width - spacing.lg * 2, 600);

  const display = useMemo<DisplayItem[]>(
    () =>
      Object.entries(records)
        .sort((a, b) => b[1].lastCompletedAt - a[1].lastCompletedAt)
        .map(([id, r]) => ({ job: jobById(id) ?? (id === daily.id ? daily : null), r }))
        .filter((x) => x.job)
        .map(({ job, r }) => ({ category: job!.category, variant: job!.variant, look: r.design })),
    [records, daily],
  );

  return (
    <Screen scroll bottomInset={TAB_BAR_HEIGHT + spacing.lg} testID="workshop-screen">
      <View style={styles.hud}>
        <View style={styles.hudLeft}>
          <CoinBalance />
          <ReputationBadge />
          <TicketBadge />
        </View>
        <IconButton icon="cog" label="Settings" onPress={() => router.push('/settings')} />
      </View>

      <Animated.View entering={reduce ? undefined : FadeInDown.duration(400)}>
        <AppText variant="display" accessibilityRole="header">
          Tiny Repair Shop
        </AppText>
        <View style={styles.subRow}>
          <Pill label={`Shop level ${shopLevel(upgrades)}`} color={palette.mint} icon="home-city" />
          <Pill label={`Stage ${stage}: ${STAGE_NAMES[stage - 1]}`} color={c.surfaceAlt} icon="flag-variant" />
        </View>
      </Animated.View>

      <Card wood padded={false} style={styles.sceneCard}>
        <View style={styles.sceneClip}>
          <WorkshopScene width={sceneWidth - 6} owned={upgrades} display={display} visitor={visitor} reducedMotion={reduce} />
        </View>
      </Card>

      {nextStageRep !== null ? (
        <ProgressBar
          value={(rep - STAGE_REPUTATION[stage - 1]) / (nextStageRep - STAGE_REPUTATION[stage - 1])}
          label={`Next stage: ${STAGE_NAMES[stage]} at ${nextStageRep} reputation`}
          color={palette.coral}
          style={styles.progress}
        />
      ) : (
        <AppText variant="label" style={styles.progress}>
          Master Workshop reached – every stage is open!
        </AppText>
      )}

      {next && visitor ? (
        <Animated.View entering={reduce ? undefined : FadeInDown.delay(120).duration(400)}>
          <Card style={styles.visitor}>
            <CustomerAvatar customer={visitor} size={64} mood="neutral" />
            <View style={styles.flex}>
              <AppText variant="label" muted>
                {visitor.name} is at the door
              </AppText>
              <AppText variant="bodyStrong" numberOfLines={2}>
                “{next.request}”
              </AppText>
            </View>
          </Card>
          <Button label="See the next job" icon="account-voice" size="lg" onPress={() => router.push(`/customer/${next.id}`)} testID="next-job" />
        </Animated.View>
      ) : (
        <Card>
          <AppText variant="bodyStrong">No customers waiting.</AppText>
          <AppText muted>Buy a new station in the shop or try today’s special job.</AppText>
        </Card>
      )}

      <Card tint="#FFF1D6" wood style={styles.daily}>
        <View style={styles.flex}>
          <AppText variant="heading">Daily special</AppText>
          <AppText muted numberOfLines={2}>
            {daily.objectName} · {daily.special?.text}
          </AppText>
          {dailyState.date === daily.id.slice(6) ? (
            <AppText variant="label" color={palette.mintDeep}>
              Today’s best: {dailyState.bestScore}%
            </AppText>
          ) : null}
        </View>
        <Button label="Play" icon="calendar-star" variant="wood" onPress={() => router.push(`/customer/${daily.id}`)} testID="daily-job" />
      </Card>

      <View style={styles.actions}>
        <Button label="Upgrade" icon="hammer" variant="secondary" style={styles.flex} onPress={() => router.push({ pathname: '/shop', params: { section: 'upgrades' } })} />
        <Button label="Collection" icon="cards" variant="secondary" style={styles.flex} onPress={() => router.push('/collection')} />
      </View>
      <View style={styles.actions}>
        <Button label="Shop" icon="palette" variant="secondary" style={styles.flex} onPress={() => router.push({ pathname: '/shop', params: { section: 'paint' } })} />
        <Button label="Settings" icon="cog" variant="secondary" style={styles.flex} onPress={() => router.push('/settings')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hud: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  hudLeft: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1 },
  subRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4, marginBottom: spacing.md },
  sceneCard: { alignSelf: 'center', overflow: 'hidden' },
  sceneClip: { borderRadius: radius.lg - 3, overflow: 'hidden' },
  progress: { marginVertical: spacing.md },
  visitor: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  flex: { flex: 1 },
  daily: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.lg },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
});

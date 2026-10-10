import { router } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/AppText';
import { TAB_BAR_HEIGHT } from '@/components/BottomTabBar';
import { CoinBalance } from '@/components/CoinBalance';
import { JobCard } from '@/components/JobCard';
import { PaperTexture } from '@/components/Screen';
import type { Job } from '@/data/types';
import { useBoard, useDailyJob } from '@/hooks/useJobs';
import { useGameStore } from '@/store/useGameStore';
import { spacing, useColors } from '@/theme';
import type { JobLock } from '@/utils/unlocks';

type Row = { job: Job; lock: JobLock; daily?: boolean; header?: string };

export default function JobBoardScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const daily = useDailyJob();
  const { open, locked } = useBoard();
  const dailyState = useGameStore((s) => s.daily);
  const completed = useGameStore((s) => s.completedJobs);

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [{ job: daily, lock: null, daily: true, header: 'Today' }];
    open.forEach((job, i) => out.push({ job, lock: null, header: i === 0 ? 'Waiting customers' : undefined }));
    locked.forEach(({ job, lock }, i) => out.push({ job, lock, header: i === 0 ? 'Coming soon' : undefined }));
    return out;
  }, [daily, open, locked]);

  const renderItem = useCallback(
    ({ item, index }: { item: Row; index: number }) => (
      <View>
        {item.header ? (
          <AppText variant="heading" style={styles.header} accessibilityRole="header">
            {item.header}
          </AppText>
        ) : null}
        <JobCard
          job={item.job}
          lock={item.lock}
          daily={item.daily}
          best={item.daily && dailyState.date && item.job.id.endsWith(dailyState.date) ? dailyState.bestScore : undefined}
          onStart={() => router.push(`/customer/${item.job.id}`)}
          testID={`start-job-${index}`}
        />
      </View>
    ),
    [dailyState],
  );

  return (
    <View style={[styles.root, { backgroundColor: c.background }]} testID="jobs-screen">
      <PaperTexture />
      <FlatList
        data={rows}
        keyExtractor={(r) => r.job.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.list, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + TAB_BAR_HEIGHT + spacing.xl }]}
        ListHeaderComponent={
          <View style={styles.top}>
            <View>
              <AppText variant="display" accessibilityRole="header">
                Job board
              </AppText>
              <AppText muted>{completed.length} of 30 campaign repairs done</AppText>
            </View>
            <CoinBalance />
          </View>
        }
        initialNumToRender={4}
        windowSize={7}
        removeClippedSubviews
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: { paddingHorizontal: spacing.lg, maxWidth: 680, width: '100%', alignSelf: 'center' },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  header: { marginTop: spacing.md, marginBottom: spacing.sm },
});

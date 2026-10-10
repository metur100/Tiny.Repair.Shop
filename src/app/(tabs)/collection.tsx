import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo, useCallback, useEffect } from 'react';
import { FlatList, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ObjectArt } from '@/art/ObjectArt';
import { AppText } from '@/components/AppText';
import { TAB_BAR_HEIGHT } from '@/components/BottomTabBar';
import { StarRow } from '@/components/Misc';
import { PaperTexture } from '@/components/Screen';
import { customerById } from '@/data/customers';
import { JOBS } from '@/data/jobs';
import { CATEGORIES } from '@/data/objects';
import type { Job } from '@/data/types';
import { useReduceMotion } from '@/hooks/useMotion';
import type { JobRecord } from '@/store/saveManager';
import { useGameStore } from '@/store/useGameStore';
import { radius, shadows, spacing, useColors } from '@/theme';

const CollectionCard = memo(function CollectionCard({ job, record, width, index }: { job: Job; record?: JobRecord; width: number; index: number }) {
  const c = useColors();
  const reduce = useReduceMotion();
  const unlocked = !!record;
  const scale = useSharedValue(reduce ? 1 : 0.85);
  useEffect(() => {
    if (!reduce) scale.value = withDelay(Math.min(index, 8) * 40, withSpring(1, { damping: 12 }));
  }, [reduce, scale, index]);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const customer = customerById(job.customerId);
  return (
    <Animated.View
      style={[styles.card, shadows.sm, anim, { width, backgroundColor: unlocked ? c.surface : c.surfaceAlt, borderColor: record?.stars === 3 ? '#D4A84A' : c.border }]}
      accessible
      accessibilityLabel={
        unlocked
          ? `${job.objectName}, ${CATEGORIES[job.category].name}, repaired for ${customer.name}. Best quality ${record.bestQuality} percent, ${record.stars} stars. Completed.`
          : `Locked: ${CATEGORIES[job.category].name}. Complete “${job.title}” to unlock.`
      }
    >
      <View style={[styles.art, { backgroundColor: unlocked ? '#FFF6E6' : c.border }]}>
        {unlocked ? (
          <ObjectArt size={width - 20} category={job.category} variant={job.variant} look={record.design} on />
        ) : (
          <View style={[styles.silhouette, { width: width - 20, height: width - 20 }]}>
            <MaterialCommunityIcons name="help" size={40} color={c.textMuted} />
          </View>
        )}
        {job.rare ? (
          <View style={styles.rare}>
            <MaterialCommunityIcons name="diamond-stone" size={14} color="#7A5AA8" />
          </View>
        ) : null}
      </View>
      <AppText variant="label" numberOfLines={1}>
        {unlocked ? job.objectName : '???'}
      </AppText>
      <AppText variant="caption" muted numberOfLines={1}>
        {CATEGORIES[job.category].name} · {unlocked ? customer.name.split(' ')[0] : `Stage ${job.stage}`}
      </AppText>
      {unlocked ? (
        <View style={styles.meta}>
          <StarRow value={record.stars} size={16} />
          <AppText variant="caption">{record.bestQuality}%</AppText>
        </View>
      ) : (
        <AppText variant="caption" muted>
          Not repaired yet
        </AppText>
      )}
    </Animated.View>
  );
});

export default function CollectionScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const records = useGameStore((s) => s.records);
  const cols = width > 700 ? 4 : 3;
  const inner = Math.min(width, 720) - spacing.lg * 2;
  const cardW = Math.floor((inner - spacing.sm * (cols - 1)) / cols);
  const done = JOBS.filter((j) => records[j.id]).length;
  const perfect = JOBS.filter((j) => records[j.id]?.stars === 3).length;
  const renderItem = useCallback(({ item, index }: { item: Job; index: number }) => <CollectionCard job={item} record={records[item.id]} width={cardW} index={index} />, [records, cardW]);
  return (
    <View style={[styles.root, { backgroundColor: c.background }]} testID="collection-screen">
      <PaperTexture />
      <FlatList
        key={cols}
        data={JOBS}
        numColumns={cols}
        keyExtractor={(j) => j.id}
        renderItem={renderItem}
        columnWrapperStyle={styles.colWrap}
        contentContainerStyle={[styles.list, { width: inner + spacing.lg * 2, paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + TAB_BAR_HEIGHT + spacing.xl }]}
        ListHeaderComponent={
          <View style={styles.header}>
            <AppText variant="display" accessibilityRole="header">
              Collection
            </AppText>
            <AppText muted>
              {done} of {JOBS.length} objects restored · {perfect} perfect
            </AppText>
          </View>
        }
        initialNumToRender={9}
        windowSize={5}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: { paddingHorizontal: spacing.lg, alignSelf: 'center' },
  header: { marginBottom: spacing.md },
  colWrap: { gap: spacing.sm, marginBottom: spacing.sm },
  card: { borderRadius: radius.md, borderWidth: 2, padding: 8, gap: 2 },
  art: { borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  silhouette: { alignItems: 'center', justifyContent: 'center' },
  rare: { position: 'absolute', top: 4, right: 4, backgroundColor: '#F1EAFB', borderRadius: 10, padding: 3 },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});

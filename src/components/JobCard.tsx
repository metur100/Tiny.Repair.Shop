import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { CustomerAvatar } from '@/art/CustomerAvatar';
import { ObjectArt } from '@/art/ObjectArt';
import { customerById, PERSONALITY_LABEL } from '@/data/customers';
import { STAGE_NAMES } from '@/data/jobs';
import { CATEGORIES } from '@/data/objects';
import { upgradeById } from '@/data/upgrades';
import type { Difficulty, Job, Priority } from '@/data/types';
import { palette, radius, spacing, useColors } from '@/theme';
import type { JobLock } from '@/utils/unlocks';
import { AppText } from './AppText';
import { Button } from './Button';
import { Card } from './Card';
import { Pill } from './Misc';

export const DIFFICULTY: Record<Difficulty, { label: string; color: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }> = {
  easy: { label: 'Easy', color: '#CDEFE2', icon: 'wrench' },
  medium: { label: 'Medium', color: '#FBE3A6', icon: 'wrench-cog' },
  advanced: { label: 'Advanced', color: '#F9C6BD', icon: 'cog-transfer' },
};

export const PRIORITY: Record<Priority, { label: string; color: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }> = {
  relaxed: { label: 'No rush', color: '#D9EEF9', icon: 'coffee' },
  normal: { label: 'Normal', color: '#EDE3D2', icon: 'clock-outline' },
  urgent: { label: 'Urgent', color: '#F9C6BD', icon: 'alarm' },
};

export interface JobCardProps {
  job: Job;
  onStart: () => void;
  lock?: JobLock;
  best?: number;
  daily?: boolean;
  testID?: string;
}

/** A repair request on the job board. */
export const JobCard = memo(function JobCard({ job, onStart, lock, best, daily, testID }: JobCardProps) {
  const c = useColors();
  const customer = customerById(job.customerId);
  const cat = CATEGORIES[job.category];
  const locked = !!lock;
  const condition = Math.round((1 - job.dirtAmount) * 100);
  return (
    <Card style={[styles.card, locked && styles.locked]} tint={daily ? '#FFF1D6' : undefined} wood={daily}>
      <View style={styles.top}>
        <View style={[styles.objectBox, { backgroundColor: c.surfaceAlt }]}>
          <ObjectArt size={92} category={job.category} variant={job.variant} look={job.original} broken />
        </View>
        <View style={styles.info}>
          <View style={styles.row}>
            {daily ? <Pill label="Daily special" color={palette.mustard} icon="calendar-star" /> : <Pill label={`Stage ${job.stage}`} color={c.surfaceAlt} />}
            {job.rare ? <Pill label="Rare" color="#E4D7FA" icon="diamond-stone" /> : null}
          </View>
          <AppText variant="heading" numberOfLines={1}>
            {job.title}
          </AppText>
          <AppText variant="caption" muted numberOfLines={1}>
            {job.objectName} · {cat.name}
          </AppText>
          <View style={[styles.row, styles.pills]}>
            <Pill label={DIFFICULTY[job.difficulty].label} color={DIFFICULTY[job.difficulty].color} icon={DIFFICULTY[job.difficulty].icon} />
            <Pill label={PRIORITY[job.priority].label} color={PRIORITY[job.priority].color} icon={PRIORITY[job.priority].icon} />
            <Pill label={`~${job.minutes} min`} color={c.surfaceAlt} icon="timer-sand" />
          </View>
        </View>
      </View>
      <View style={[styles.quote, { backgroundColor: c.surfaceAlt }]}>
        <CustomerAvatar customer={customer} size={44} />
        <View style={styles.flex}>
          <AppText variant="label">
            {customer.name} <AppText variant="caption" muted>· {PERSONALITY_LABEL[customer.personality]}</AppText>
          </AppText>
          <AppText variant="body" numberOfLines={2}>
            “{job.request}”
          </AppText>
          {job.special ? (
            <AppText variant="caption" color={palette.coralDeep}>
              Special request: {job.special.text}
            </AppText>
          ) : null}
        </View>
      </View>
      <View style={styles.bottom}>
        <View style={styles.rewards} accessible accessibilityLabel={`Reward about ${job.reward} coins and ${job.reputation} reputation. Condition ${condition} percent.`}>
          <View style={styles.reward}>
            <MaterialCommunityIcons name="circle-multiple" size={18} color={palette.mustardDeep} />
            <AppText variant="number">~{job.reward}</AppText>
          </View>
          <View style={styles.reward}>
            <MaterialCommunityIcons name="star-four-points" size={16} color={palette.coral} />
            <AppText variant="bodyStrong">+{job.reputation}</AppText>
          </View>
          <View style={styles.reward}>
            <MaterialCommunityIcons name="spray-bottle" size={16} color={c.textMuted} />
            <AppText variant="caption" muted>
              {condition}% clean
            </AppText>
          </View>
        </View>
        {locked ? (
          <View style={styles.lockBox}>
            <MaterialCommunityIcons name="lock" size={18} color={c.textMuted} />
            <AppText variant="caption" muted style={styles.lockText}>
              {lock?.reason === 'stage' ? `Unlocks at ${lock.needed} reputation (${STAGE_NAMES[job.stage - 1]})` : `Needs the ${upgradeById(lock?.reason === 'station' ? lock.station : '')?.name ?? 'station'}`}
            </AppText>
          </View>
        ) : (
          <Button label={best ? 'Repair again' : 'Start'} sub={best ? `Best ${best}%` : undefined} icon="hammer-wrench" onPress={onStart} testID={testID} />
        )}
      </View>
    </Card>
  );
});

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md, gap: spacing.md },
  locked: { opacity: 0.62 },
  top: { flexDirection: 'row', gap: spacing.md },
  objectBox: { borderRadius: radius.md, padding: 2, alignSelf: 'flex-start' },
  info: { flex: 1, gap: 2 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  pills: { marginTop: 4 },
  quote: { flexDirection: 'row', gap: spacing.md, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  flex: { flex: 1 },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  rewards: { gap: 2 },
  reward: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  lockBox: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'flex-end' },
  lockText: { flexShrink: 1, textAlign: 'right' },
});

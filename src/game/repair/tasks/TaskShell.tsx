import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import type { Customization, Difficulty } from '@/data/types';
import { palette, radius, spacing, useColors } from '@/theme';
import type { TaskResult } from '@/utils/scoring';

/** Props every repair mini-game task receives. */
export interface TaskProps {
  difficulty: Difficulty;
  /** 0..0.4 extra forgiveness from upgrades (pro tool bench, electronics table). */
  tolerance: number;
  reduceMotion: boolean;
  /** Colours of the object being repaired (for theming the playfield). */
  look: Customization;
  onDone: (result: TaskResult) => void;
}

/** Records the start time so tasks can report how long they took. */
export function useTaskClock(): () => number {
  const start = useRef(0);
  useEffect(() => {
    start.current = Date.now();
  }, []);
  return useCallback(() => (Date.now() - start.current) / 1000, []);
}

export interface TaskShellProps {
  title: string;
  help: string;
  /** Short live status, e.g. "2 of 3 wires connected". */
  status?: string;
  children: ReactNode;
  /** A success banner is shown over the playfield when the task is solved. */
  solved?: boolean;
}

/** Common frame for a mini-game: title, how-to text (always visible), playfield and live status. */
export const TaskShell = memo(function TaskShell({ title, help, status, children, solved }: TaskShellProps) {
  const c = useColors();
  return (
    <View style={styles.root}>
      <AppText variant="title" accessibilityRole="header">
        {title}
      </AppText>
      <View style={[styles.help, { backgroundColor: c.surfaceAlt }]}>
        <MaterialCommunityIcons name="information-outline" size={18} color={c.text} />
        <AppText variant="body" style={styles.flex}>
          {help}
        </AppText>
      </View>
      <Card padded={false} style={styles.field} wood>
        {children}
        {solved ? (
          <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.solved} pointerEvents="none" accessibilityLiveRegion="polite">
            <View style={[styles.solvedBadge, { backgroundColor: palette.mint }]}>
              <MaterialCommunityIcons name="check-bold" size={22} color="#0E3A2C" />
              <AppText variant="heading" color="#0E3A2C">
                Fixed!
              </AppText>
            </View>
          </Animated.View>
        ) : null}
      </Card>
      {status ? (
        <AppText variant="label" center accessibilityLiveRegion="polite" style={styles.status}>
          {status}
        </AppText>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  root: { gap: spacing.sm },
  help: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, alignItems: 'flex-start' },
  flex: { flex: 1 },
  field: { overflow: 'hidden', alignSelf: 'center', width: '100%' },
  solved: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,246,230,0.55)' },
  solvedBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radius.pill },
  status: { marginTop: spacing.xs },
});

/** Finishes a task after a short "Fixed!" moment. */
export function finishSoon(onDone: (r: TaskResult) => void, result: TaskResult, delay = 700): void {
  setTimeout(() => onDone(result), delay);
}

import { memo, useCallback, useState, type ReactElement } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, SlideInRight, SlideOutLeft } from 'react-native-reanimated';

import { AppText } from '@/components/AppText';
import { TASK_CATEGORY } from '@/data/objects';
import type { Category, Job, TaskKind } from '@/data/types';
import { useGameStore } from '@/store/useGameStore';
import { palette, spacing, useColors } from '@/theme';
import { hashString } from '@/utils/dateSeed';
import { repairTolerance } from '@/utils/economy';
import type { TaskResult } from '@/utils/scoring';
import { arcadeTask } from './ArcadeRepair';
import { bicycleTask } from './BicycleRepair';
import { cameraTask } from './CameraRepair';
import { instrumentTask } from './InstrumentRepair';
import { radioTask } from './RadioRepair';
import { robotTask } from './RobotRepair';
import type { TaskProps } from './tasks/TaskShell';

const MODULES: Record<Category, (kind: TaskKind, props: TaskProps, seed: number) => ReactElement | null> = {
  radio: radioTask,
  bicycle: (k, p) => bicycleTask(k, p),
  robot: robotTask,
  instrument: instrumentTask,
  camera: cameraTask,
  arcade: arcadeTask,
};

/** Renders one repair task through its object's module (radio wires, bicycle chain, robot circuit…). */
export function renderTask(kind: TaskKind, props: TaskProps, seed: number): ReactElement | null {
  return MODULES[TASK_CATEGORY[kind]](kind, props, seed);
}

/** Runs the job's repair mini-games one after another. */
export const RepairStage = memo(function RepairStage({ job, onDone, reduceMotion }: { job: Job; onDone: (results: TaskResult[]) => void; reduceMotion: boolean }) {
  const c = useColors();
  const upgrades = useGameStore((s) => s.upgrades);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<TaskResult[]>([]);
  const kind = job.tasks[index];
  const handleDone = useCallback(
    (r: TaskResult) => {
      const all = [...results, r];
      setResults(all);
      if (index + 1 >= job.tasks.length) onDone(all);
      else setIndex(index + 1);
    },
    [results, index, job.tasks.length, onDone],
  );
  const props: TaskProps = { difficulty: job.difficulty, tolerance: repairTolerance(upgrades), reduceMotion, look: job.original, onDone: handleDone };
  return (
    <View style={styles.root}>
      <View style={styles.steps} accessible accessibilityLabel={`Repair step ${index + 1} of ${job.tasks.length}`}>
        {job.tasks.map((t, i) => (
          <View key={t} style={[styles.step, { backgroundColor: i < index ? palette.mint : i === index ? palette.orange : c.surfaceAlt }]} />
        ))}
        <AppText variant="label" muted>
          Step {index + 1} of {job.tasks.length}
        </AppText>
      </View>
      <Animated.View key={`${kind}-${index}`} entering={reduceMotion ? FadeIn : SlideInRight.springify().damping(18)} exiting={reduceMotion ? undefined : SlideOutLeft.duration(160)}>
        {renderTask(kind, props, hashString(job.id) + index)}
      </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  root: { gap: spacing.sm },
  steps: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  step: { height: 8, flex: 1, maxWidth: 60, borderRadius: 4 },
});

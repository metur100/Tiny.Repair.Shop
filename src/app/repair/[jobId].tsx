import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInRight } from 'react-native-reanimated';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { IconButton } from '@/components/Misc';
import { ConfirmModal } from '@/components/Modal';
import { Screen } from '@/components/Screen';
import type { Customization } from '@/data/types';
import { CleaningCanvas, type CleaningResult } from '@/game/cleaning/CleaningCanvas';
import { InspectionView, type InspectionResult } from '@/game/inspection/InspectionView';
import { PaintStudio } from '@/game/painting/PaintStudio';
import { RepairStage } from '@/game/repair/RepairStage';
import { ObjectTestView, type TestResult } from '@/game/testing/ObjectTestView';
import { useJob } from '@/hooks/useJobs';
import { useReduceMotion } from '@/hooks/useMotion';
import { playSound } from '@/services/audio';
import { useGameStore } from '@/store/useGameStore';
import { palette, spacing, useColors } from '@/theme';
import { brushScale } from '@/utils/economy';
import type { TaskResult } from '@/utils/scoring';

const STAGES = [
  { id: 'inspect', label: 'Inspect', icon: 'magnify' },
  { id: 'clean', label: 'Clean', icon: 'spray-bottle' },
  { id: 'repair', label: 'Repair', icon: 'wrench' },
  { id: 'paint', label: 'Paint', icon: 'format-paint' },
  { id: 'test', label: 'Test', icon: 'play-circle' },
] as const;
type StageId = (typeof STAGES)[number]['id'];

/** The five-stage workbench for one job: inspect → clean → repair → paint → test, then results. */
export default function RepairScreen() {
  const params = useLocalSearchParams<{ jobId: string; stage?: string }>();
  const job = useJob(params.jobId);
  const c = useColors();
  const reduce = useReduceMotion();
  const upgrades = useGameStore((s) => s.upgrades);
  const completeJob = useGameStore((s) => s.completeJob);
  // Development builds can open a stage directly (used to capture store screenshots).
  const initial = __DEV__ && STAGES.some((s) => s.id === params.stage) ? (params.stage as StageId) : 'inspect';
  const [stage, setStage] = useState<StageId>(initial);
  const [leaving, setLeaving] = useState(false);
  const start = useRef(0);
  const inspection = useRef<InspectionResult>({ cluesFound: 0, cluesTotal: 0, wrongTaps: 0, diagnosisCorrect: true });
  const cleaning = useRef<CleaningResult>({ cleaned: 1, seconds: 0 });
  const tasks = useRef<TaskResult[]>([]);
  const [look, setLook] = useState<Customization | null>(null);

  useEffect(() => {
    start.current = Date.now();
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setLeaving(true);
      return true;
    });
    return () => sub.remove();
  }, []);

  const go = useCallback((next: StageId) => {
    playSound('tool', { volume: 0.5 });
    setStage(next);
  }, []);

  const onInspected = useCallback((r: InspectionResult) => {
    inspection.current = r;
    go('clean');
  }, [go]);
  const onCleaned = useCallback((r: CleaningResult) => {
    cleaning.current = r;
    go('repair');
  }, [go]);
  const onRepaired = useCallback((r: TaskResult[]) => {
    tasks.current = r;
    playSound('repair');
    go('paint');
  }, [go]);
  const onPainted = useCallback((l: Customization) => {
    setLook(l);
    go('test');
  }, [go]);
  const onTested = useCallback(
    (t: TestResult) => {
      if (!job) return;
      completeJob(job, {
        ...inspection.current,
        cleaned: cleaning.current.cleaned,
        cleanSeconds: cleaning.current.seconds,
        tasks: tasks.current,
        testPassed: t.passed,
        testAccuracy: t.accuracy,
        customization: look ?? job.original,
        totalSeconds: (Date.now() - start.current) / 1000,
      });
      router.replace('/results');
    },
    [job, look, completeJob],
  );

  if (!job) {
    return (
      <Screen>
        <AppText>This job could not be found.</AppText>
        <Button label="Back to the workshop" onPress={() => router.replace('/workshop')} />
      </Screen>
    );
  }

  const index = STAGES.findIndex((s) => s.id === stage);
  return (
    // Keyed by stage so every stage starts scrolled to the top.
    <Screen key={stage} scroll testID="repair-screen">
      <View style={styles.header}>
        <IconButton icon="close" label="Leave this job" onPress={() => setLeaving(true)} />
        <View style={styles.flex}>
          <AppText variant="label" muted numberOfLines={1}>
            {job.title}
          </AppText>
          <AppText variant="heading" numberOfLines={1}>
            {job.objectName}
          </AppText>
        </View>
      </View>

      <View style={styles.stepper} accessible accessibilityLabel={`Stage ${index + 1} of 5: ${STAGES[index].label}`}>
        {STAGES.map((s, i) => {
          const done = i < index;
          const active = i === index;
          return (
            <View key={s.id} style={styles.step}>
              <View style={[styles.stepDot, { backgroundColor: done ? palette.mint : active ? palette.orange : c.surfaceAlt, borderColor: active ? palette.orangeDeep : 'transparent' }]}>
                <MaterialCommunityIcons name={done ? 'check-bold' : s.icon} size={18} color={done || active ? palette.navy : c.textMuted} />
              </View>
              <AppText variant="caption" muted={!active} numberOfLines={1}>
                {s.label}
              </AppText>
              {i < STAGES.length - 1 ? <View style={[styles.stepLine, { backgroundColor: done ? palette.mint : c.border }]} /> : null}
            </View>
          );
        })}
      </View>

      <Animated.View key={stage} entering={reduce ? FadeIn : FadeInRight.springify().damping(18)} style={styles.stage}>
        {stage === 'inspect' ? <InspectionView job={job} onDone={onInspected} reduceMotion={reduce} /> : null}
        {stage === 'clean' ? <CleaningCanvas job={job} brush={brushScale(upgrades)} onDone={onCleaned} reduceMotion={reduce} maxParticles={reduce ? 0 : 40} /> : null}
        {stage === 'repair' ? <RepairStage job={job} onDone={onRepaired} reduceMotion={reduce} /> : null}
        {stage === 'paint' ? <PaintStudio job={job} onDone={onPainted} reduceMotion={reduce} /> : null}
        {stage === 'test' ? <ObjectTestView job={job} look={look ?? job.original} onDone={onTested} reduceMotion={reduce} /> : null}
      </Animated.View>

      <ConfirmModal
        visible={leaving}
        title="Leave this job?"
        message="The customer will wait on the board. Progress on this repair will be lost."
        confirmLabel="Leave"
        cancelLabel="Keep working"
        danger
        onCancel={() => setLeaving(false)}
        onConfirm={() => {
          setLeaving(false);
          router.replace('/jobs');
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
  stepper: { flexDirection: 'row', marginVertical: spacing.md },
  step: { flex: 1, alignItems: 'center', gap: 2 },
  stepDot: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 2, zIndex: 1 },
  stepLine: { position: 'absolute', top: 18, left: '62%', right: '-38%', height: 3 },
  stage: { paddingBottom: spacing.xl },
});

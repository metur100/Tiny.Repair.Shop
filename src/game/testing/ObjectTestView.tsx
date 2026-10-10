import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { cancelAnimation, Easing, FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withTiming, ZoomIn } from 'react-native-reanimated';

import { ObjectArt } from '@/art/ObjectArt';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CATEGORIES } from '@/data/objects';
import type { Customization, Difficulty, Job } from '@/data/types';
import { playSound, type SoundName } from '@/services/audio';
import { haptic } from '@/services/haptics';
import { palette, radius, spacing, useColors } from '@/theme';
import { createRng, hashString } from '@/utils/dateSeed';

export interface TestResult {
  passed: boolean;
  /** 0..1 */
  accuracy: number;
}

interface MechanicProps {
  difficulty: Difficulty;
  reduceMotion: boolean;
  seed: number;
  onDone: (accuracy: number) => void;
}

const LEVEL: Record<Difficulty, number> = { easy: 0, medium: 1, advanced: 2 };
type Icon = keyof typeof MaterialCommunityIcons.glyphMap;

// ───────────────────────── Timing (bicycle bumps, camera shutter) ─────────────────────────

/** A marker sweeps back and forth; tap when it is in the target zone. Several rounds, averaged. */
function TimingTest({ difficulty, reduceMotion, onDone, mode }: MechanicProps & { mode: 'ride' | 'photo' }) {
  const c = useColors();
  const { width } = useWindowDimensions();
  const track = Math.min(width - spacing.lg * 2 - 40, 340);
  const rounds = mode === 'ride' ? 3 : 2;
  const zone = [0.24, 0.18, 0.13][LEVEL[difficulty]];
  const [scores, setScores] = useState<number[]>([]);
  const [flash, setFlash] = useState<'hit' | 'miss' | null>(null);
  const pos = useSharedValue(0);
  const duration = (reduceMotion ? 2200 : 1400) - LEVEL[difficulty] * 150;

  useEffect(() => {
    pos.value = 0;
    pos.value = withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => cancelAnimation(pos);
  }, [pos, duration]);

  const marker = useAnimatedStyle(() => ({ transform: [{ translateX: pos.value * (track - 44) }] }));

  const tap = () => {
    if (scores.length >= rounds) return;
    const dist = Math.abs(pos.value - 0.5);
    const hit = dist <= zone / 2;
    const score = hit ? 1 - (dist / (zone / 2)) * 0.4 : Math.max(0, 0.45 - dist);
    playSound(mode === 'photo' ? 'shutter' : hit ? 'pump' : 'rattle');
    haptic(hit ? 'correct' : 'error');
    setFlash(hit ? 'hit' : 'miss');
    setTimeout(() => setFlash(null), 350);
    const all = [...scores, score];
    setScores(all);
    if (all.length >= rounds) {
      cancelAnimation(pos);
      setTimeout(() => onDone(all.reduce((a, b) => a + b, 0) / all.length), 500);
    }
  };

  const icon: Icon = mode === 'ride' ? 'bicycle' : 'bird';
  return (
    <View style={styles.mech}>
      <AppText muted center>
        {mode === 'ride' ? 'Tap “Hop!” when the bike reaches the bump.' : 'Tap the shutter when the bird is inside the frame.'} Round {Math.min(scores.length + 1, rounds)} of {rounds}.
      </AppText>
      <View style={[styles.track, { width: track, backgroundColor: mode === 'ride' ? '#CFE8C4' : '#CDE6F7', borderColor: c.border }]} accessible accessibilityLabel={mode === 'ride' ? 'Test ride track' : 'Viewfinder'}>
        <View style={[styles.zone, { left: track * (0.5 - zone / 2), width: track * zone, borderColor: mode === 'ride' ? palette.woodDark : palette.navy }, mode === 'ride' && styles.bumpZone]}>
          {mode === 'ride' ? <View style={[styles.bump, { backgroundColor: palette.woodLight }]} /> : null}
        </View>
        <Animated.View style={[styles.marker, marker]}>
          <MaterialCommunityIcons name={icon} size={40} color={palette.navy} />
        </Animated.View>
        {flash ? (
          <Animated.View entering={FadeIn.duration(80)} style={[styles.flash, { backgroundColor: flash === 'hit' ? 'rgba(127,211,180,0.45)' : 'rgba(238,99,82,0.3)' }]} pointerEvents="none" />
        ) : null}
      </View>
      <View style={styles.dots}>
        {Array.from({ length: rounds }, (_, i) => (
          <MaterialCommunityIcons key={i} name={i < scores.length ? (scores[i] >= 0.6 ? 'check-circle' : 'close-circle') : 'circle-outline'} size={22} color={i < scores.length ? (scores[i] >= 0.6 ? palette.mintDeep : palette.coral) : c.textMuted} />
        ))}
      </View>
      <Button label={mode === 'ride' ? 'Hop!' : 'Snap!'} icon={mode === 'ride' ? 'arrow-up-bold' : 'camera-iris'} size="lg" onPress={tap} silent disabled={scores.length >= rounds} testID="test-action" />
    </View>
  );
}

// ───────────────────────── Sequence (robot wake-up, instrument melody) ─────────────────────────

const ROBOT_PADS: { color: string; icon: Icon; name: string }[] = [
  { color: palette.coral, icon: 'heart', name: 'Heart' },
  { color: palette.sky, icon: 'water', name: 'Drop' },
  { color: palette.mustard, icon: 'lightning-bolt', name: 'Bolt' },
  { color: palette.mint, icon: 'leaf', name: 'Leaf' },
];
const NOTE_PADS: { color: string; icon: Icon; name: string }[] = [
  { color: '#F7B2A6', icon: 'music-note', name: 'Do' },
  { color: '#F9D78A', icon: 'music-note', name: 'Re' },
  { color: '#A8DCC6', icon: 'music-note', name: 'Mi' },
  { color: '#A9D2F1', icon: 'music-note', name: 'So' },
];

/** Watch a short pattern light up, then repeat it. One retry; then it counts with lower accuracy. */
function SequenceTest({ difficulty, reduceMotion, seed, onDone, mode }: MechanicProps & { mode: 'robot' | 'music' }) {
  const pads = mode === 'robot' ? ROBOT_PADS : NOTE_PADS;
  const length = 3 + LEVEL[difficulty];
  const pattern = useMemo(() => {
    const rng = createRng(seed);
    return Array.from({ length }, () => Math.floor(rng() * 4));
  }, [seed, length]);
  const [showing, setShowing] = useState(true);
  const [lit, setLit] = useState<number | null>(null);
  const [input, setInput] = useState<number[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [round, setRound] = useState(0);
  const done = useRef(false);

  useEffect(() => {
    const step = reduceMotion ? 900 : 650;
    const timers: ReturnType<typeof setTimeout>[] = [];
    pattern.forEach((p, i) => {
      timers.push(setTimeout(() => {
        setLit(p);
        playSound(mode === 'robot' ? 'tap' : 'note', { rate: 0.8 + p * 0.15 });
      }, 500 + i * step));
      timers.push(setTimeout(() => setLit(null), 500 + i * step + step * 0.6));
    });
    timers.push(setTimeout(() => setShowing(false), 500 + pattern.length * step));
    return () => timers.forEach(clearTimeout);
  }, [pattern, round, reduceMotion, mode]);

  const press = (i: number) => {
    if (showing || done.current) return;
    setLit(i);
    setTimeout(() => setLit((v) => (v === i ? null : v)), 180);
    const next = [...input, i];
    if (pattern[next.length - 1] !== i) {
      playSound(mode === 'robot' ? 'error' : 'sourNote');
      haptic('error');
      const m = mistakes + 1;
      setMistakes(m);
      if (m >= 2) {
        done.current = true;
        onDone(Math.max(0.35, input.length / pattern.length) * 0.7);
      } else {
        // Show the pattern again.
        setShowing(true);
        setInput([]);
        setRound((r) => r + 1);
      }
      return;
    }
    playSound(mode === 'robot' ? 'tap' : 'note', { rate: 0.8 + i * 0.15 });
    haptic('tick');
    setInput(next);
    if (next.length === pattern.length) {
      done.current = true;
      setTimeout(() => onDone(mistakes === 0 ? 1 : 0.8), 300);
    }
  };

  return (
    <View style={styles.mech}>
      <AppText muted center accessibilityLiveRegion="polite">
        {showing ? 'Watch the pattern…' : `Your turn: ${input.length} of ${pattern.length}`}
      </AppText>
      <AppText variant="caption" muted center accessibilityLabel={`Pattern: ${pattern.map((p) => pads[p].name).join(', ')}`}>
        {mode === 'robot' ? 'Wake-up code' : 'Melody'}: {pattern.length} {mode === 'robot' ? 'lights' : 'notes'}
      </AppText>
      <View style={styles.pads}>
        {pads.map((p, i) => (
          <Pressable
            key={p.name}
            onPress={() => press(i)}
            disabled={showing}
            accessibilityRole="button"
            accessibilityLabel={p.name}
            testID={`pad-${i}`}
            style={[styles.pad, { backgroundColor: p.color, opacity: lit === i ? 1 : 0.55, transform: [{ scale: lit === i ? 1.08 : 1 }] }, mode === 'music' && styles.key]}
          >
            <MaterialCommunityIcons name={p.icon} size={30} color={palette.navy} />
            <AppText variant="label">{p.name}</AppText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// ───────────────────────── Tune (radio) ─────────────────────────

/** Power on, then drag the dial (or use ±) to find the station and lock it in. */
function TuneTest({ difficulty, seed, onDone }: MechanicProps) {
  const c = useColors();
  const { width } = useWindowDimensions();
  const bar = Math.min(width - spacing.lg * 2 - 40, 340);
  const target = useMemo(() => 90 + Math.round(createRng(seed)() * 32) / 2, [seed]);
  const [power, setPower] = useState(false);
  const [freq, setFreq] = useState(88);
  const window = [1.5, 1, 0.6][LEVEL[difficulty]];
  const dist = Math.abs(freq - target);
  const signal = Math.max(0, 1 - dist / 4);
  // Coarse steps while searching, fine steps once the signal comes in.
  const step = signal < 0.5 ? 1 : 0.5;

  const set = (f: number) => {
    const v = Math.max(88, Math.min(108, Math.round(f * 2) / 2));
    setFreq(v);
    if (Math.abs(v - target) <= window) playSound('note', { volume: 0.5, minGap: 200 });
    else playSound('static', { volume: 0.25 + 0.3 * (1 - Math.max(0, 1 - Math.abs(v - target) / 4)), minGap: 200 });
    haptic('tick', 120);
  };
  const pan = Gesture.Pan()
    .runOnJS(true)
    .minDistance(0)
    .onBegin((e) => power && set(88 + (e.x / bar) * 20))
    .onUpdate((e) => power && set(88 + (e.x / bar) * 20));

  const lock = () => {
    const ok = dist <= window;
    haptic(ok ? 'correct' : 'error');
    playSound(ok ? 'happy' : 'error');
    onDone(ok ? 1 - (dist / window) * 0.3 : Math.max(0.3, signal * 0.6));
  };

  return (
    <View style={styles.mech}>
      {!power ? (
        <Button
          label="Power on"
          icon="power"
          size="lg"
          testID="test-power"
          onPress={() => {
            setPower(true);
            playSound('powerOn');
            haptic('complete');
          }}
        />
      ) : (
        <Animated.View entering={FadeIn} style={styles.mech}>
          <AppText muted center>
            Find the music station. The signal meter fills when you are close.
          </AppText>
          <AppText variant="title" center accessibilityLiveRegion="polite">
            {freq.toFixed(1)} FM
          </AppText>
          <View style={[styles.meter, { width: bar, backgroundColor: c.surfaceAlt, borderColor: c.border }]} accessible accessibilityLabel={`Signal ${Math.round(signal * 100)} percent`}>
            <View style={{ width: `${signal * 100}%`, height: '100%', borderRadius: 6, backgroundColor: signal > 0.75 ? palette.mintDeep : palette.mustard }} />
          </View>
          <GestureDetector gesture={pan}>
            <View style={[styles.dial, { width: bar, borderColor: palette.woodDark }]} accessible accessibilityLabel="Tuning dial. Drag to tune.">
              {Array.from({ length: 21 }, (_, i) => (
                <View key={i} style={[styles.tickMark, { left: (i / 20) * bar, height: i % 5 === 0 ? 18 : 10 }]} />
              ))}
              <View style={[styles.needle, { left: ((freq - 88) / 20) * bar - 2 }]} />
            </View>
          </GestureDetector>
          <View style={styles.row}>
            <Button label="" icon="minus" accessibilityLabel="Tune down" variant="secondary" onPress={() => set(freq - step)} style={styles.flex} silent />
            <Button label="Lock station" icon="radio-tower" onPress={lock} style={styles.flex2} testID="test-action" />
            <Button label="" icon="plus" accessibilityLabel="Tune up" variant="secondary" onPress={() => set(freq + step)} style={styles.flex} silent />
          </View>
        </Animated.View>
      )}
    </View>
  );
}

// ───────────────────────── Targets (arcade) ─────────────────────────

/** A quick round: tap the lit targets on the 3×3 grid before they fade. */
function TargetTest({ difficulty, reduceMotion, seed, onDone }: MechanicProps) {
  const total = 6;
  const life = (reduceMotion ? 2200 : 1500) - LEVEL[difficulty] * 200;
  const order = useMemo(() => {
    const rng = createRng(seed);
    const out: number[] = [];
    while (out.length < total) {
      const n = Math.floor(rng() * 9);
      if (out[out.length - 1] !== n) out.push(n);
    }
    return out;
  }, [seed]);
  const [index, setIndex] = useState(-1);
  const [hits, setHits] = useState(0);
  const hitsRef = useRef(0);
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  });

  useEffect(() => {
    if (index < 0) {
      const t = setTimeout(() => setIndex(0), 700);
      return () => clearTimeout(t);
    }
    if (index >= total) {
      doneRef.current(hitsRef.current / total);
      return;
    }
    const t = setTimeout(() => setIndex((i) => i + 1), life);
    return () => clearTimeout(t);
  }, [index, life]);

  const tap = (cell: number) => {
    if (index < 0 || index >= total) return;
    if (order[index] === cell) {
      hitsRef.current += 1;
      setHits(hitsRef.current);
      playSound('coins', { volume: 0.4, rate: 1 + hitsRef.current * 0.08 });
      haptic('correct');
      setIndex((i) => i + 1);
    } else {
      playSound('error', { volume: 0.4 });
      haptic('error');
    }
  };

  return (
    <View style={styles.mech}>
      <AppText muted center accessibilityLiveRegion="polite">
        {index < 0 ? 'Get ready…' : `Hits ${hits} / ${total}`}
      </AppText>
      <View style={[styles.grid, { backgroundColor: '#2A2547' }]}>
        {Array.from({ length: 9 }, (_, cell) => {
          const active = index >= 0 && index < total && order[index] === cell;
          return (
            <Pressable key={cell} onPress={() => tap(cell)} accessibilityRole="button" accessibilityLabel={active ? 'Lit target, tap now' : 'Empty target'} testID={`target-${cell}`} style={[styles.cell, { backgroundColor: active ? palette.mustard : '#3D3766' }]}>
              {active ? (
                <Animated.View entering={reduceMotion ? undefined : ZoomIn.duration(140)}>
                  <MaterialCommunityIcons name="star" size={34} color={palette.coralDeep} />
                </Animated.View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ───────────────────────── Test stage ─────────────────────────

const PASS = 0.5;

/** Stage 6: try the repaired object. Every category has its own short, real interaction. */
export const ObjectTestView = memo(function ObjectTestView({ job, look, onDone, reduceMotion }: { job: Job; look: Customization; onDone: (r: TestResult) => void; reduceMotion: boolean }) {
  const { width } = useWindowDimensions();
  const [result, setResult] = useState<TestResult | null>(null);
  const [attempt, setAttempt] = useState(0);
  const seed = hashString(job.id + ':test') + attempt;
  const art = Math.min(width * 0.45, 190);

  const finish = (accuracy: number) => {
    const r = { passed: accuracy >= PASS, accuracy: Math.max(0, Math.min(1, accuracy)) };
    setResult(r);
    if (r.passed) {
      playSound('happy');
      haptic('complete');
    }
  };

  const props: MechanicProps = { difficulty: job.difficulty, reduceMotion, seed, onDone: finish };
  const mechanic = (() => {
    switch (job.category) {
      case 'radio':
        return <TuneTest {...props} />;
      case 'bicycle':
        return <TimingTest {...props} mode="ride" />;
      case 'robot':
        return <SequenceTest {...props} mode="robot" />;
      case 'instrument':
        return <SequenceTest {...props} mode="music" />;
      case 'camera':
        return <TimingTest {...props} mode="photo" />;
      case 'arcade':
        return <TargetTest {...props} />;
    }
  })();

  const sound: SoundName = result?.passed ? 'sparkle' : 'tap';
  return (
    <View style={styles.root}>
      <AppText variant="title" accessibilityRole="header">
        Test it: {CATEGORIES[job.category].test.toLowerCase()}
      </AppText>
      <View style={styles.objectRow}>
        <ObjectArt size={art} category={job.category} variant={job.variant} look={look} on={!!result?.passed} accessibilityLabel={`The repaired ${job.objectName}${result?.passed ? ', working' : ''}`} />
      </View>
      {result ? (
        <Animated.View entering={reduceMotion ? FadeIn : ZoomIn.springify()}>
          <Card style={styles.result} tint={result.passed ? '#DDF3EA' : '#FDE2DC'}>
            <MaterialCommunityIcons name={result.passed ? 'check-decagram' : 'alert-circle-outline'} size={36} color={result.passed ? palette.mintDeep : palette.coralDeep} />
            <AppText variant="heading" center>
              {result.passed ? 'It works perfectly!' : 'It works… mostly.'}
            </AppText>
            <AppText muted center>
              Test score {Math.round(result.accuracy * 100)}%
            </AppText>
            <View style={styles.row}>
              {!result.passed && attempt < 1 ? (
                <Button
                  label="Try again"
                  icon="restart"
                  variant="secondary"
                  style={styles.flex}
                  onPress={() => {
                    setResult(null);
                    setAttempt((a) => a + 1);
                  }}
                />
              ) : null}
              <Button
                label="Deliver"
                icon="gift"
                variant="success"
                style={styles.flex2}
                testID="test-done"
                onPress={() => {
                  playSound(sound);
                  onDone(result);
                }}
              />
            </View>
          </Card>
        </Animated.View>
      ) : (
        <Card key={attempt}>{mechanic}</Card>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  root: { gap: spacing.sm },
  mech: { gap: spacing.md, alignItems: 'center' },
  objectRow: { alignItems: 'center' },
  result: { gap: spacing.sm, alignItems: 'center' },
  row: { flexDirection: 'row', gap: spacing.sm, alignSelf: 'stretch' },
  flex: { flex: 1 },
  flex2: { flex: 2 },
  track: { height: 72, borderRadius: radius.md, borderWidth: 2, justifyContent: 'center', overflow: 'hidden' },
  zone: { position: 'absolute', top: 6, bottom: 6, borderWidth: 3, borderStyle: 'dashed', borderRadius: radius.sm, alignItems: 'center', justifyContent: 'flex-end' },
  bumpZone: { borderStyle: 'dotted' },
  bump: { width: 34, height: 14, borderTopLeftRadius: 17, borderTopRightRadius: 17 },
  marker: { position: 'absolute', left: 2, width: 44, alignItems: 'center' },
  flash: { ...StyleSheet.absoluteFill },
  dots: { flexDirection: 'row', gap: 6 },
  pads: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  pad: { width: 120, height: 84, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', gap: 2 },
  key: { width: 70, height: 130, borderRadius: radius.md },
  meter: { height: 16, borderRadius: 8, borderWidth: 1.5, overflow: 'hidden' },
  dial: { height: 56, borderBottomWidth: 4, backgroundColor: '#FBEBD0', borderRadius: radius.sm },
  tickMark: { position: 'absolute', bottom: 0, width: 2, backgroundColor: palette.woodDark },
  needle: { position: 'absolute', top: 0, bottom: 0, width: 4, backgroundColor: palette.coral, borderRadius: 2 },
  grid: { width: 264, flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 8, borderRadius: radius.lg },
  cell: { width: 76, height: 76, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});

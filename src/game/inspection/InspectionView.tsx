import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring, withTiming, ZoomIn } from 'react-native-reanimated';

import { ObjectArt } from '@/art/ObjectArt';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { DAMAGE_INFO } from '@/data/objects';
import type { DamageId, Job } from '@/data/types';
import { playSound } from '@/services/audio';
import { haptic } from '@/services/haptics';
import { palette, radius, spacing, useColors } from '@/theme';
import { canDiagnose, diagnosisOptions, isCorrectDiagnosis, relevantFound, requiredClues, tapClue, type InspectionState } from './diagnosis';

export interface InspectionResult {
  cluesFound: number;
  cluesTotal: number;
  wrongTaps: number;
  diagnosisCorrect: boolean;
}

const SPOT = 64;

/** A pulsing ring that marks a spot (hint, or a clue already found). */
const Ring = memo(function Ring({ color, pulse }: { color: string; pulse: boolean }) {
  const s = useSharedValue(1);
  useEffect(() => {
    if (pulse) s.value = withRepeat(withSequence(withTiming(1.25, { duration: 700 }), withTiming(1, { duration: 700 })), -1);
  }, [pulse, s]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return <Animated.View style={[styles.ring, { borderColor: color }, style]} />;
});

export const InspectionView = memo(function InspectionView({ job, onDone, reduceMotion }: { job: Job; onDone: (r: InspectionResult) => void; reduceMotion: boolean }) {
  const c = useColors();
  const { width } = useWindowDimensions();
  const size = Math.min(width - spacing.lg * 2 - 8, 380);
  const [side, setSide] = useState<'front' | 'back'>('front');
  const [zoom, setZoom] = useState(false);
  const [state, setState] = useState<InspectionState>({ found: new Set(), wrongTaps: 0 });
  const [message, setMessage] = useState<{ text: string; relevant: boolean } | null>(null);
  const [hint, setHint] = useState(false);
  const [choice, setChoice] = useState<DamageId | null>(null);
  const [firstTry, setFirstTry] = useState<boolean | null>(null);
  const scale = useSharedValue(1);
  const flip = useSharedValue(1);
  const options = useMemo(() => diagnosisOptions(job), [job]);
  const ready = canDiagnose(state, job);
  const need = requiredClues(job);

  // Gentle help: after 9 s without finding a clue, sparkles show where to look.
  useEffect(() => {
    setHint(false);
    const t = setTimeout(() => setHint(true), 9000);
    return () => clearTimeout(t);
  }, [state.found.size, side]);

  useEffect(() => {
    scale.value = reduceMotion ? (zoom ? 1.3 : 1) : withSpring(zoom ? 1.3 : 1);
  }, [zoom, reduceMotion, scale]);
  // A flat "turn" (squash on X) keeps touch targets reliable on Android, unlike a 3D rotateY.
  const zoomStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }, { scaleX: flip.value }] }));

  const turn = () => {
    haptic('tap');
    playSound('rattle', { volume: 0.4 });
    if (!reduceMotion) flip.value = withSequence(withTiming(0.05, { duration: 160 }), withTiming(1, { duration: 160 }));
    setTimeout(() => setSide((s) => (s === 'front' ? 'back' : 'front')), reduceMotion ? 0 : 160);
  };

  const tapSpot = (index: number) => {
    const res = tapClue(state, job.clues, index);
    setState(res.state);
    setMessage({ text: job.clues[index].text, relevant: res.relevant });
    if (res.relevant) {
      playSound('sparkle', { volume: 0.6 });
      haptic('correct');
    } else {
      playSound('tap', { volume: 0.4 });
      haptic('tick');
    }
  };

  const listen = () => {
    const sound = DAMAGE_INFO[job.damage].sound ?? 'static';
    if (sound === 'silence') {
      setMessage({ text: 'You listen closely… complete silence. No power at all?', relevant: false });
      haptic('tick');
    } else {
      playSound(sound === 'squeak' || sound === 'buzz' ? 'rattle' : sound);
      setMessage({ text: `You hear: ${sound === 'static' ? 'a harsh crackle' : sound === 'sourNote' ? 'a sour, off-key note' : 'a rattle and a squeak'}.`, relevant: false });
    }
  };

  const choose = (d: DamageId) => {
    setChoice(d);
    const ok = isCorrectDiagnosis(job, d);
    if (firstTry === null) setFirstTry(ok);
    if (ok) {
      playSound('repair');
      haptic('complete');
    } else {
      playSound('error', { volume: 0.5 });
      haptic('error');
    }
  };

  const correct = choice !== null && isCorrectDiagnosis(job, choice);
  const spots = job.clues.map((clue, i) => ({ clue, i })).filter((s) => s.clue.side === side);

  return (
    <View style={styles.root}>
      <AppText variant="title" accessibilityRole="header">
        Inspect the {job.objectName.toLowerCase()}
      </AppText>
      <AppText muted>Tap suspicious spots to find clues. Turn it around and listen too – exploring is free.</AppText>

      <Card wood padded={false} style={styles.stage}>
        <Animated.View style={[{ width: size, height: size }, zoomStyle]}>
          <ObjectArt size={size} category={job.category} variant={job.variant} look={job.original} side={side} broken accessibilityLabel={`${job.objectName}, ${side} view`} />
          {spots.map(({ clue, i }) => {
            const found = state.found.has(i);
            return (
              <Pressable
                key={i}
                onPress={() => tapSpot(i)}
                accessibilityRole="button"
                accessibilityLabel={found ? `Inspected spot: ${clue.text}` : `Suspicious spot ${i + 1}`}
                style={[styles.spot, { left: clue.x * size - SPOT / 2, top: clue.y * size - SPOT / 2 }]}
              >
                {found ? <Ring color={clue.relevant ? palette.mint : '#B9B5AA'} pulse={false} /> : hint && clue.relevant ? <Ring color={palette.mustard} pulse={!reduceMotion} /> : null}
                {found ? <MaterialCommunityIcons name={clue.relevant ? 'magnify-plus' : 'check'} size={22} color={clue.relevant ? palette.mintDeep : '#8A8478'} /> : null}
              </Pressable>
            );
          })}
        </Animated.View>
      </Card>

      <View style={styles.tools}>
        <Button label={side === 'front' ? 'Turn around' : 'Turn to front'} icon="rotate-3d-variant" variant="secondary" size="sm" onPress={turn} style={styles.flex} />
        <Button label={zoom ? 'Zoom out' : 'Zoom in'} icon={zoom ? 'magnify-minus' : 'magnify-plus'} variant="secondary" size="sm" onPress={() => setZoom((z) => !z)} style={styles.flex} />
        <Button label="Listen" icon="ear-hearing" variant="secondary" size="sm" onPress={listen} style={styles.flex} />
      </View>

      {message ? (
        <Animated.View key={message.text} entering={reduceMotion ? FadeIn : FadeInDown.springify()} style={[styles.message, { backgroundColor: message.relevant ? '#DDF3EA' : c.surfaceAlt }]} accessibilityLiveRegion="polite">
          <MaterialCommunityIcons name={message.relevant ? 'lightbulb-on' : 'information-outline'} size={22} color={message.relevant ? palette.mintDeep : c.text} />
          <AppText variant="bodyStrong" style={styles.flex}>
            {message.relevant ? 'Clue! ' : ''}
            {message.text}
          </AppText>
        </Animated.View>
      ) : null}

      <AppText variant="label" center>
        Clues found: {relevantFound(state, job.clues)} / {need}
      </AppText>

      {ready ? (
        <Animated.View entering={reduceMotion ? undefined : ZoomIn.springify()}>
          <Card style={styles.diag}>
            <AppText variant="heading">What’s wrong with it?</AppText>
            {options.map((o) => {
              const picked = choice === o.damage;
              const ok = picked && isCorrectDiagnosis(job, o.damage);
              return (
                <Pressable
                  key={o.damage}
                  onPress={() => !correct && choose(o.damage)}
                  accessibilityRole="button"
                  accessibilityLabel={`${o.name}${picked ? (ok ? ', correct' : ', not quite') : ''}`}
                  style={[styles.option, { borderColor: picked ? (ok ? palette.mintDeep : palette.coral) : c.border, backgroundColor: picked ? (ok ? '#DDF3EA' : '#FDE2DC') : c.surface }]}
                >
                  <MaterialCommunityIcons name={picked ? (ok ? 'check-circle' : 'close-circle') : 'circle-outline'} size={24} color={picked ? (ok ? palette.mintDeep : palette.coralDeep) : c.textMuted} />
                  <AppText variant="bodyStrong" style={styles.flex}>
                    {o.name}
                  </AppText>
                </Pressable>
              );
            })}
            {choice && !correct ? (
              <AppText variant="caption" muted>
                Not quite – check your clues and try again.
              </AppText>
            ) : null}
            {correct ? (
              <AppText variant="caption" color={palette.mintDeep}>
                {DAMAGE_INFO[job.damage].hint}
              </AppText>
            ) : null}
          </Card>
        </Animated.View>
      ) : null}

      {correct ? (
        <Button
          label="Start cleaning"
          icon="spray-bottle"
          size="lg"
          testID="inspection-done"
          onPress={() => onDone({ cluesFound: relevantFound(state, job.clues), cluesTotal: job.clues.filter((x) => x.relevant).length, wrongTaps: state.wrongTaps, diagnosisCorrect: firstTry === true })}
        />
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  root: { gap: spacing.sm },
  stage: { alignSelf: 'center', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: '#FBEBD0', padding: 4 },
  spot: { position: 'absolute', width: SPOT, height: SPOT, borderRadius: SPOT / 2, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: SPOT - 8, height: SPOT - 8, borderRadius: (SPOT - 8) / 2, borderWidth: 3 },
  tools: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
  message: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, alignItems: 'center' },
  diag: { gap: spacing.sm },
  option: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 2, borderRadius: radius.md, padding: spacing.md, minHeight: 52 },
});

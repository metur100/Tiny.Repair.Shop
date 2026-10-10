import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Canvas, Circle, Group, Path, RoundedRect, Skia } from '@shopify/react-native-skia';
import { memo, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { AppText } from '@/components/AppText';
import { ProgressBar } from '@/components/ProgressBar';
import { playSound } from '@/services/audio';
import { haptic } from '@/services/haptics';
import { palette } from '@/theme';
import { finishSoon, TaskShell, useTaskClock, type TaskProps } from './TaskShell';

export interface TwistConfig {
  title: string;
  help: string;
  /** Number of bolts / pegs. */
  count: number;
  /** Turns needed for each one. */
  turns: number;
  kind: 'bolt' | 'peg';
}

const SIZE = 132;

function hexPath(cx: number, cy: number, r: number) {
  const b = Skia.PathBuilder.Make();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    if (i === 0) b.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    else b.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  return b.close().build();
}

export const TwistTask = memo(function TwistTask({ config, tolerance, onDone }: TaskProps & { config: TwistConfig }) {
  const clock = useTaskClock();
  const [turns, setTurns] = useState(() => Array.from({ length: config.count }, () => 0));
  const [done, setDone] = useState(() => Array.from({ length: config.count }, () => false));
  const [active, setActive] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const last = useRef<number | null>(null);
  const turnRef = useRef(0);
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finished = useRef(false);
  const lo = config.turns - 0.35 - tolerance * 0.5;
  const hi = config.turns + 0.45 + tolerance * 0.6;
  const cur = turns[active];
  turnRef.current = cur;
  const allDone = done.every(Boolean);

  const lockIfGood = (value: number) => {
    if (settle.current) clearTimeout(settle.current);
    settle.current = setTimeout(() => {
      if (value >= lo && value <= hi) {
        setDone((d) => d.map((x, i) => (i === active ? true : x)));
        playSound('tool');
        haptic('correct');
        const next = done.findIndex((x, i) => !x && i !== active);
        if (next >= 0) setActive(next);
      }
    }, 550);
  };

  useEffect(() => () => {
    if (settle.current) clearTimeout(settle.current);
  }, []);

  useEffect(() => {
    if (allDone && !finished.current) {
      finished.current = true;
      playSound('repair');
      haptic('complete');
      finishSoon(onDone, { accuracy: Math.max(0.5, 1 - mistakes * 0.15), seconds: clock(), mistakes });
    }
  }, [allDone, mistakes, onDone, clock]);

  const setCur = (v: number) => {
    const before = turnRef.current;
    let value = Math.max(0, v);
    if (value > hi + 0.5) {
      // Over-tightened: it slips back a bit. Forgiving, but it costs a little accuracy.
      setMistakes((m) => m + 1);
      playSound('error', { volume: 0.4 });
      haptic('error');
      value = config.turns - 0.6;
    }
    if (Math.floor(value * 4) !== Math.floor(before * 4)) {
      playSound('screw', { volume: 0.35 });
      haptic('tick');
    }
    setTurns((t) => t.map((x, i) => (i === active ? value : x)));
    lockIfGood(value);
  };

  const pan = Gesture.Pan()
    .runOnJS(true)
    .minDistance(1)
    .onBegin((e) => {
      last.current = Math.atan2(e.y - SIZE / 2, e.x - SIZE / 2);
    })
    .onUpdate((e) => {
      if (done[active]) return;
      const a = Math.atan2(e.y - SIZE / 2, e.x - SIZE / 2);
      if (last.current === null) last.current = a;
      let d = a - last.current;
      if (d > Math.PI) d -= Math.PI * 2;
      if (d < -Math.PI) d += Math.PI * 2;
      last.current = a;
      setCur(turnRef.current + d / (Math.PI * 2));
    });

  const inZone = cur >= lo && cur <= hi;
  const rot = cur * Math.PI * 2;
  return (
    <TaskShell title={config.title} help={config.help} status={config.count > 1 ? `${done.filter(Boolean).length} of ${config.count} tight` : inZone ? 'Just right – let go' : `${cur.toFixed(1)} of ${config.turns} turns`} solved={allDone}>
      <View style={styles.field}>
        {config.count > 1 ? (
          <View style={styles.row}>
            {done.map((d, i) => (
              <Pressable key={i} accessibilityRole="button" accessibilityLabel={`${config.kind === 'peg' ? 'Peg' : 'Bolt'} ${i + 1}${d ? ', tight' : ''}`} onPress={() => !d && setActive(i)} style={[styles.pick, { backgroundColor: d ? palette.mint : i === active ? palette.mustard : '#EDE3D2' }]}>
                <MaterialCommunityIcons name={d ? 'check' : config.kind === 'peg' ? 'pin' : 'hexagon-outline'} size={18} color="#1F2A44" />
              </Pressable>
            ))}
          </View>
        ) : null}
        <GestureDetector gesture={pan}>
          <View accessible accessibilityRole="adjustable" accessibilityLabel={`${config.kind === 'peg' ? 'Tuning peg' : 'Bolt'}, ${cur.toFixed(1)} turns`} style={{ width: SIZE, height: SIZE }}>
            <Canvas style={{ width: SIZE, height: SIZE }}>
              <Circle cx={SIZE / 2} cy={SIZE / 2} r={SIZE / 2 - 2} color="rgba(91,58,38,0.12)" />
              <Circle cx={SIZE / 2} cy={SIZE / 2} r={SIZE / 2 - 2} style="stroke" strokeWidth={2} color="rgba(91,58,38,0.35)" />
              <Group transform={[{ translateX: SIZE / 2 }, { translateY: SIZE / 2 }, { rotate: rot }, { translateX: -SIZE / 2 }, { translateY: -SIZE / 2 }]}>
                {config.kind === 'bolt' ? (
                  <Group>
                    <Path path={hexPath(SIZE / 2, SIZE / 2, 40)} color={done[active] ? palette.mint : '#B9B5AA'} />
                    <Path path={hexPath(SIZE / 2, SIZE / 2, 40)} style="stroke" strokeWidth={3} color="#6B6355" />
                    <Circle cx={SIZE / 2} cy={SIZE / 2} r={16} color="#8A8478" />
                    <RoundedRect x={SIZE / 2 - 3} y={SIZE / 2 - 14} width={6} height={28} r={3} color="#5C5A56" />
                  </Group>
                ) : (
                  <Group>
                    <RoundedRect x={SIZE / 2 - 16} y={SIZE / 2 - 40} width={32} height={80} r={14} color={done[active] ? palette.mint : '#E8D9B8'} />
                    <Circle cx={SIZE / 2} cy={SIZE / 2} r={12} color={palette.woodDark} />
                  </Group>
                )}
              </Group>
              <Path path={Skia.Path.MakeFromSVGString(`M${SIZE - 18} 20 A 50 50 0 0 1 ${SIZE - 6} 50`) ?? Skia.PathBuilder.Make().build()} style="stroke" strokeWidth={4} color={palette.orange} strokeCap="round" />
            </Canvas>
          </View>
        </GestureDetector>
        <View style={styles.gauge}>
          <ProgressBar value={Math.min(1, cur / (hi + 0.5))} marker={lo / (hi + 0.5)} label="Torque" color={inZone ? palette.mintDeep : cur > hi ? palette.coral : palette.mustard} />
          <AppText variant="caption" muted>
            Green zone starts at the marker. Too far and it slips!
          </AppText>
        </View>
        <View style={styles.row}>
          <Pressable accessibilityRole="button" accessibilityLabel="Loosen a quarter turn" onPress={() => setCur(cur - 0.25)} style={styles.btn}>
            <MaterialCommunityIcons name="rotate-left" size={24} color="#1F2A44" />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Tighten a quarter turn" onPress={() => setCur(cur + 0.25)} style={styles.btn}>
            <MaterialCommunityIcons name="rotate-right" size={24} color="#1F2A44" />
          </Pressable>
        </View>
      </View>
    </TaskShell>
  );
});

const styles = StyleSheet.create({
  field: { padding: 14, alignItems: 'center', gap: 10, backgroundColor: '#F4E3C3' },
  row: { flexDirection: 'row', gap: 10 },
  pick: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  gauge: { width: '100%', gap: 2 },
  btn: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#EDE3D2', alignItems: 'center', justifyContent: 'center' },
});

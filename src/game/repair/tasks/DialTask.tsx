import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Canvas, Circle, Group, Line, Path, Rect, RoundedRect, Skia, vec } from '@shopify/react-native-skia';
import { memo, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { AppText } from '@/components/AppText';
import { playSound } from '@/services/audio';
import { haptic } from '@/services/haptics';
import { palette } from '@/theme';
import { finishSoon, TaskShell, useTaskClock, type TaskProps } from './TaskShell';

export interface DialSpec {
  label: string;
  /** 0..1 */
  target: number;
  start: number;
}

export interface DialConfig {
  title: string;
  help: string;
  display: 'radio' | 'tuner' | 'ring';
  dials: DialSpec[];
  /** Half-width of the target zone (0..1). */
  zone: number;
  hold: number;
}

const KNOB = 120;

/** One rotary knob: drag around it to turn (one full turn = 40% of the range). */
const Knob = memo(function Knob({ value, onChange, locked, label, size = KNOB }: { value: number; onChange: (v: number) => void; locked: boolean; label: string; size?: number }) {
  const last = useRef<number | null>(null);
  const valueRef = useRef(value);
  valueRef.current = value;
  const pan = Gesture.Pan()
    .runOnJS(true)
    .minDistance(1)
    .onBegin((e) => {
      last.current = Math.atan2(e.y - size / 2, e.x - size / 2);
    })
    .onUpdate((e) => {
      if (locked) return;
      const a = Math.atan2(e.y - size / 2, e.x - size / 2);
      if (last.current === null) last.current = a;
      let d = a - last.current;
      if (d > Math.PI) d -= Math.PI * 2;
      if (d < -Math.PI) d += Math.PI * 2;
      last.current = a;
      const next = Math.max(0, Math.min(1, valueRef.current + (d / (Math.PI * 2)) * 0.4));
      if (Math.floor(next * 40) !== Math.floor(valueRef.current * 40)) haptic('tick');
      onChange(next);
    });
  const angle = value * Math.PI * 2 * 2.5;
  return (
    <View style={styles.knobWrap}>
      <GestureDetector gesture={pan}>
        <View style={{ width: size, height: size }} accessible accessibilityRole="adjustable" accessibilityLabel={label} accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}>
          <Canvas style={{ width: size, height: size }}>
            <Circle cx={size / 2} cy={size / 2 + 3} r={size / 2 - 4} color="rgba(43,31,26,0.35)" />
            <Circle cx={size / 2} cy={size / 2} r={size / 2 - 4} color={locked ? palette.mint : '#D9C3A0'} />
            {Array.from({ length: 16 }).map((_, i) => {
              const a = (i / 16) * Math.PI * 2 + angle;
              return <Circle key={i} cx={size / 2 + Math.cos(a) * (size / 2 - 10)} cy={size / 2 + Math.sin(a) * (size / 2 - 10)} r={3} color="#B08A5A" />;
            })}
            <Circle cx={size / 2} cy={size / 2} r={size / 2 - 22} color={locked ? palette.mintDeep : palette.woodLight} />
            <Line p1={vec(size / 2, size / 2)} p2={vec(size / 2 + Math.cos(angle - Math.PI / 2) * (size / 2 - 26), size / 2 + Math.sin(angle - Math.PI / 2) * (size / 2 - 26))} color="#FFF6E6" strokeWidth={6} strokeCap="round" />
          </Canvas>
        </View>
      </GestureDetector>
    </View>
  );
});

export const DialTask = memo(function DialTask({ config, tolerance, onDone }: TaskProps & { config: DialConfig }) {
  const clock = useTaskClock();
  const [values, setValues] = useState(config.dials.map((d) => d.start));
  const [locked, setLocked] = useState(config.dials.map(() => false));
  const [active, setActive] = useState(0);
  const holdStart = useRef<number | null>(null);
  const accuracy = useRef<number[]>([]);
  const finished = useRef(false);
  const zone = config.zone * (1 + tolerance);
  const done = locked.every(Boolean);
  const v = values[active];
  const spec = config.dials[active];
  const diff = Math.abs(v - spec.target);
  const inZone = diff <= zone;

  // Holding inside the zone locks the dial.
  useEffect(() => {
    if (done || locked[active]) return;
    if (!inZone) {
      holdStart.current = null;
      return;
    }
    if (holdStart.current === null) holdStart.current = Date.now();
    const t = setTimeout(() => {
      if (holdStart.current !== null && Date.now() - holdStart.current >= config.hold * 1000 - 20) {
        accuracy.current[active] = 1 - Math.min(1, diff / zone) * 0.35;
        setLocked((l) => l.map((x, i) => (i === active ? true : x)));
        playSound('screw');
        haptic('correct');
        holdStart.current = null;
        const next = locked.findIndex((x, i) => !x && i !== active);
        if (next >= 0) setActive(next);
      }
    }, config.hold * 1000);
    return () => clearTimeout(t);
  }, [inZone, active, done, locked, config.hold, diff, zone]);

  useEffect(() => {
    if (done && !finished.current) {
      finished.current = true;
      playSound(config.display === 'tuner' ? 'note' : config.display === 'radio' ? 'powerOn' : 'repair');
      haptic('complete');
      const acc = accuracy.current.reduce((a, b) => a + b, 0) / Math.max(1, accuracy.current.length);
      finishSoon(onDone, { accuracy: acc, seconds: clock(), mistakes: 0 });
    }
  }, [done, onDone, clock, config.display]);

  const setValue = (nv: number) => setValues((vals) => vals.map((x, i) => (i === active ? nv : x)));
  const nudge = (d: number) => setValue(Math.max(0, Math.min(1, v + d)));

  const W = 320;
  const display = () => {
    if (config.display === 'radio') {
      const freq = (88 + v * 20).toFixed(1);
      return (
        <View style={styles.displayBox}>
          <Canvas style={{ width: W, height: 86 }}>
            <RoundedRect x={4} y={4} width={W - 8} height={78} r={10} color="#2B1F1A" />
            <RoundedRect x={12} y={12} width={W - 24} height={50} r={6} color={inZone ? '#FFE9A8' : '#E8D9B8'} />
            <Rect x={12 + (spec.target - zone) * (W - 24)} y={12} width={zone * 2 * (W - 24)} height={50} color="rgba(127,211,180,0.55)" />
            {Array.from({ length: 21 }).map((_, i) => (
              <Line key={i} p1={vec(12 + (i / 20) * (W - 24), 14)} p2={vec(12 + (i / 20) * (W - 24), i % 5 === 0 ? 30 : 22)} color="#5B3A26" strokeWidth={1.5} />
            ))}
            <Line p1={vec(12 + v * (W - 24), 12)} p2={vec(12 + v * (W - 24), 62)} color={palette.coralDeep} strokeWidth={3} />
            {/* Static: noisy wave far from the station, clean sine near it */}
            <Path
              path={(() => {
                const b = Skia.PathBuilder.Make().moveTo(16, 72);
                for (let x = 16; x <= W - 16; x += 4) b.lineTo(x, 72 + Math.sin(x / 6) * 4 * (1 - Math.min(1, diff * 4)) + (Math.random() - 0.5) * 8 * Math.min(1, diff * 5));
                return b.build();
              })()}
              style="stroke"
              strokeWidth={1.5}
              color="#7FD3B4"
            />
          </Canvas>
          <AppText variant="number" center>
            FM {freq} {inZone ? '· station found!' : ''}
          </AppText>
        </View>
      );
    }
    if (config.display === 'tuner') {
      const cents = Math.round((v - spec.target) * 200);
      const a = Math.max(-1, Math.min(1, (v - spec.target) * 4)) * 1.1;
      return (
        <View style={styles.displayBox}>
          <Canvas style={{ width: 220, height: 120 }}>
            <Path path={Skia.Path.MakeFromSVGString('M20 110 A 90 90 0 0 1 200 110') ?? Skia.PathBuilder.Make().build()} style="stroke" strokeWidth={14} color="#E8D9B8" />
            <Path path={Skia.Path.MakeFromSVGString(`M${110 - Math.sin(zone * 4 * 1.1) * 90} ${110 - Math.cos(zone * 4 * 1.1) * 90} A 90 90 0 0 1 ${110 + Math.sin(zone * 4 * 1.1) * 90} ${110 - Math.cos(zone * 4 * 1.1) * 90}`) ?? Skia.PathBuilder.Make().build()} style="stroke" strokeWidth={14} color={palette.mint} />
            <Line p1={vec(110, 110)} p2={vec(110 + Math.sin(a) * 84, 110 - Math.cos(a) * 84)} color={inZone ? palette.mintDeep : palette.coralDeep} strokeWidth={4} strokeCap="round" />
            <Circle cx={110} cy={110} r={8} color="#2B1F1A" />
          </Canvas>
          <AppText variant="number" center>
            {spec.label}: {cents === 0 ? 'in tune' : cents > 0 ? `+${cents} sharp` : `${cents} flat`}
          </AppText>
        </View>
      );
    }
    // Focus ring: the ring's mark must line up with the fixed arrow.
    const rot = (v - spec.target) * Math.PI * 2;
    return (
      <View style={styles.displayBox}>
        <Canvas style={{ width: 170, height: 170 }}>
          <Circle cx={85} cy={92} r={70} color="#3B3B45" />
          <Circle cx={85} cy={92} r={52} color="#1F2A44" />
          <Circle cx={85} cy={92} r={30} color="#5A7AA8" />
          <Group transform={[{ translateX: 85 }, { translateY: 92 }, { rotate: rot }, { translateX: -85 }, { translateY: -92 }]}>
            {Array.from({ length: 24 }).map((_, i) => {
              const a = (i / 24) * Math.PI * 2;
              return <Line key={i} p1={vec(85 + Math.sin(a) * 58, 92 - Math.cos(a) * 58)} p2={vec(85 + Math.sin(a) * 68, 92 - Math.cos(a) * 68)} color="#B9B5AA" strokeWidth={2} />;
            })}
            <Path path={Skia.Path.MakeFromSVGString('M85 22 L78 36 L92 36 Z') ?? Skia.PathBuilder.Make().build()} color={palette.mustard} />
          </Group>
          <Path path={Skia.Path.MakeFromSVGString('M85 2 L76 16 L94 16 Z') ?? Skia.PathBuilder.Make().build()} color={inZone ? palette.mint : palette.coral} />
        </Canvas>
        <AppText variant="label" center>
          {spec.label}: {inZone ? 'aligned' : 'turn to line up the yellow mark'}
        </AppText>
      </View>
    );
  };

  const status = config.dials.length > 1 ? `${locked.filter(Boolean).length} of ${config.dials.length} done` : inZone ? 'Hold it there…' : 'Turn the knob';

  return (
    <TaskShell title={config.title} help={config.help} status={status} solved={done}>
      <View style={styles.field}>
        {config.dials.length > 1 ? (
          <View style={styles.tabs}>
            {config.dials.map((d, i) => (
              <Pressable key={i} accessibilityRole="button" accessibilityLabel={`${d.label}${locked[i] ? ', done' : ''}`} onPress={() => !locked[i] && setActive(i)} style={[styles.tab, { backgroundColor: locked[i] ? palette.mint : i === active ? palette.mustard : '#EDE3D2' }]}>
                {locked[i] ? <MaterialCommunityIcons name="check" size={16} color="#0E3A2C" /> : null}
                <AppText variant="label">{d.label}</AppText>
              </Pressable>
            ))}
          </View>
        ) : null}
        {display()}
        <View style={styles.controls}>
          <Pressable accessibilityRole="button" accessibilityLabel="Turn left a little" onPress={() => nudge(-0.02)} style={styles.nudge}>
            <MaterialCommunityIcons name="rotate-left" size={26} color="#1F2A44" />
          </Pressable>
          <Knob value={v} onChange={setValue} locked={locked[active]} label={`${spec.label} knob`} />
          <Pressable accessibilityRole="button" accessibilityLabel="Turn right a little" onPress={() => nudge(0.02)} style={styles.nudge}>
            <MaterialCommunityIcons name="rotate-right" size={26} color="#1F2A44" />
          </Pressable>
        </View>
      </View>
    </TaskShell>
  );
});

const styles = StyleSheet.create({
  field: { padding: 12, alignItems: 'center', backgroundColor: '#F4E3C3', gap: 10 },
  displayBox: { alignItems: 'center', gap: 4 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  nudge: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#EDE3D2', alignItems: 'center', justifyContent: 'center' },
  knobWrap: { alignItems: 'center' },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, minHeight: 40, borderRadius: 20 },
});

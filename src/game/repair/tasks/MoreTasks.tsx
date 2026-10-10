import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Canvas, Circle, Group, Line, Oval, Path, Rect, RoundedRect, Skia, vec } from '@shopify/react-native-skia';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { ProgressBar } from '@/components/ProgressBar';
import { CleaningEngine } from '@/game/cleaning/CleaningEngine';
import { playSound } from '@/services/audio';
import { haptic } from '@/services/haptics';
import { palette } from '@/theme';
import { createRng } from '@/utils/dateSeed';
import { finishSoon, TaskShell, useTaskClock, type TaskProps } from './TaskShell';

type Glyph = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
const EMPTY = Skia.PathBuilder.Make().build();
const P = (svg: string) => Skia.Path.MakeFromSVGString(svg) ?? EMPTY;

/** Shared "finish once" helper. */
function useFinish(onDone: TaskProps['onDone'], clock: () => number) {
  const finished = useRef(false);
  // Stable across renders so effects that depend on it do not restart.
  return useCallback(
    (accuracy: number, mistakes: number, sound: Parameters<typeof playSound>[0] = 'repair') => {
      if (finished.current) return;
      finished.current = true;
      playSound(sound);
      haptic('complete');
      finishSoon(onDone, { accuracy: Math.max(0.3, Math.min(1, accuracy)), seconds: clock(), mistakes });
    },
    [onDone, clock],
  );
}

// ───────────────────────────── Pump (bicycle tyre) ─────────────────────────────

export const PumpTask = memo(function PumpTask({ tolerance, onDone, difficulty }: TaskProps & { title?: string }) {
  const clock = useTaskClock();
  const finish = useFinish(onDone, clock);
  const [pressure, setPressure] = useState(0.08);
  const [mistakes, setMistakes] = useState(0);
  const [handle, setHandle] = useState(0);
  const [solved, setSolved] = useState(false);
  // Gesture-side state (written from gesture callbacks, not used for rendering).
  const last = useSharedValue(0);
  const lo = 0.62 - tolerance * 0.1;
  const hi = 0.78 + tolerance * 0.1;
  const perStroke = difficulty === 'easy' ? 0.07 : 0.055;
  // A slow leak keeps it from being pure mashing.
  useEffect(() => {
    if (solved) return;
    const t = setInterval(() => setPressure((p) => Math.max(0, p - 0.002)), 200);
    return () => clearInterval(t);
  }, [solved]);
  const inZone = pressure >= lo && pressure <= hi;
  // Solved once the needle stays in the green for a moment (leaving the zone restarts the wait).
  useEffect(() => {
    if (!inZone || solved) return;
    const t = setTimeout(() => {
      setSolved(true);
      finish(0.95 - mistakes * 0.08, mistakes);
    }, 700);
    return () => clearTimeout(t);
  }, [inZone, solved, mistakes, finish]);
  const stroke = () => {
    playSound('pump', { volume: 0.6 });
    haptic('tap');
    let next = pressure + perStroke;
    if (next > 1) {
      setMistakes((m) => m + 1);
      playSound('error', { volume: 0.4 });
      next = 0.82;
    }
    setPressure(next);
  };
  const pan = Gesture.Pan()
    .runOnJS(true)
    .onBegin(() => {
      last.value = 0;
    })
    .onUpdate((e) => {
      const h = Math.max(0, Math.min(1, -e.translationY / 120));
      setHandle(h);
      // One stroke = pull up, then push down.
      if (h > 0.7) last.value = 1;
      if (h < 0.2 && last.value === 1) {
        last.value = 0;
        stroke();
      }
    })
    .onEnd(() => setHandle(0));
  return (
    <TaskShell title="Pump the tyre" help="Swipe up and down on the pump (or tap Pump). Stop when the needle is in the green." status={inZone ? 'Perfect pressure – stop pumping!' : pressure > hi ? 'Too much! Let some out.' : 'Keep pumping'} solved={solved}>
      <View style={styles.pumpField}>
        <GestureDetector gesture={pan}>
          <View style={styles.pump} accessible accessibilityLabel="Pump handle">
            <Canvas style={{ width: 110, height: 230 }}>
              <RoundedRect x={38} y={70} width={34} height={140} r={8} color={palette.coral} />
              <Rect x={52} y={70 - handle * 60} width={6} height={70} color="#8A8478" />
              <RoundedRect x={24} y={60 - handle * 60} width={62} height={14} r={7} color="#2B2A33" />
              <RoundedRect x={20} y={206} width={70} height={14} r={6} color="#5C5A56" />
              <Path path={P('M72 196 C 100 200, 104 226, 96 230')} style="stroke" strokeWidth={5} color="#2B2A33" />
            </Canvas>
          </View>
        </GestureDetector>
        <View style={styles.gaugeCol}>
          <Canvas style={{ width: 150, height: 150 }}>
            <Circle cx={75} cy={75} r={70} color="#FFF6E6" />
            <Circle cx={75} cy={75} r={70} style="stroke" strokeWidth={6} color="#2B2A33" />
            <Path path={P(`M${75 + Math.cos(Math.PI * (0.75 + 1.5 * lo)) * 58} ${75 + Math.sin(Math.PI * (0.75 + 1.5 * lo)) * 58} A 58 58 0 0 1 ${75 + Math.cos(Math.PI * (0.75 + 1.5 * hi)) * 58} ${75 + Math.sin(Math.PI * (0.75 + 1.5 * hi)) * 58}`)} style="stroke" strokeWidth={10} color={palette.mint} />
            <Line p1={vec(75, 75)} p2={vec(75 + Math.cos(Math.PI * (0.75 + 1.5 * pressure)) * 56, 75 + Math.sin(Math.PI * (0.75 + 1.5 * pressure)) * 56)} color={inZone ? palette.mintDeep : palette.coralDeep} strokeWidth={4} strokeCap="round" />
            <Circle cx={75} cy={75} r={7} color="#2B2A33" />
          </Canvas>
          <AppText variant="number" center accessibilityLiveRegion="polite">
            {Math.round(pressure * 60)} psi
          </AppText>
          <View style={styles.rowBtns}>
            <Button label="Pump" size="sm" icon="arrow-up-down" onPress={stroke} silent />
            <Button label="Let out" size="sm" variant="secondary" onPress={() => {
                const n = Math.max(0, pressure - 0.06);
                setPressure(n);
              }} silent />
          </View>
        </View>
      </View>
    </TaskShell>
  );
});

// ───────────────────────────── Timing (flash test, generic) ─────────────────────────────

export interface TimingConfig {
  title: string;
  help: string;
  /** Successful taps needed. */
  hits: number;
  label: string;
  icon: Glyph;
  speed: number;
}

export const TimingTask = memo(function TimingTask({ config, tolerance, onDone, reduceMotion }: TaskProps & { config: TimingConfig }) {
  const clock = useTaskClock();
  const finish = useFinish(onDone, clock);
  const [t, setT] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [flash, setFlash] = useState(false);
  const accs = useRef<number[]>([]);
  const zoneHalf = 0.09 + tolerance * 0.08;
  const speed = config.speed * (reduceMotion ? 0.6 : 1);
  useEffect(() => {
    if (hits >= config.hits) return;
    const start = Date.now();
    const id = setInterval(() => setT(((Date.now() - start) / 1000) * speed), 33);
    return () => clearInterval(id);
  }, [hits, config.hits, speed]);
  const pos = (Math.sin(t * Math.PI) + 1) / 2;
  const target = 0.5;
  const tap = () => {
    if (hits >= config.hits) return;
    const d = Math.abs(pos - target);
    if (d <= zoneHalf) {
      accs.current.push(1 - d / zoneHalf / 3);
      setFlash(true);
      setTimeout(() => setFlash(false), 180);
      playSound(config.icon === 'flash' ? 'shutter' : 'wire');
      haptic('correct');
      const n = hits + 1;
      setHits(n);
      if (n >= config.hits) finish(accs.current.reduce((a, b) => a + b, 0) / accs.current.length - misses * 0.06, misses);
    } else {
      setMisses((m) => m + 1);
      playSound('error', { volume: 0.4 });
      haptic('error');
    }
  };
  return (
    <TaskShell title={config.title} help={config.help} status={`${hits} of ${config.hits}${misses ? ` · ${misses} early/late` : ''}`} solved={hits >= config.hits}>
      <Pressable onPress={tap} accessibilityRole="button" accessibilityLabel={`${config.label}. Needle is ${Math.abs(pos - target) <= zoneHalf ? 'in the green zone, tap now' : 'outside the green zone'}`} style={[styles.timingField, flash && { backgroundColor: '#FFF6C8' }]}>
        <Canvas style={{ width: 300, height: 90 }}>
          <RoundedRect x={10} y={30} width={280} height={30} r={15} color="#EDE3D2" />
          <RoundedRect x={10 + (target - zoneHalf) * 280} y={30} width={zoneHalf * 2 * 280} height={30} r={8} color={palette.mint} />
          <RoundedRect x={10 + pos * 280 - 4} y={18} width={8} height={54} r={4} color={palette.coralDeep} />
        </Canvas>
        <MaterialCommunityIcons name={config.icon} size={44} color={flash ? palette.mustardDeep : '#1F2A44'} />
        <AppText variant="bodyStrong">{config.label}</AppText>
      </Pressable>
    </TaskShell>
  );
});

// ───────────────────────────── Memory (robot symbols) ─────────────────────────────

const SYMBOLS: Glyph[] = ['star', 'heart', 'lightning-bolt', 'music-note', 'flower', 'atom'];

export const MemoryTask = memo(function MemoryTask({ onDone, difficulty }: TaskProps) {
  const clock = useTaskClock();
  const finish = useFinish(onDone, clock);
  const pairs = difficulty === 'advanced' ? 6 : 4;
  const cards = useMemo(() => {
    const rng = createRng(pairs * 31 + 7);
    const list = SYMBOLS.slice(0, pairs).flatMap((s, i) => [
      { key: `${i}a`, sym: s },
      { key: `${i}b`, sym: s },
    ]);
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }, [pairs]);
  const [open, setOpen] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [misses, setMisses] = useState(0);
  const flip = (i: number) => {
    if (open.length === 2 || open.includes(i) || matched.includes(i)) return;
    haptic('tick');
    const next = [...open, i];
    setOpen(next);
    if (next.length === 2) {
      const [a, b] = next;
      if (cards[a].sym === cards[b].sym) {
        playSound('wire');
        haptic('correct');
        const m = [...matched, a, b];
        setTimeout(() => {
          setMatched(m);
          setOpen([]);
          if (m.length === cards.length) finish(1 - Math.max(0, misses - pairs) * 0.06, Math.max(0, misses - pairs));
        }, 300);
      } else {
        setMisses((x) => x + 1);
        setTimeout(() => setOpen([]), 700);
      }
    }
  };
  const cols = pairs === 6 ? 4 : 4;
  return (
    <TaskShell title="Restore the memory" help="Flip two tiles at a time and match the symbol pairs." status={`${matched.length / 2} of ${pairs} pairs`} solved={matched.length === cards.length}>
      <View style={[styles.memField, { backgroundColor: '#1F2A44' }]}>
        {cards.map((c, i) => {
          const shown = open.includes(i) || matched.includes(i);
          return (
            <Pressable key={c.key} onPress={() => flip(i)} accessibilityRole="button" accessibilityLabel={shown ? `Tile showing ${c.sym}` : `Hidden tile ${i + 1}`} style={[styles.tile, { width: `${100 / cols - 4}%`, backgroundColor: matched.includes(i) ? palette.mint : shown ? '#FFF6E6' : '#3A4766' }]}>
              {shown ? <MaterialCommunityIcons name={c.sym} size={30} color="#1F2A44" /> : <MaterialCommunityIcons name="chip" size={24} color="#7CC6F2" />}
            </Pressable>
          );
        })}
      </View>
    </TaskShell>
  );
});

// ───────────────────────────── Dead pixels (arcade screen) ─────────────────────────────

export const PixelsTask = memo(function PixelsTask({ onDone, difficulty }: TaskProps) {
  const clock = useTaskClock();
  const finish = useFinish(onDone, clock);
  const cols = 8;
  const rows = 6;
  const dead = useMemo(() => {
    const rng = createRng(99 + rows);
    const n = difficulty === 'advanced' ? 7 : 5;
    const set = new Set<number>();
    while (set.size < n) set.add(Math.floor(rng() * cols * rows));
    return set;
  }, [difficulty]);
  const [fixed, setFixed] = useState<number[]>([]);
  const [wrong, setWrong] = useState(0);
  const tap = (i: number) => {
    if (dead.has(i)) {
      if (fixed.includes(i)) return;
      playSound('wire', { volume: 0.6 });
      haptic('correct');
      const f = [...fixed, i];
      setFixed(f);
      if (f.length === dead.size) finish(1 - wrong * 0.05, wrong, 'powerOn');
    } else {
      setWrong((w) => w + 1);
      haptic('tick');
    }
  };
  return (
    <TaskShell title="Fix the screen" help="Tap every black, dead pixel to wake it up." status={`${fixed.length} of ${dead.size} pixels fixed`} solved={fixed.length === dead.size}>
      <View style={styles.screenField}>
        <View style={styles.screen}>
          {Array.from({ length: cols * rows }).map((_, i) => {
            const isDead = dead.has(i) && !fixed.includes(i);
            const hue = ['#2F86C4', '#3A98D4', '#2F7FB8', '#3590CC'][(i * 7) % 4];
            return (
              <Pressable key={i} onPress={() => tap(i)} accessibilityRole="button" accessibilityLabel={isDead ? 'Dead pixel' : 'Working pixel'} style={[styles.pixel, { backgroundColor: isDead ? '#000' : fixed.includes(i) ? '#7FD3B4' : hue, width: `${100 / cols}%`, height: `${100 / rows}%` }]} />
            );
          })}
        </View>
      </View>
    </TaskShell>
  );
});

// ───────────────────────────── Joystick (swipe the arrows) ─────────────────────────────

type Dir = 'up' | 'down' | 'left' | 'right';
const DIR_ICON: Record<Dir, Glyph> = { up: 'arrow-up-bold', down: 'arrow-down-bold', left: 'arrow-left-bold', right: 'arrow-right-bold' };

export const JoystickTask = memo(function JoystickTask({ onDone, difficulty }: TaskProps) {
  const clock = useTaskClock();
  const finish = useFinish(onDone, clock);
  const seq = useMemo<Dir[]>(() => {
    const rng = createRng(5);
    const dirs: Dir[] = ['up', 'down', 'left', 'right'];
    return Array.from({ length: difficulty === 'advanced' ? 8 : 6 }, () => dirs[Math.floor(rng() * 4)]);
  }, [difficulty]);
  const [i, setI] = useState(0);
  const [miss, setMiss] = useState(0);
  const [stick, setStick] = useState({ x: 0, y: 0 });
  const input = (d: Dir) => {
    if (i >= seq.length) return;
    if (d === seq[i]) {
      haptic('tick');
      playSound('tap', { volume: 0.5 });
      const n = i + 1;
      setI(n);
      if (n === seq.length) finish(1 - miss * 0.07, miss, 'powerOn');
    } else {
      setMiss((m) => m + 1);
      haptic('error');
    }
  };
  const pan = Gesture.Pan()
    .runOnJS(true)
    .onUpdate((e) => setStick({ x: Math.max(-30, Math.min(30, e.translationX / 2)), y: Math.max(-30, Math.min(30, e.translationY / 2)) }))
    .onEnd((e) => {
      setStick({ x: 0, y: 0 });
      const ax = Math.abs(e.translationX);
      const ay = Math.abs(e.translationY);
      if (Math.max(ax, ay) < 24) return;
      input(ax > ay ? (e.translationX > 0 ? 'right' : 'left') : e.translationY > 0 ? 'down' : 'up');
    });
  return (
    <TaskShell title="Test the joystick" help="Swipe the stick in the direction of each glowing arrow." status={`${i} of ${seq.length}`} solved={i >= seq.length}>
      <View style={styles.joyField}>
        <View style={styles.arrows}>
          {seq.map((d, k) => (
            <View key={k} style={[styles.arrow, { backgroundColor: k < i ? palette.mint : k === i ? palette.mustard : '#3A4766' }]}>
              <MaterialCommunityIcons name={DIR_ICON[d]} size={20} color={k <= i ? '#1F2A44' : '#B9C4DA'} />
            </View>
          ))}
        </View>
        <GestureDetector gesture={pan}>
          <View style={styles.stickPad} accessible accessibilityLabel={`Joystick. Next direction: ${seq[i] ?? 'done'}`}>
            <Canvas style={{ width: 160, height: 160 }}>
              <Circle cx={80} cy={80} r={64} color="#2B2A33" />
              <Line p1={vec(80, 80)} p2={vec(80 + stick.x, 80 + stick.y)} color="#5C5A56" strokeWidth={10} strokeCap="round" />
              <Circle cx={80 + stick.x} cy={80 + stick.y} r={22} color={palette.coral} />
            </Canvas>
          </View>
        </GestureDetector>
        <View style={styles.dpad}>
          {(['up', 'left', 'right', 'down'] as Dir[]).map((d) => (
            <Pressable key={d} onPress={() => input(d)} accessibilityRole="button" accessibilityLabel={`Push ${d}`} style={styles.dbtn}>
              <MaterialCommunityIcons name={DIR_ICON[d]} size={22} color="#1F2A44" />
            </Pressable>
          ))}
        </View>
      </View>
    </TaskShell>
  );
});

// ───────────────────────────── Lens polishing (rub in circles) ─────────────────────────────

export const LensTask = memo(function LensTask({ onDone, tolerance }: TaskProps) {
  const clock = useTaskClock();
  const finish = useFinish(onDone, clock);
  const engine = useMemo(() => new CleaningEngine({ cols: 20, rows: 20, seed: 11, amount: 0.75, kind: 'grease', mask: (u, v) => Math.hypot(u - 0.5, v - 0.5) < 0.46 }), []);
  const [, setV] = useState(0);
  const [size, setSize] = useState(0);
  const [solved, setSolved] = useState(false);
  const pan = Gesture.Pan()
    .runOnJS(true)
    .minDistance(0)
    .onUpdate((e) => {
      if (!size || solved) return;
      engine.scrub(e.x / size, e.y / size, 0.13 * (1 + tolerance), 0.22);
      setV(engine.version);
      if (engine.version % 6 === 0) playSound('clean', { volume: 0.3 });
      if (engine.coverage >= 0.96) {
        engine.finish();
        setSolved(true);
        finish(1, 0, 'sparkle');
      }
    });
  const specks = [];
  if (size) {
    for (let r = 0; r < engine.rows; r++)
      for (let c = 0; c < engine.cols; c++) {
        const d = engine.dirt[r * engine.cols + c];
        if (d > 0) specks.push(<Circle key={`${r}-${c}`} cx={((c + 0.5) / engine.cols) * size} cy={((r + 0.5) / engine.rows) * size} r={(size / engine.cols) * (0.45 + d * 0.5)} color={`rgba(190,180,150,${0.35 + d * 0.5})`} />);
      }
  }
  return (
    <TaskShell title="Polish the lens" help="Rub the lens in small circles until every smudge and scratch is gone." status={`${Math.round(engine.coverage * 100)}% polished`} solved={solved}>
      <View style={styles.lensField}>
        <GestureDetector gesture={pan}>
          <View style={styles.lensBox} onLayout={(e: LayoutChangeEvent) => setSize(e.nativeEvent.layout.width)} accessible accessibilityLabel={`Lens, ${Math.round(engine.coverage * 100)} percent polished`}>
            {size ? (
              <Canvas style={{ width: size, height: size }}>
                <Circle cx={size / 2} cy={size / 2} r={size / 2} color="#3B3B45" />
                <Circle cx={size / 2} cy={size / 2} r={size * 0.46} color="#1F2A44" />
                <Circle cx={size / 2} cy={size / 2} r={size * 0.3} color="#2F4A78" />
                <Oval x={size * 0.3} y={size * 0.25} width={size * 0.18} height={size * 0.12} color="rgba(255,255,255,0.45)" />
                <Group>{specks}</Group>
              </Canvas>
            ) : null}
          </View>
        </GestureDetector>
        <ProgressBar value={engine.coverage} color={palette.sky} label="Polish" showPercent />
      </View>
    </TaskShell>
  );
});

// ───────────────────────────── Cooling (robot core) ─────────────────────────────

export const CoolingTask = memo(function CoolingTask({ onDone, tolerance }: TaskProps) {
  const clock = useTaskClock();
  const finish = useFinish(onDone, clock);
  const [temp, setTemp] = useState(0.9);
  const [fan, setFan] = useState(false);
  const [inTime, setInTime] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [solved, setSolved] = useState(false);
  const lo = 0.35 - tolerance * 0.1;
  const hi = 0.55 + tolerance * 0.1;
  const need = 3;
  useEffect(() => {
    if (solved) return;
    const id = setInterval(() => {
      setTemp((t) => {
        const next = Math.max(0, Math.min(1, t + (fan ? -0.035 : 0.022)));
        if (next <= 0.05 && t > 0.05) {
          setMistakes((m) => m + 1);
          playSound('error', { volume: 0.4 });
        }
        return next;
      });
    }, 100);
    return () => clearInterval(id);
  }, [fan, solved]);
  useEffect(() => {
    if (solved) return;
    if (temp >= lo && temp <= hi) {
      const id = setTimeout(() => {
        const next = inTime + 0.1;
        setInTime(next);
        if (next >= need) {
          setSolved(true);
          finish(1 - mistakes * 0.1, mistakes, 'powerOn');
        }
      }, 100);
      return () => clearTimeout(id);
    }
  }, [temp, inTime, lo, hi, solved, mistakes, finish]);
  const inZone = temp >= lo && temp <= hi;
  return (
    <TaskShell title="Cool the core" help="Hold the fan button to cool the core. Keep it in the green zone for 3 seconds. Don’t overcool!" status={`Stable for ${Math.min(need, inTime).toFixed(1)} of ${need} s`} solved={solved}>
      <View style={styles.coolField}>
        <Canvas style={{ width: 90, height: 220 }}>
          <RoundedRect x={30} y={10} width={30} height={180} r={15} color="#EDE3D2" />
          <Rect x={30} y={10 + (1 - hi) * 180} width={30} height={(hi - lo) * 180} color={palette.mint} />
          <RoundedRect x={34} y={10 + (1 - temp) * 180} width={22} height={temp * 180 - 4} r={11} color={temp > hi ? palette.coral : temp < lo ? palette.sky : palette.mintDeep} />
          <Circle cx={45} cy={196} r={20} color={temp > hi ? palette.coral : temp < lo ? palette.sky : palette.mintDeep} />
        </Canvas>
        <View style={styles.coolRight}>
          <AppText variant="number">{Math.round(30 + temp * 70)}°C</AppText>
          <AppText variant="caption" muted>
            {inZone ? 'Just right' : temp > hi ? 'Too hot' : 'Too cold'}
          </AppText>
          <Pressable
            onPressIn={() => {
              setFan(true);
              haptic('tap');
            }}
            onPressOut={() => setFan(false)}
            accessibilityRole="button"
            accessibilityLabel="Hold to run the fan"
            style={[styles.fanBtn, { backgroundColor: fan ? palette.sky : '#EDE3D2' }]}
          >
            <MaterialCommunityIcons name="fan" size={48} color="#1F2A44" />
            <AppText variant="label">Hold for fan</AppText>
          </Pressable>
        </View>
      </View>
    </TaskShell>
  );
});

// ───────────────────────────── Wheel truing (drag to align) ─────────────────────────────

export const WheelTask = memo(function WheelTask({ onDone, tolerance }: TaskProps) {
  const clock = useTaskClock();
  const finish = useFinish(onDone, clock);
  const [offset, setOffset] = useState(46);
  const [solved, setSolved] = useState(false);
  const [tries, setTries] = useState(0);
  const base = useSharedValue(46);
  const zone = 5 + tolerance * 8;
  const pan = Gesture.Pan()
    .runOnJS(true)
    .onBegin(() => {
      base.value = offset;
    })
    .onUpdate((e) => setOffset(Math.max(-70, Math.min(70, base.value + e.translationX * 0.6))))
    .onEnd(() => {
      setOffset((o) => {
        if (Math.abs(o) <= zone && !solved) {
          setSolved(true);
          finish(1 - Math.abs(o) / zone / 4 - tries * 0.08, tries, 'tool');
        } else {
          setTries((t) => t + 1);
          haptic('tick');
        }
        return o;
      });
    });
  return (
    <TaskShell title="True the wheel" help="Drag the wheel sideways until the rim lines up with the green guide, then let go." status={Math.abs(offset) <= zone ? 'Aligned – let go!' : `${Math.round(Math.abs(offset))} mm off`} solved={solved}>
      <GestureDetector gesture={pan}>
        <View style={styles.wheelField} accessible accessibilityRole="adjustable" accessibilityLabel={`Wheel, ${Math.round(Math.abs(offset))} millimetres off centre`}>
          <Canvas style={{ width: 300, height: 220 }}>
            <Rect x={150 - zone} y={0} width={zone * 2} height={220} color="rgba(127,211,180,0.45)" />
            <Line p1={vec(150, 0)} p2={vec(150, 220)} color={palette.mintDeep} strokeWidth={2} />
            <Oval x={150 + offset - 18} y={20} width={36} height={180} style="stroke" strokeWidth={10} color="#2E2B2A" />
            <Oval x={150 + offset - 10} y={30} width={20} height={160} style="stroke" strokeWidth={2} color="#B9B5AA" />
            <Circle cx={150 + offset} cy={110} r={8} color="#8A8478" />
          </Canvas>
        </View>
      </GestureDetector>
      <View style={styles.rowBtns}>
        <Button label="◀ Nudge" size="sm" variant="secondary" onPress={() => setOffset((o) => o - 3)} silent />
        <Button label="Check" size="sm" onPress={() => (Math.abs(offset) <= zone ? (setSolved(true), finish(1 - Math.abs(offset) / zone / 4 - tries * 0.08, tries, 'tool')) : setTries((t) => t + 1))} />
        <Button label="Nudge ▶" size="sm" variant="secondary" onPress={() => setOffset((o) => o + 3)} silent />
      </View>
    </TaskShell>
  );
});

const styles = StyleSheet.create({
  pumpField: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', padding: 12, backgroundColor: '#F4E3C3' },
  pump: { width: 110, height: 230 },
  gaugeCol: { alignItems: 'center', gap: 6 },
  rowBtns: { flexDirection: 'row', gap: 8, justifyContent: 'center', padding: 8 },
  timingField: { alignItems: 'center', padding: 16, gap: 6, backgroundColor: '#F4E3C3', minHeight: 220, justifyContent: 'center' },
  memField: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 12, justifyContent: 'center' },
  tile: { aspectRatio: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  screenField: { padding: 14, backgroundColor: '#2B2A33', alignItems: 'center' },
  screen: { width: '100%', aspectRatio: 4 / 3, flexDirection: 'row', flexWrap: 'wrap', borderRadius: 8, overflow: 'hidden', borderWidth: 6, borderColor: '#141414' },
  pixel: { borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.25)' },
  joyField: { alignItems: 'center', padding: 12, gap: 10, backgroundColor: '#1F2A44' },
  arrows: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  arrow: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  stickPad: { width: 160, height: 160 },
  dpad: { flexDirection: 'row', gap: 8 },
  dbtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#EDE3D2', alignItems: 'center', justifyContent: 'center' },
  lensField: { padding: 16, gap: 12, backgroundColor: '#F4E3C3' },
  lensBox: { width: '78%', aspectRatio: 1, alignSelf: 'center' },
  coolField: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', padding: 12, backgroundColor: '#F4E3C3' },
  coolRight: { alignItems: 'center', gap: 6 },
  fanBtn: { width: 140, height: 120, borderRadius: 22, alignItems: 'center', justifyContent: 'center', gap: 4 },
  wheelField: { alignItems: 'center', backgroundColor: '#F4E3C3', padding: 8 },
});

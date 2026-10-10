import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Canvas, Circle, Path, Skia } from '@shopify/react-native-skia';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { AppText } from '@/components/AppText';
import { ProgressBar } from '@/components/ProgressBar';
import { playSound } from '@/services/audio';
import { haptic } from '@/services/haptics';
import { palette } from '@/theme';
import { createRng } from '@/utils/dateSeed';
import { finishSoon, TaskShell, useTaskClock, type TaskProps } from './TaskShell';

const PAIRS = [
  { color: '#EE6352', icon: 'circle' as const, name: 'red circle' },
  { color: '#2F86C4', icon: 'triangle' as const, name: 'blue triangle' },
  { color: '#F2C14E', icon: 'square' as const, name: 'yellow square' },
  { color: '#2E9C7A', icon: 'star' as const, name: 'green star' },
  { color: '#9B6BD6', icon: 'rhombus' as const, name: 'purple diamond' },
];

export interface ConnectConfig {
  title: string;
  help: string;
  /** Pairs to connect (1..5). */
  pairs: number;
  style: 'wire' | 'circuit' | 'plug';
  /** Robot circuits get hot while you work; too hot costs a mistake. */
  heat?: boolean;
  leftLabel: string;
  rightLabel: string;
  seed: number;
}

const H = 300;
const NODE = 46;

export const ConnectTask = memo(function ConnectTask({ config, tolerance, onDone, reduceMotion }: TaskProps & { config: ConnectConfig }) {
  const clock = useTaskClock();
  const [width, setWidth] = useState(0);
  const order = useMemo(() => {
    const rng = createRng(config.seed);
    const ids = Array.from({ length: config.pairs }, (_, i) => i);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    // Never leave every node straight across from its twin.
    if (ids.every((v, i) => v === i) && ids.length > 1) ids.push(ids.shift() as number);
    return ids;
  }, [config.seed, config.pairs]);
  const [connected, setConnected] = useState<number[]>([]);
  const [drag, setDrag] = useState<{ id: number; x: number; y: number } | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [heat, setHeat] = useState(0);
  const [spark, setSpark] = useState<{ x: number; y: number } | null>(null);
  const done = connected.length === config.pairs;
  const finished = useRef(false);

  const leftX = 44;
  const rightX = Math.max(160, width - 44);
  const yOf = (i: number) => (H / (config.pairs + 1)) * (i + 1);
  const leftPos = (id: number) => ({ x: leftX, y: yOf(id) });
  const rightPos = (id: number) => ({ x: rightX, y: yOf(order.indexOf(id)) });

  useEffect(() => {
    if (!config.heat || done) return;
    const t = setInterval(() => setHeat((h) => Math.min(100, h + 2.2)), 250);
    return () => clearInterval(t);
  }, [config.heat, done]);
  useEffect(() => {
    if (heat >= 100) {
      playSound('error');
      haptic('error');
      setMistakes((m) => m + 1);
      setHeat(55);
    }
  }, [heat]);

  useEffect(() => {
    if (done && !finished.current) {
      finished.current = true;
      playSound('repair');
      haptic('complete');
      finishSoon(onDone, { accuracy: Math.max(0.4, 1 - mistakes * 0.12 - (config.heat ? heat / 400 : 0)), seconds: clock(), mistakes });
    }
  }, [done, mistakes, heat, onDone, clock, config.heat]);

  const attempt = useCallback(
    (id: number, target: number) => {
      if (target === id) {
        setConnected((c) => (c.includes(id) ? c : [...c, id]));
        playSound('wire');
        haptic('correct');
      } else {
        const p = rightPos(target);
        setSpark(p);
        setTimeout(() => setSpark(null), 350);
        setMistakes((m) => m + 1);
        if (config.heat) setHeat((h) => Math.min(100, h + 12));
        playSound('error', { volume: 0.5 });
        haptic('error');
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config.heat, order, width],
  );

  const pan = Gesture.Pan()
    .runOnJS(true)
    .minDistance(4)
    .onBegin((e) => {
      for (let id = 0; id < config.pairs; id++) {
        if (connected.includes(id)) continue;
        const p = leftPos(id);
        if (Math.hypot(e.x - p.x, e.y - p.y) < NODE * 0.8) {
          setDrag({ id, x: e.x, y: e.y });
          haptic('tick');
          return;
        }
      }
    })
    .onUpdate((e) => {
      setDrag((d) => (d ? { ...d, x: e.x, y: e.y } : d));
    })
    .onEnd((e) => {
      setDrag((d) => {
        if (d) {
          let best = -1;
          let bestD = Infinity;
          for (let id = 0; id < config.pairs; id++) {
            if (connected.includes(id)) continue;
            const p = rightPos(id);
            const dist = Math.hypot(e.x - p.x, e.y - p.y);
            if (dist < bestD) {
              best = id;
              bestD = dist;
            }
          }
          if (best >= 0 && bestD < NODE * (1 + tolerance)) attempt(d.id, best);
        }
        return null;
      });
    })
    .onFinalize(() => setDrag(null));

  const wire = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const p = Skia.PathBuilder.Make().moveTo(a.x, a.y).cubicTo((a.x + b.x) / 2, a.y, (a.x + b.x) / 2, b.y, b.x, b.y).build();
    return p;
  };

  const status = `${connected.length} of ${config.pairs} connected${mistakes ? ` · ${mistakes} slip${mistakes > 1 ? 's' : ''}` : ''}`;
  const bg = config.style === 'circuit' ? '#163A30' : config.style === 'plug' ? '#3A3550' : '#4A3A2C';

  return (
    <TaskShell title={config.title} help={config.help} status={status} solved={done}>
      <GestureDetector gesture={pan}>
        <View style={[styles.field, { backgroundColor: bg }]} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)} testID="connect-field">
          {width > 0 ? (
            <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
              {config.style === 'circuit'
                ? Array.from({ length: 8 }).map((_, i) => <Path key={i} path={Skia.Path.MakeFromSVGString(`M0 ${i * 40 + 20} L${width} ${i * 40 + 20}`) ?? Skia.PathBuilder.Make().build()} style="stroke" strokeWidth={1} color="rgba(127,211,180,0.18)" />)
                : null}
              {connected.map((id) => (
                <Path key={id} path={wire(leftPos(id), rightPos(id))} style="stroke" strokeWidth={config.style === 'circuit' ? 5 : 8} color={PAIRS[id].color} strokeCap="round" />
              ))}
              {drag ? <Path path={wire(leftPos(drag.id), drag)} style="stroke" strokeWidth={8} color={PAIRS[drag.id].color} strokeCap="round" /> : null}
              {spark ? <Circle cx={spark.x} cy={spark.y} r={28} color="rgba(255,233,168,0.7)" /> : null}
            </Canvas>
          ) : null}
          <AppText variant="caption" color="#FFF6E6" style={[styles.colLabel, { left: 8 }]}>
            {config.leftLabel}
          </AppText>
          <AppText variant="caption" color="#FFF6E6" style={[styles.colLabel, { right: 8, textAlign: 'right' }]}>
            {config.rightLabel}
          </AppText>
          {Array.from({ length: config.pairs }).map((_, id) => {
            const p = leftPos(id);
            const isDone = connected.includes(id);
            return (
              <Pressable
                key={`l${id}`}
                accessibilityRole="button"
                accessibilityLabel={`${config.leftLabel} ${PAIRS[id].name}${isDone ? ', connected' : selected === id ? ', selected' : ''}`}
                accessibilityHint="Select, then select the matching terminal"
                onPress={() => !isDone && setSelected(id)}
                style={[styles.node, { left: p.x - NODE / 2, top: p.y - NODE / 2, backgroundColor: PAIRS[id].color, borderColor: selected === id ? '#FFF' : '#1F1410' }]}
              >
                <MaterialCommunityIcons name={PAIRS[id].icon} size={22} color="#FFF" />
              </Pressable>
            );
          })}
          {order.map((id) => {
            const p = rightPos(id);
            const isDone = connected.includes(id);
            const hint = tolerance > 0 && drag?.id === id && !reduceMotion;
            return (
              <Pressable
                key={`r${id}`}
                accessibilityRole="button"
                accessibilityLabel={`${config.rightLabel} ${PAIRS[id].name}${isDone ? ', connected' : ''}`}
                onPress={() => {
                  if (selected !== null && !isDone) {
                    attempt(selected, id);
                    setSelected(null);
                  }
                }}
                style={[styles.node, styles.socket, { left: p.x - NODE / 2, top: p.y - NODE / 2, borderColor: PAIRS[id].color, backgroundColor: isDone ? PAIRS[id].color : '#2B2420' }, hint && styles.hint]}
              >
                <MaterialCommunityIcons name={config.style === 'plug' ? 'power-socket-eu' : PAIRS[id].icon} size={22} color={isDone ? '#FFF' : PAIRS[id].color} />
              </Pressable>
            );
          })}
        </View>
      </GestureDetector>
      {config.heat ? (
        <View style={styles.heat}>
          <ProgressBar value={heat / 100} label="Core temperature" color={heat > 75 ? palette.coral : heat > 50 ? palette.mustard : palette.mint} />
        </View>
      ) : null}
    </TaskShell>
  );
});

const styles = StyleSheet.create({
  field: { height: H, width: '100%' },
  colLabel: { position: 'absolute', top: 6, opacity: 0.8 },
  node: { position: 'absolute', width: NODE, height: NODE, borderRadius: NODE / 2, alignItems: 'center', justifyContent: 'center', borderWidth: 3 },
  socket: { borderRadius: 12 },
  hint: { shadowColor: '#FFF', shadowOpacity: 0.9, shadowRadius: 10, elevation: 8 },
  heat: { padding: 12 },
});

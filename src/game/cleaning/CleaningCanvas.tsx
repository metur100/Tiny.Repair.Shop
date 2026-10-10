import { Canvas, Circle, Group, Path, Skia, type SkPath } from '@shopify/react-native-skia';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { ART, ObjectDrawing, silhouette } from '@/art/ObjectArt';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ProgressBar } from '@/components/ProgressBar';
import type { DirtKind, Job } from '@/data/types';
import { playSound } from '@/services/audio';
import { haptic } from '@/services/haptics';
import { palette, spacing } from '@/theme';
import { hashString } from '@/utils/dateSeed';
import { CleaningEngine } from './CleaningEngine';

const COLS = 30;

const DIRT_STYLE: Record<DirtKind, { color: (d: number) => string; name: string; tool: string }> = {
  dust: { color: (d) => `rgba(176,164,140,${0.45 + d * 0.5})`, name: 'dust', tool: 'soft brush' },
  grease: { color: (d) => `rgba(74,56,40,${0.4 + d * 0.55})`, name: 'grease', tool: 'degreaser sponge' },
  rust: { color: (d) => `rgba(170,84,40,${0.45 + d * 0.5})`, name: 'rust', tool: 'wire brush' },
  mud: { color: (d) => `rgba(110,78,48,${0.5 + d * 0.45})`, name: 'mud', tool: 'wet sponge' },
};

interface Sparkle {
  x: number;
  y: number;
  born: number;
}
interface Mote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  born: number;
}

function starPath(cx: number, cy: number, r: number): SkPath {
  const b = Skia.PathBuilder.Make();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const rr = i % 2 === 0 ? r : r * 0.3;
    if (i === 0) b.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    else b.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
  }
  return b.close().build();
}

export interface CleaningResult {
  cleaned: number;
  seconds: number;
}

/**
 * The cleaning mini-game: the dirty object on a Skia canvas; scrubbing removes dirt under the finger
 * (CleaningEngine), with dust particles, sparkles on clean regions and a final shine.
 */
export const CleaningCanvas = memo(function CleaningCanvas({ job, brush, onDone, reduceMotion, maxParticles }: { job: Job; brush: number; onDone: (r: CleaningResult) => void; reduceMotion: boolean; maxParticles: number }) {
  const { width } = useWindowDimensions();
  const size = Math.min(width - spacing.lg * 2 - 8, 380);
  const engine = useMemo(
    () => new CleaningEngine({ cols: COLS, rows: COLS, seed: hashString(job.id), amount: job.dirtAmount, kind: job.dirt, mask: silhouette(job.category, job.variant) }),
    [job],
  );
  const start = useRef(Date.now());
  const [, setVersion] = useState(0);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [motes, setMotes] = useState<Mote[]>([]);
  const [hintSpot, setHintSpot] = useState<{ x: number; y: number } | null>(null);
  const [finished, setFinished] = useState(false);
  const [, tick] = useState(0);
  const lastSound = useRef(0);
  const lastHaptic = useRef(0);
  const style = DIRT_STYLE[job.dirt];
  const radius = 0.075 * brush;
  const coverage = engine.coverage;

  // Animate particles / sparkles while there are any.
  useEffect(() => {
    if (!sparkles.length && !motes.length) return;
    const id = setInterval(() => {
      const now = Date.now();
      setSparkles((s) => s.filter((x) => now - x.born < 700));
      setMotes((m) => m.filter((x) => now - x.born < 500));
      tick((v) => v + 1);
    }, 33);
    return () => clearInterval(id);
  }, [sparkles.length, motes.length]);

  const finish = useCallback(() => {
    if (finished) return;
    setFinished(true);
    engine.finish();
    setVersion(engine.version);
    playSound('sparkle');
    haptic('complete');
    if (!reduceMotion) {
      const now = Date.now();
      setSparkles(Array.from({ length: 10 }, (_, i) => ({ x: size * (0.2 + (i % 5) * 0.15), y: size * (0.3 + Math.floor(i / 5) * 0.3), born: now + i * 40 })));
    }
  }, [finished, engine, reduceMotion, size]);

  const scrubAt = (x: number, y: number) => {
    if (finished) return;
    const r = engine.scrub(x / size, y / size, radius, 0.42);
    const now = Date.now();
    if (r.removed > 0) {
      setVersion(engine.version);
      if (now - lastSound.current > 160) {
        lastSound.current = now;
        playSound('clean', { volume: 0.35 });
      }
      if (now - lastHaptic.current > 120) {
        lastHaptic.current = now;
        haptic('tick');
      }
      if (!reduceMotion && motes.length < maxParticles) {
        setMotes((m) => [...m.slice(-maxParticles + 2), { x, y, vx: (Math.random() - 0.5) * 120, vy: -40 - Math.random() * 80, born: now }, { x, y, vx: (Math.random() - 0.5) * 120, vy: -20 - Math.random() * 60, born: now }]);
      }
    }
    if (r.sparkleRegions.length) {
      playSound('sparkle', { volume: 0.3 });
      if (!reduceMotion) setSparkles((s) => [...s, ...r.sparkleRegions.map((reg) => ({ x: engine.regionCentre(reg).u * size, y: engine.regionCentre(reg).v * size, born: now }))]);
    }
    if (engine.coverage >= 0.97) finish();
  };

  const pan = Gesture.Pan()
    .runOnJS(true)
    .minDistance(0)
    .onBegin((e) => {
      setCursor({ x: e.x, y: e.y });
      setHintSpot(null);
      scrubAt(e.x, e.y);
    })
    .onUpdate((e) => {
      setCursor({ x: e.x, y: e.y });
      scrubAt(e.x, e.y);
    })
    .onFinalize(() => setCursor(null));

  const hint = () => {
    // Point at the dirtiest 4×4 block.
    let best = -1;
    let bestSum = 0;
    for (let r = 0; r < COLS; r += 4) {
      for (let c = 0; c < COLS; c += 4) {
        let s = 0;
        for (let y = r; y < Math.min(COLS, r + 4); y++) for (let x = c; x < Math.min(COLS, c + 4); x++) s += engine.dirt[y * COLS + x];
        if (s > bestSum) {
          bestSum = s;
          best = r * COLS + c;
        }
      }
    }
    if (best >= 0) setHintSpot({ x: (((best % COLS) + 2) / COLS) * size, y: ((Math.floor(best / COLS) + 2) / COLS) * size });
  };

  const cell = size / COLS;
  const now = Date.now();
  // Dirt is merged into four paths (by amount) so a frame draws 4 shapes, not hundreds.
  const dirtPaths = useMemo(() => {
    const builders = [0, 1, 2, 3].map(() => Skia.PathBuilder.Make());
    for (let r = 0; r < COLS; r++) {
      for (let c = 0; c < COLS; c++) {
        const d = engine.dirt[r * COLS + c];
        if (d <= 0) continue;
        const bucket = Math.min(3, Math.floor(d * 4));
        const jitter = ((r * 31 + c * 17) % 7) / 7;
        builders[bucket].addCircle((c + 0.5) * cell + (jitter - 0.5) * cell * 0.4, (r + 0.5) * cell, cell * (0.6 + bucket * 0.12));
      }
    }
    return builders.map((b) => b.build());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine.version, cell]);
  const dirtNodes = dirtPaths.map((path, i) => <Path key={i} path={path} color={style.color((i + 0.5) / 4)} />);

  return (
    <View style={styles.root}>
      <AppText variant="title" accessibilityRole="header">
        Clean it up
      </AppText>
      <AppText muted>
        Swipe over the {style.name} with your {style.tool}. Tough grime needs a few passes.
      </AppText>
      <Card wood padded={false} style={styles.stage}>
        <GestureDetector gesture={pan}>
          <View style={{ width: size, height: size }} accessible accessibilityLabel={`Dirty ${job.objectName}. ${Math.round(coverage * 100)} percent clean. Swipe to clean.`} testID="cleaning-canvas">
            <Canvas style={{ width: size, height: size }}>
              <Group transform={[{ scale: size / ART }]}>
                <ObjectDrawing category={job.category} variant={job.variant} look={job.original} broken />
              </Group>
              <Group>{dirtNodes}</Group>
              {hintSpot ? <Circle cx={hintSpot.x} cy={hintSpot.y} r={cell * 4} style="stroke" strokeWidth={4} color={palette.mustard} /> : null}
              {motes.map((m, i) => {
                const t = (now - m.born) / 1000;
                return <Circle key={`m${i}`} cx={m.x + m.vx * t} cy={m.y + m.vy * t + 200 * t * t} r={2.5} color={style.color(0.6)} />;
              })}
              {sparkles.map((s, i) => {
                const t = Math.max(0, (now - s.born) / 700);
                return <Path key={`s${i}`} path={starPath(s.x, s.y, 6 + t * 14)} color={`rgba(255,246,200,${1 - t})`} />;
              })}
              {cursor ? <Circle cx={cursor.x} cy={cursor.y} r={radius * size} style="stroke" strokeWidth={3} color="rgba(255,255,255,0.9)" /> : null}
            </Canvas>
          </View>
        </GestureDetector>
      </Card>
      <ProgressBar value={coverage} label="Clean" showPercent color={coverage > 0.9 ? palette.mintDeep : palette.sky} marker={0.8} />
      <View style={styles.row}>
        <Button label="Hint" icon="lightbulb-on-outline" variant="secondary" onPress={hint} style={styles.flex} disabled={finished} />
        <Button
          label={finished ? 'Sparkling!' : coverage >= 0.8 ? 'Good enough' : 'Keep cleaning'}
          icon="check"
          variant={coverage >= 0.8 ? 'success' : 'secondary'}
          disabled={coverage < 0.8}
          style={styles.flex2}
          testID="cleaning-done"
          onPress={() => onDone({ cleaned: finished ? 1 : engine.coverage, seconds: (Date.now() - start.current) / 1000 })}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  root: { gap: spacing.sm },
  stage: { alignSelf: 'center', overflow: 'hidden', padding: 4, backgroundColor: '#FBEBD0' },
  row: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
  flex2: { flex: 2 },
});

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo, useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { AppText } from '@/components/AppText';
import { playSound } from '@/services/audio';
import { haptic } from '@/services/haptics';
import { palette } from '@/theme';
import { finishSoon, TaskShell, useTaskClock, type TaskProps } from './TaskShell';

type Glyph = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export interface DragPiece {
  id: string;
  label: string;
  color: string;
  icon: Glyph;
  /** Slot this piece belongs in. */
  slot: string;
  /** Needs the right orientation (tap to flip, e.g. battery polarity). */
  flippable?: boolean;
}

export interface DragSlot {
  id: string;
  label: string;
  /** Position in the field, 0..1. */
  x: number;
  y: number;
  color: string;
  icon: Glyph;
}

export interface DragConfig {
  title: string;
  help: string;
  pieces: DragPiece[];
  slots: DragSlot[];
  /** Background drawing of the object (inside the field). */
  backdrop?: ReactNode;
  fieldColor?: string;
}

const H = 320;
const PIECE = 64;

const Piece = memo(function Piece({
  piece,
  home,
  flipped,
  onDrop,
  onFlip,
}: {
  piece: DragPiece;
  home: { x: number; y: number };
  flipped: boolean;
  onDrop: (id: string, x: number, y: number) => boolean;
  onFlip: (id: string) => void;
}) {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const lifted = useSharedValue(1);
  const drop = (id: string, x: number, y: number) => {
    const ok = onDrop(id, x, y);
    if (!ok) {
      tx.value = withSpring(0);
      ty.value = withSpring(0);
    }
  };
  const pan = Gesture.Pan()
    .onBegin(() => {
      lifted.value = withSpring(1.15);
    })
    .onUpdate((e) => {
      tx.value = e.translationX;
      ty.value = e.translationY;
    })
    .onEnd((e) => {
      runOnJS(drop)(piece.id, home.x + PIECE / 2 + e.translationX, home.y + PIECE / 2 + e.translationY);
    })
    .onFinalize(() => {
      lifted.value = withSpring(1);
    });
  const tap = Gesture.Tap().onEnd(() => {
    if (piece.flippable) runOnJS(onFlip)(piece.id);
  });
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: lifted.value }], zIndex: lifted.value > 1 ? 10 : 1 }));
  return (
    <GestureDetector gesture={Gesture.Exclusive(pan, tap)}>
      <Animated.View style={[styles.piece, { left: home.x, top: home.y, backgroundColor: piece.color }, style]} accessibilityLabel={`${piece.label}${piece.flippable ? (flipped ? ', plus side up' : ', minus side up') : ''}`}>
        <MaterialCommunityIcons name={piece.icon} size={30} color="#FFF" style={piece.flippable && !flipped ? styles.upsideDown : undefined} />
        {piece.flippable ? (
          <AppText variant="label" color="#FFF">
            {flipped ? '+ up' : '− up'}
          </AppText>
        ) : null}
      </Animated.View>
    </GestureDetector>
  );
});

export const DragSlotTask = memo(function DragSlotTask({ config, tolerance, onDone }: TaskProps & { config: DragConfig }) {
  const clock = useTaskClock();
  const [width, setWidth] = useState(0);
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  const [mistakes, setMistakes] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const finished = useRef(false);
  const remaining = config.pieces.filter((p) => !placed[p.id]);
  const done = remaining.length === 0;

  useEffect(() => {
    if (done && !finished.current) {
      finished.current = true;
      playSound('repair');
      haptic('complete');
      finishSoon(onDone, { accuracy: Math.max(0.45, 1 - mistakes * 0.12), seconds: clock(), mistakes });
    }
  }, [done, mistakes, onDone, clock]);

  const slotPos = (s: DragSlot) => ({ x: s.x * width, y: s.y * (H - 90) });
  const homeOf = (i: number) => {
    const n = remaining.length;
    const gap = width / (n + 1);
    return { x: gap * (i + 1) - PIECE / 2, y: H - PIECE - 12 };
  };

  const tryPlace = (id: string, slotId: string): boolean => {
    const piece = config.pieces.find((p) => p.id === id);
    if (!piece) return false;
    const okSlot = piece.slot === slotId && !Object.values(placed).includes(slotId);
    const okFlip = !piece.flippable || flipped[id];
    if (okSlot && okFlip) {
      setPlaced((p) => ({ ...p, [id]: slotId }));
      playSound('wire');
      haptic('correct');
      return true;
    }
    setMistakes((m) => m + 1);
    playSound('error', { volume: 0.5 });
    haptic('error');
    return false;
  };

  const onDrop = (id: string, x: number, y: number): boolean => {
    let best: DragSlot | null = null;
    let bestD = Infinity;
    for (const s of config.slots) {
      const p = slotPos(s);
      const d = Math.hypot(x - p.x, y - p.y);
      if (d < bestD) {
        best = s;
        bestD = d;
      }
    }
    if (!best || bestD > PIECE * (1.1 + tolerance)) return false;
    return tryPlace(id, best.id);
  };

  const flip = (id: string) => {
    haptic('tick');
    setFlipped((f) => ({ ...f, [id]: !f[id] }));
  };

  return (
    <TaskShell title={config.title} help={config.help} status={`${config.pieces.length - remaining.length} of ${config.pieces.length} fitted${mistakes ? ` · ${mistakes} wrong try` : ''}`} solved={done}>
      <View style={[styles.field, { backgroundColor: config.fieldColor ?? '#F4E3C3' }]} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
        {config.backdrop}
        <View style={[styles.tray, { top: H - PIECE - 24 }]} />
        {width > 0
          ? config.slots.map((s) => {
              const p = slotPos(s);
              const filledBy = Object.entries(placed).find(([, slot]) => slot === s.id)?.[0];
              const piece = config.pieces.find((x) => x.id === filledBy);
              return (
                <Pressable
                  key={s.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${s.label}${piece ? `, ${piece.label} fitted` : ', empty'}`}
                  onPress={() => {
                    if (selected && !piece) {
                      tryPlace(selected, s.id);
                      setSelected(null);
                    }
                  }}
                  style={[styles.slot, { left: p.x - PIECE / 2, top: p.y - PIECE / 2, borderColor: s.color, backgroundColor: piece ? piece.color : 'rgba(255,255,255,0.55)' }]}
                >
                  <MaterialCommunityIcons name={piece ? piece.icon : s.icon} size={28} color={piece ? '#FFF' : s.color} />
                </Pressable>
              );
            })
          : null}
        {width > 0
          ? remaining.map((p, i) => (
              <Piece key={p.id} piece={p} home={homeOf(i)} flipped={!!flipped[p.id]} onDrop={onDrop} onFlip={flip} />
            ))
          : null}
      </View>
      {/* Screen-reader path: pick a part, then pick a slot. */}
      <View style={styles.a11y}>
        {remaining.map((p) => (
          <Pressable key={p.id} accessibilityRole="button" accessibilityLabel={`Pick ${p.label}`} onPress={() => setSelected(p.id)} style={[styles.a11yBtn, selected === p.id && { borderColor: palette.orange }]}>
            <AppText variant="caption">{p.label}</AppText>
          </Pressable>
        ))}
        {remaining.some((p) => p.flippable) ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Flip the selected part" onPress={() => selected && flip(selected)} style={styles.a11yBtn}>
            <AppText variant="caption">Flip</AppText>
          </Pressable>
        ) : null}
      </View>
    </TaskShell>
  );
});

const styles = StyleSheet.create({
  field: { height: H, width: '100%' },
  tray: { position: 'absolute', left: 8, right: 8, height: PIECE + 20, borderRadius: 18, backgroundColor: 'rgba(91,58,38,0.15)' },
  piece: { position: 'absolute', width: PIECE, height: PIECE, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(31,20,16,0.6)' },
  slot: { position: 'absolute', width: PIECE, height: PIECE, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderStyle: 'dashed' },
  upsideDown: { transform: [{ rotate: '180deg' }] },
  a11y: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, padding: 8 },
  a11yBtn: { minHeight: 36, paddingHorizontal: 10, borderRadius: 18, borderWidth: 2, borderColor: '#E8D5B5', justifyContent: 'center' },
});

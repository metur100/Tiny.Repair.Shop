import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';

import { useReduceMotion } from '@/hooks/useMotion';
import { useGameStore } from '@/store/useGameStore';
import { palette, radius, shadows, spacing, useColors } from '@/theme';
import { reputationLevel } from '@/utils/economy';
import { AppText } from './AppText';

/** Counts up smoothly to the new value. */
function useCountUp(target: number, reduce: boolean): number {
  const [shown, setShown] = useState(target);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    if (reduce || shown === target) return;
    const from = shown;
    const start = Date.now();
    const step = () => {
      const t = Math.min(1, (Date.now() - start) / 700);
      setShown(Math.round(from + (target - from) * (1 - (1 - t) ** 3)));
      if (t < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, reduce]);
  return reduce ? target : shown;
}

export const Chip = memo(function Chip({ icon, color, value, label }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string; value: string; label: string }) {
  const c = useColors();
  return (
    <View style={[styles.chip, shadows.sm, { backgroundColor: c.surface, borderColor: c.border }]} accessible accessibilityLabel={`${label}: ${value}`}>
      <View style={[styles.iconDot, { backgroundColor: color }]}>
        <MaterialCommunityIcons name={icon} size={16} color="#fff" />
      </View>
      <AppText variant="number">{value}</AppText>
    </View>
  );
});

/** Coins with a bounce whenever they change (coins flying in from the results screen). */
export const CoinBalance = memo(function CoinBalance() {
  const coins = useGameStore((s) => s.coins);
  const reduce = useReduceMotion();
  const shown = useCountUp(coins, reduce);
  const bounce = useSharedValue(1);
  const prev = useRef(coins);
  useEffect(() => {
    if (coins > prev.current && !reduce) bounce.value = withSequence(withSpring(1.18, { stiffness: 500 }), withSpring(1));
    prev.current = coins;
  }, [coins, reduce, bounce]);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: bounce.value }] }));
  return (
    <Animated.View style={anim}>
      <Chip icon="circle-multiple" color={palette.mustardDeep} value={shown.toLocaleString('en-US')} label="Coins" />
    </Animated.View>
  );
});

export const ReputationBadge = memo(function ReputationBadge() {
  const rep = useGameStore((s) => s.reputation);
  const c = useColors();
  const { level, progress } = reputationLevel(rep);
  return (
    <View style={[styles.chip, shadows.sm, { backgroundColor: c.surface, borderColor: c.border }]} accessible accessibilityLabel={`Reputation level ${level}, ${rep} reputation points`}>
      <View style={[styles.iconDot, { backgroundColor: palette.coral }]}>
        <MaterialCommunityIcons name="star-four-points" size={15} color="#fff" />
      </View>
      <View>
        <AppText variant="label">Lv {level}</AppText>
        <View style={[styles.mini, { backgroundColor: c.surfaceAlt }]}>
          <View style={[styles.miniFill, { width: `${Math.round(progress * 100)}%` }]} />
        </View>
      </View>
    </View>
  );
});

export const TicketBadge = memo(function TicketBadge() {
  const tickets = useGameStore((s) => s.tickets);
  return <Chip icon="ticket-confirmation" color={palette.skyDeep} value={String(tickets)} label="Tickets" />;
});

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingLeft: 4,
    paddingRight: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
  iconDot: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  mini: { width: 46, height: 5, borderRadius: 3, overflow: 'hidden', marginTop: 1 },
  miniFill: { height: '100%', backgroundColor: palette.coral },
});

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { memo, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { stickerPath } from '@/art/ObjectArt';
import { AppText } from '@/components/AppText';
import { TAB_BAR_HEIGHT } from '@/components/BottomTabBar';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { CoinBalance, ReputationBadge, TicketBadge } from '@/components/CoinBalance';
import { ConfirmModal } from '@/components/Modal';
import { Pill, SectionHeader } from '@/components/Misc';
import { PaperTexture } from '@/components/Screen';
import { COSMETICS, type CosmeticItem } from '@/data/cosmetics';
import type { StickerId, Upgrade } from '@/data/types';
import { UPGRADES } from '@/data/upgrades';
import { useReduceMotion } from '@/hooks/useMotion';
import { playSound } from '@/services/audio';
import { haptic } from '@/services/haptics';
import { useGameStore } from '@/store/useGameStore';
import { paintColors, palette, radius, spacing, useColors } from '@/theme';
import { canBuyUpgrade, shopLevel } from '@/utils/unlocks';
import { Canvas, Group, Path } from '@shopify/react-native-skia';

const UPGRADE_ICON: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  cleaningStation: 'spray-bottle',
  toolBench: 'toolbox',
  robotStation: 'robot-industrial',
  cameraBench: 'camera-iris',
  paintStation: 'spray',
  electronicsTable: 'chip',
  musicCorner: 'music',
  waitingArea: 'sofa',
  arcadeRoom: 'gamepad-variant',
  displayShelves: 'bookshelf',
  storefront: 'storefront-outline',
};

const UpgradeCard = memo(function UpgradeCard({ u, onBuy }: { u: Upgrade; onBuy: (u: Upgrade) => void }) {
  const c = useColors();
  const coins = useGameStore((s) => s.coins);
  const rep = useGameStore((s) => s.reputation);
  const owned = useGameStore((s) => s.upgrades);
  const check = canBuyUpgrade(u.id, coins, rep, owned);
  const isOwned = owned.includes(u.id);
  const reduce = useReduceMotion();
  const pop = useSharedValue(1);
  const wasOwned = useRef(isOwned);
  useEffect(() => {
    if (isOwned && !wasOwned.current && !reduce) pop.value = withSequence(withSpring(1.08), withSpring(1));
    wasOwned.current = isOwned;
  }, [isOwned, reduce, pop]);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));
  return (
    <Animated.View style={anim}>
      <Card style={styles.upgrade} tint={isOwned ? '#E6F6EE' : undefined}>
        <View style={[styles.upIcon, { backgroundColor: isOwned ? palette.mint : c.surfaceAlt }]}>
          <MaterialCommunityIcons name={UPGRADE_ICON[u.id] ?? 'hammer'} size={30} color={c.text} />
        </View>
        <View style={styles.flex}>
          <AppText variant="heading">{u.name}</AppText>
          <AppText variant="caption" muted>
            {u.description}
          </AppText>
          {!isOwned && check.reason === 'reputation' ? <Pill label={`Needs ${u.reputation} reputation`} color="#F9C6BD" icon="lock" /> : null}
        </View>
        {isOwned ? (
          <View style={styles.owned} accessible accessibilityLabel={`${u.name} owned`}>
            <MaterialCommunityIcons name="check-decagram" size={28} color={palette.mintDeep} />
            <AppText variant="caption">Owned</AppText>
          </View>
        ) : (
          <Button label={`${u.cost}`} icon="circle-multiple" size="sm" onPress={() => onBuy(u)} disabled={!check.ok} accessibilityLabel={`Buy ${u.name} for ${u.cost} coins`} testID={`buy-${u.id}`} />
        )}
      </Card>
    </Animated.View>
  );
});

function CosmeticSwatch({ item }: { item: CosmeticItem }) {
  const [, value] = item.id.split(':');
  if (item.kind === 'color') {
    const col = paintColors.find((p) => p.id === value)?.color ?? '#ccc';
    return <View style={[styles.swatch, { backgroundColor: col }]} />;
  }
  if (item.kind === 'sticker') {
    return (
      <Canvas style={styles.swatch}>
        <Group>
          <Path path={stickerPath(value as StickerId, 22, 22, 15)} color={palette.coral} />
        </Group>
      </Canvas>
    );
  }
  const icon: keyof typeof MaterialCommunityIcons.glyphMap = item.kind === 'pattern' ? 'texture-box' : 'shimmer';
  return (
    <View style={[styles.swatch, styles.center, { backgroundColor: palette.creamDeep }]}>
      <MaterialCommunityIcons name={icon} size={24} color={palette.navy} />
    </View>
  );
}

export default function ShopScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ section?: string }>();
  const scroll = useRef<ScrollView>(null);
  const [paintY, setPaintY] = useState(0);
  const owned = useGameStore((s) => s.upgrades);
  const cosmetics = useGameStore((s) => s.cosmetics);
  const coins = useGameStore((s) => s.coins);
  const tickets = useGameStore((s) => s.tickets);
  const buyUpgrade = useGameStore((s) => s.buyUpgrade);
  const buyCosmetic = useGameStore((s) => s.buyCosmetic);
  const [confirm, setConfirm] = useState<Upgrade | null>(null);
  const [celebrate, setCelebrate] = useState<string | null>(null);
  const hasPaint = owned.includes('paintStation');

  useEffect(() => {
    if (params.section === 'paint' && paintY > 0) scroll.current?.scrollTo({ y: paintY - 12, animated: true });
    if (params.section === 'upgrades') scroll.current?.scrollTo({ y: 0, animated: true });
  }, [params.section, paintY]);

  const shopItems = COSMETICS.filter((x) => !cosmetics.includes(x.id) && (x.cost > 0 || x.tickets));

  return (
    <View style={[styles.root, { backgroundColor: c.background }]} testID="shop-screen">
      <PaperTexture />
      <ScrollView ref={scroll} contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + TAB_BAR_HEIGHT + spacing.xl }]}>
        <View style={styles.top}>
          <AppText variant="display" accessibilityRole="header">
            Shop
          </AppText>
          <View style={styles.chips}>
            <CoinBalance />
            <TicketBadge />
          </View>
        </View>
        <View style={styles.levelRow}>
          <ReputationBadge />
          <Pill label={`Workshop level ${shopLevel(owned)}`} color={palette.mint} icon="home-city" />
        </View>

        <SectionHeader title="Workshop upgrades" />
        {UPGRADES.map((u) => (
          <UpgradeCard key={u.id} u={u} onBuy={setConfirm} />
        ))}

        <View onLayout={(e) => setPaintY(e.nativeEvent.layout.y)}>
          <SectionHeader title="Paints & stickers" />
          {!hasPaint ? (
            <Card style={styles.note}>
              <AppText muted>Patterns, finishes and stickers need the Paint station. Colours work right away.</AppText>
            </Card>
          ) : null}
          <View style={styles.grid}>
            {shopItems.map((item) => {
              const needsStation = item.needsPaintStation && !hasPaint;
              const affordable = item.tickets ? tickets >= item.tickets : coins >= item.cost;
              return (
                <Card key={item.id} style={styles.cos} padded={false}>
                  <CosmeticSwatch item={item} />
                  <AppText variant="label" numberOfLines={1}>
                    {item.name}
                  </AppText>
                  <AppText variant="caption" muted>
                    {item.kind}
                  </AppText>
                  <Button
                    label={item.tickets ? `${item.tickets}` : `${item.cost}`}
                    icon={item.tickets ? 'ticket-confirmation' : 'circle-multiple'}
                    size="sm"
                    disabled={needsStation || !affordable}
                    accessibilityLabel={`Buy ${item.name} for ${item.tickets ? `${item.tickets} tickets` : `${item.cost} coins`}`}
                    onPress={() => {
                      if (buyCosmetic(item.id)) {
                        playSound('coins');
                        haptic('sale');
                        setCelebrate(item.name);
                      }
                    }}
                  />
                </Card>
              );
            })}
            {shopItems.length === 0 ? <AppText muted>Everything is unlocked. What a collection!</AppText> : null}
          </View>
        </View>
        <AppText variant="caption" muted style={styles.fair}>
          Everything here is earned by playing. Tickets come from perfect repairs and daily jobs.
        </AppText>
      </ScrollView>

      <ConfirmModal
        visible={!!confirm}
        title={confirm?.name ?? ''}
        message={confirm ? `${confirm.description}\n\nBuy it for ${confirm.cost} coins?` : ''}
        confirmLabel="Buy"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm && buyUpgrade(confirm.id)) {
            playSound('upgrade');
            haptic('upgrade');
            setCelebrate(confirm.name);
          }
          setConfirm(null);
        }}
      />
      {celebrate ? (
        <Animated.View entering={ZoomIn.springify()} style={[styles.toast, { backgroundColor: palette.navy }]} onTouchEnd={() => setCelebrate(null)} accessibilityLiveRegion="polite">
          <MaterialCommunityIcons name="party-popper" size={22} color={palette.mustard} />
          <AppText variant="bodyStrong" color="#fff">
            {celebrate} added to your workshop!
          </AppText>
        </Animated.View>
      ) : null}
      {celebrate ? <AutoHide onDone={() => setCelebrate(null)} /> : null}
    </View>
  );
}

function AutoHide({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, [onDone]);
  return null;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, maxWidth: 680, width: '100%', alignSelf: 'center' },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  chips: { flexDirection: 'row', gap: 6 },
  levelRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', marginTop: spacing.sm },
  upgrade: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  upIcon: { width: 56, height: 56, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, gap: 2 },
  owned: { alignItems: 'center' },
  note: { marginBottom: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  cos: { width: '31.5%', padding: spacing.sm, alignItems: 'center', gap: 4 },
  swatch: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: '#fff' },
  center: { alignItems: 'center', justifyContent: 'center' },
  fair: { marginTop: spacing.lg, textAlign: 'center' },
  toast: { position: 'absolute', left: spacing.lg, right: spacing.lg, bottom: 120, borderRadius: radius.lg, padding: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});

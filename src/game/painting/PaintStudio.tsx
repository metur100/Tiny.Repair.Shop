import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Canvas, Group, Skia } from '@shopify/react-native-skia';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Easing, useDerivedValue, useSharedValue, withTiming } from 'react-native-reanimated';

import { ART, ObjectDrawing } from '@/art/ObjectArt';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { FINISH_LABEL, FINISHES, PATTERN_LABEL, PATTERNS, STICKERS } from '@/data/cosmetics';
import type { Customization, FinishId, Job, PatternId, StickerId } from '@/data/types';
import { playSound } from '@/services/audio';
import { haptic } from '@/services/haptics';
import { colorIdOf, useGameStore } from '@/store/useGameStore';
import { paintColors, palette, radius, shadows, spacing, useColors } from '@/theme';
import { requestMet } from '@/utils/scoring';

type Tab = 'color' | 'accent' | 'pattern' | 'finish' | 'stickers' | 'extras';
const TABS: { id: Tab; label: string; icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'] }[] = [
  { id: 'color', label: 'Colour', icon: 'format-paint' },
  { id: 'accent', label: 'Accent', icon: 'brush' },
  { id: 'pattern', label: 'Pattern', icon: 'texture-box' },
  { id: 'finish', label: 'Finish', icon: 'shimmer' },
  { id: 'stickers', label: 'Stickers', icon: 'sticker-emoji' },
  { id: 'extras', label: 'Extras', icon: 'puzzle' },
];

const ACCESSORY: Record<Job['category'], string> = { radio: 'Antenna ball', bicycle: 'Wicker basket', robot: 'Bow tie', instrument: 'Strap', camera: 'Neck strap', arcade: 'Marquee lights' };

/**
 * Paint & customise: a live preview where new paint spreads out from the centre, and a bottom sheet of
 * colours, accents, patterns, finishes, stickers and an accessory. Locked options show where to get them.
 */
export const PaintStudio = memo(function PaintStudio({ job, onDone, reduceMotion }: { job: Job; onDone: (c: Customization) => void; reduceMotion: boolean }) {
  const c = useColors();
  const { width } = useWindowDimensions();
  const owned = useGameStore((s) => s.cosmetics);
  const hasStation = useGameStore((s) => s.upgrades.includes('paintStation'));
  const favorite = useGameStore((s) => s.favoriteDesign);
  const setFavorite = useGameStore((s) => s.setFavoriteDesign);
  const [tab, setTab] = useState<Tab>('color');
  const [look, setLook] = useState<Customization>(() => ({ ...job.original, baseColor: favorite.baseColor ?? job.original.baseColor, accentColor: favorite.accentColor ?? job.original.accentColor }));
  const [prev, setPrev] = useState<Customization>(look);
  const size = Math.min(width - spacing.lg * 2 - 8, 300);
  // Four option tiles fill the sheet's width (screen padding, sheet padding and border, 3 gaps).
  const optionWidth = Math.floor((Math.min(width, 640) - spacing.lg * 2 - spacing.md * 2 - 3 - 8 * 3) / 4);
  const spread = useSharedValue(1);
  const clip = useDerivedValue(() => Skia.PathBuilder.Make().addCircle(ART / 2, ART / 2, spread.value * ART * 0.75).build());
  const lastLook = useRef(look);

  useEffect(() => {
    if (lastLook.current === look) return;
    setPrev(lastLook.current);
    lastLook.current = look;
    if (reduceMotion) {
      spread.value = 1;
      return;
    }
    spread.value = 0;
    spread.value = withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) });
  }, [look, reduceMotion, spread]);

  const update = (patch: Partial<Customization>) => {
    playSound('clean', { volume: 0.5 });
    haptic('tick');
    setLook((l) => ({ ...l, ...patch }));
  };

  const has = (id: string) => owned.includes(id);
  const met = requestMet(job, look, colorIdOf);
  const transform = useMemo(() => [{ scale: size / ART }], [size]);

  const option = (key: string, label: string, selected: boolean, locked: boolean, onPress: () => void, content: React.ReactNode) => (
    <Pressable
      key={key}
      onPress={() => (locked ? haptic('error') : onPress())}
      accessibilityRole="button"
      accessibilityLabel={`${label}${selected ? ', selected' : ''}${locked ? ', locked – get it in the shop' : ''}`}
      accessibilityState={{ selected, disabled: locked }}
      style={[styles.option, { width: optionWidth, borderColor: selected ? palette.orange : c.border, backgroundColor: c.surface }, locked && styles.locked]}
    >
      {content}
      <AppText variant="caption" numberOfLines={1}>
        {label}
      </AppText>
      {locked ? <MaterialCommunityIcons name="lock" size={14} color={c.textMuted} style={styles.lock} /> : null}
    </Pressable>
  );

  const swatches = (field: 'baseColor' | 'accentColor') =>
    paintColors.map((p) =>
      option(p.id, p.name, look[field] === p.color, !has(`color:${p.id}`), () => update({ [field]: p.color } as Partial<Customization>), <View style={[styles.swatch, { backgroundColor: p.color }]} />),
    );

  const stationNote = !hasStation ? (
    <AppText variant="caption" muted style={styles.note}>
      Buy the Paint station in the shop to use patterns, finishes and stickers.
    </AppText>
  ) : null;

  return (
    <View style={styles.root}>
      <AppText variant="title" accessibilityRole="header">
        Paint & customise
      </AppText>
      {job.special ? (
        <View style={[styles.request, { backgroundColor: met ? '#DDF3EA' : '#FDE2DC' }]} accessibilityLiveRegion="polite">
          <MaterialCommunityIcons name={met ? 'check-circle' : 'star-shooting'} size={20} color={met ? palette.mintDeep : palette.coralDeep} />
          <AppText variant="bodyStrong" style={styles.flex}>
            {met ? 'Request met: ' : 'Customer asks: '}
            {job.special.text}
          </AppText>
        </View>
      ) : null}
      <Card wood padded={false} style={styles.preview}>
        <Canvas style={{ width: size, height: size }} accessible accessibilityLabel={`Preview of the ${job.objectName}`}>
          <Group transform={transform}>
            <ObjectDrawing category={job.category} variant={job.variant} look={prev} on />
            <Group clip={clip}>
              <ObjectDrawing category={job.category} variant={job.variant} look={look} on />
            </Group>
          </Group>
        </Canvas>
      </Card>

      <View style={[styles.sheet, shadows.lg, { backgroundColor: c.surface, borderColor: c.border }]}>
        <View style={styles.handle} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {TABS.map((t) => (
            <Pressable key={t.id} onPress={() => setTab(t.id)} accessibilityRole="tab" accessibilityState={{ selected: tab === t.id }} accessibilityLabel={t.label} style={[styles.tab, { backgroundColor: tab === t.id ? palette.orange : c.surfaceAlt }]}>
              <MaterialCommunityIcons name={t.icon} size={18} color={c.text} />
              <AppText variant="label">{t.label}</AppText>
            </Pressable>
          ))}
        </ScrollView>
        <View style={styles.options}>
          {tab === 'color' ? swatches('baseColor') : null}
          {tab === 'accent' ? swatches('accentColor') : null}
          {tab === 'pattern'
            ? PATTERNS.map((p: PatternId) =>
                option(p, PATTERN_LABEL[p], look.pattern === p, p !== 'none' && (!hasStation || !has(`pattern:${p}`)), () => update({ pattern: p }), <MaterialCommunityIcons name={p === 'none' ? 'square-outline' : p === 'stripes' ? 'reorder-vertical' : p === 'dots' ? 'dots-grid' : p === 'checker' ? 'checkerboard' : p === 'waves' ? 'waves' : 'star-four-points-outline'} size={26} color={c.text} />),
              )
            : null}
          {tab === 'finish'
            ? FINISHES.map((f: FinishId) =>
                option(f, FINISH_LABEL[f], look.finish === f, f !== 'matte' && (!hasStation || !has(`finish:${f}`)), () => update({ finish: f }), <MaterialCommunityIcons name={f === 'matte' ? 'circle' : f === 'gloss' ? 'circle-half-full' : f === 'metallic' ? 'atom-variant' : 'palette-outline'} size={26} color={c.text} />),
              )
            : null}
          {tab === 'stickers'
            ? STICKERS.map((s: StickerId) => {
                const on = look.stickers.includes(s);
                return option(
                  s,
                  s[0].toUpperCase() + s.slice(1),
                  on,
                  !hasStation || !has(`sticker:${s}`),
                  () => update({ stickers: on ? look.stickers.filter((x) => x !== s) : [...look.stickers, s].slice(-3) }),
                  <MaterialCommunityIcons name={s === 'heart' ? 'heart' : s === 'star' ? 'star' : s === 'bolt' ? 'lightning-bolt' : s === 'flower' ? 'flower' : s === 'note' ? 'music-note' : 'emoticon-happy'} size={26} color={palette.coral} />,
                );
              })
            : null}
          {tab === 'extras'
            ? option('acc', ACCESSORY[job.category], look.accessory, false, () => update({ accessory: !look.accessory }), <MaterialCommunityIcons name={look.accessory ? 'check-circle' : 'plus-circle-outline'} size={26} color={c.text} />)
            : null}
        </View>
        {tab === 'pattern' || tab === 'finish' || tab === 'stickers' ? stationNote : null}
        <View style={styles.actions}>
          <Button label="Original" accessibilityLabel="Back to the original look" variant="secondary" size="sm" icon="undo" onPress={() => update({ ...job.original })} style={styles.flex} />
          <Button
            label="Looks great!"
            icon="check"
            onPress={() => {
              setFavorite({ baseColor: look.baseColor, accentColor: look.accentColor });
              playSound('sparkle');
              haptic('correct');
              onDone(look);
            }}
            style={styles.flex2}
            testID="paint-done"
          />
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  root: { gap: spacing.sm },
  request: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, alignItems: 'center' },
  flex: { flex: 1 },
  flex2: { flex: 2 },
  preview: { alignSelf: 'center', padding: 4, backgroundColor: '#FBEBD0' },
  sheet: { borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, borderRadius: radius.lg, borderWidth: 1.5, padding: spacing.md, gap: spacing.sm },
  handle: { width: 44, height: 5, borderRadius: 3, backgroundColor: '#E3CFA9', alignSelf: 'center' },
  tabs: { gap: 6 },
  tab: { flexDirection: 'row', gap: 4, alignItems: 'center', paddingHorizontal: 12, minHeight: 40, borderRadius: 20 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: { minHeight: 72, borderRadius: radius.md, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center', padding: 4, gap: 2 },
  locked: { opacity: 0.45 },
  lock: { position: 'absolute', top: 4, right: 4 },
  swatch: { width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: '#fff' },
  note: { marginTop: 2 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
});

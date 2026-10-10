import { Canvas, Circle, Group, Line, LinearGradient, Oval, Path, Rect, RoundedRect, Skia, Text as SkText, matchFont, vec, type SkPath } from '@shopify/react-native-skia';
import { memo, useEffect, useMemo } from 'react';
import { Platform } from 'react-native';
import { Easing, useDerivedValue, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

import type { Category, Customer, Customization } from '@/data/types';
import { palette } from '@/theme/colors';
import { AvatarDrawing } from './CustomerAvatar';
import { darken, lighten, withAlpha } from './color';
import { ART, ObjectDrawing } from './ObjectArt';

const EMPTY = Skia.PathBuilder.Make().build();
const P = (svg: string): SkPath => Skia.Path.MakeFromSVGString(svg) ?? EMPTY;
/** The scene is authored in a 400 × 340 box. */
export const SCENE_W = 400;
export const SCENE_H = 340;
const FLOOR = 250;

export interface DisplayItem {
  category: Category;
  variant: number;
  look: Customization;
}

export interface WorkshopSceneProps {
  width: number;
  owned: readonly string[];
  display: DisplayItem[];
  /** A customer waiting at the door (shows the door open). */
  visitor?: Customer | null;
  reducedMotion: boolean;
}

function gearPath(cx: number, cy: number, r: number, teeth = 8): SkPath {
  const b = Skia.PathBuilder.Make();
  for (let i = 0; i < teeth * 2; i++) {
    const a = (i / (teeth * 2)) * Math.PI * 2;
    const rr = i % 2 === 0 ? r : r * 0.78;
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr;
    if (i === 0) b.moveTo(x, y);
    else b.lineTo(x, y);
  }
  b.close();
  b.addCircle(cx, cy, r * 0.32);
  return b.build();
}

const font = matchFont({ fontFamily: Platform.select({ ios: 'Helvetica', default: 'sans-serif' }), fontSize: 13, fontWeight: 'bold' });

/** The player's workshop: grows with every upgrade. Static parts are drawn once; a few parts animate. */
export const WorkshopScene = memo(function WorkshopScene({ width, owned, display, visitor, reducedMotion }: WorkshopSceneProps) {
  const has = (id: string) => owned.includes(id);
  const k = width / SCENE_W;
  const height = SCENE_H * k;
  const t = useSharedValue(0);
  useEffect(() => {
    if (reducedMotion) return;
    t.value = withRepeat(withTiming(1, { duration: 6000, easing: Easing.linear }), -1, false);
  }, [reducedMotion, t]);
  const swing = useSharedValue(0);
  useEffect(() => {
    if (reducedMotion) return;
    swing.value = withRepeat(withSequence(withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }), withTiming(-1, { duration: 1800, easing: Easing.inOut(Easing.sin) })), -1, true);
  }, [reducedMotion, swing]);

  const gearT = useDerivedValue(() => [{ translateX: 128 }, { translateY: 118 }, { rotate: t.value * Math.PI * 2 }, { translateX: -128 }, { translateY: -118 }]);
  const gear2T = useDerivedValue(() => [{ translateX: 146 }, { translateY: 106 }, { rotate: -t.value * Math.PI * 2 * 1.3 }, { translateX: -146 }, { translateY: -106 }]);
  const lampT = useDerivedValue(() => [{ translateX: 200 }, { rotate: swing.value * 0.06 }, { translateX: -200 }]);
  const steamT = useDerivedValue(() => [{ translateY: -((t.value * 6) % 1) * 14 }]);
  const steamO = useDerivedValue(() => 0.6 * (1 - ((t.value * 6) % 1)));
  const waveP = useDerivedValue(() => {
    const b = Skia.PathBuilder.Make();
    for (let i = 0; i <= 20; i++) {
      const x = 300 + i * 1.6;
      const y = 172 + Math.sin(i * 0.9 + t.value * Math.PI * 12) * 4;
      if (i === 0) b.moveTo(x, y);
      else b.lineTo(x, y);
    }
    return b.build();
  });
  const arcadeGlow = useDerivedValue(() => 0.55 + 0.35 * Math.sin(t.value * Math.PI * 16));

  const shelves = useMemo(() => display.slice(0, 4), [display]);
  const planks = useMemo(() => Array.from({ length: 9 }, (_, i) => i), []);

  return (
    <Canvas style={{ width, height }} accessible accessibilityRole="image" accessibilityLabel={`Your workshop with ${owned.length + 2} stations${visitor ? `. ${visitor.name} is waiting at the door` : ''}`}>
      <Group transform={[{ scale: k }]}>
        {/* Wall with wallpaper stripes */}
        <Rect x={0} y={0} width={SCENE_W} height={FLOOR} color="#F6E2C4" />
        {Array.from({ length: 20 }).map((_, i) => (
          <Rect key={i} x={i * 20} y={0} width={9} height={FLOOR} color="#F0D5AE" />
        ))}
        <Rect x={0} y={FLOOR - 16} width={SCENE_W} height={16} color={palette.woodLight} />
        <Rect x={0} y={FLOOR - 16} width={SCENE_W} height={3} color={lighten(palette.woodLight, 0.3)} />
        {/* Floor planks */}
        <Rect x={0} y={FLOOR} width={SCENE_W} height={SCENE_H - FLOOR} color={palette.wood}>
          <LinearGradient start={vec(0, FLOOR)} end={vec(0, SCENE_H)} colors={[lighten(palette.wood, 0.15), darken(palette.wood, 0.15)]} />
        </Rect>
        {planks.map((i) => (
          <Line key={i} p1={vec(i * 50 - 20, FLOOR)} p2={vec(i * 50 - 60, SCENE_H)} color={darken(palette.wood, 0.3)} strokeWidth={2} />
        ))}
        <Line p1={vec(0, FLOOR + 40)} p2={vec(SCENE_W, FLOOR + 40)} color={darken(palette.wood, 0.25)} strokeWidth={1.5} />
        {/* Rug */}
        <Oval x={120} y={FLOOR + 22} width={170} height={46} color="#E7A36B" />
        <Oval x={130} y={FLOOR + 27} width={150} height={36} color="#F2C14E" style="stroke" strokeWidth={3} />

        {/* Window (storefront adds a sign and flower box) */}
        <RoundedRect x={20} y={28} width={110} height={92} r={8} color="#BFE6FA">
          <LinearGradient start={vec(0, 28)} end={vec(0, 120)} colors={['#9FD8F7', '#E8F7FF']} />
        </RoundedRect>
        <Circle cx={104} cy={50} r={10} color="#FFF3B0" />
        <Path path={P('M20 108 C 40 92, 60 100, 80 92 C 100 86, 116 96, 130 90 L130 120 L20 120 Z')} color="#9BD39B" />
        <RoundedRect x={20} y={28} width={110} height={92} r={8} style="stroke" strokeWidth={6} color={palette.woodLight} />
        <Line p1={vec(75, 28)} p2={vec(75, 120)} color={palette.woodLight} strokeWidth={4} />
        <Line p1={vec(20, 74)} p2={vec(130, 74)} color={palette.woodLight} strokeWidth={4} />
        {has('storefront') ? (
          <Group>
            <RoundedRect x={16} y={120} width={118} height={16} r={4} color={palette.woodDark} />
            {[30, 50, 70, 90, 110, 124].map((x, i) => (
              <Circle key={x} cx={x} cy={118} r={6} color={[palette.coral, palette.mustard, '#F2A7B8', palette.coral, palette.sky, palette.mustard][i]} />
            ))}
            <RoundedRect x={142} y={8} width={116} height={26} r={6} color={palette.navy} />
            <SkText x={152} y={26} text="TINY REPAIR SHOP" font={font} color={palette.mustard} />
          </Group>
        ) : null}

        {/* Hanging lamp */}
        <Group transform={lampT}>
          <Line p1={vec(200, 0)} p2={vec(200, 46)} color={palette.navySoft} strokeWidth={2} />
          <Path path={P('M184 62 L216 62 L208 46 L192 46 Z')} color={palette.mustardDeep} />
          <Oval x={170} y={60} width={60} height={24} color={withAlpha('#FFF3B0', 0.35)} />
          <Circle cx={200} cy={64} r={5} color="#FFF6D0" />
        </Group>

        {/* Pegboard with tools (always) and the pro tool bench gears */}
        <RoundedRect x={150} y={84} width={100} height={70} r={6} color="#D9B98A" />
        {Array.from({ length: 24 }).map((_, i) => (
          <Circle key={i} cx={160 + (i % 8) * 11.5} cy={92 + Math.floor(i / 8) * 20} r={1.6} color="#B08A5A" />
        ))}
        <Path path={P('M168 96 L168 130 M162 96 L174 96')} style="stroke" strokeWidth={4} color={palette.navySoft} strokeCap="round" />
        <Path path={P('M190 98 C 184 104, 196 110, 190 116 L190 132')} style="stroke" strokeWidth={4} color={palette.coral} strokeCap="round" />
        <Circle cx={230} cy={108} r={9} style="stroke" strokeWidth={4} color={palette.mustardDeep} />
        <Line p1={vec(230, 117)} p2={vec(230, 138)} color={palette.mustardDeep} strokeWidth={4} />
        {has('toolBench') ? (
          <Group>
            <Group transform={gearT}>
              <Path path={gearPath(128, 118, 14)} color={palette.brass} />
            </Group>
            <Group transform={gear2T}>
              <Path path={gearPath(146, 106, 9, 7)} color={palette.copper} />
            </Group>
          </Group>
        ) : null}

        {/* Main workbench (always) */}
        <Rect x={140} y={186} width={120} height={14} color={palette.woodLight} />
        <Rect x={146} y={200} width={10} height={50} color={palette.woodDark} />
        <Rect x={244} y={200} width={10} height={50} color={palette.woodDark} />
        <Rect x={140} y={186} width={120} height={4} color={lighten(palette.woodLight, 0.35)} />
        <Group transform={[{ translateX: 168 }, { translateY: 142 }, { scale: 0.24 }]}>
          <ObjectDrawing category="radio" variant={0} look={{ baseColor: palette.mint, accentColor: palette.mustard, pattern: 'none', finish: 'gloss', stickers: [], accessory: false }} on />
        </Group>

        {/* Bike stand (always) */}
        <Group transform={[{ translateX: -6 }, { translateY: 150 }, { scale: 0.52 }]}>
          <ObjectDrawing category="bicycle" variant={0} look={{ baseColor: palette.coral, accentColor: palette.navy, pattern: 'none', finish: 'gloss', stickers: [], accessory: false }} />
        </Group>
        <Line p1={vec(52, 206)} p2={vec(52, 252)} color={palette.navySoft} strokeWidth={4} />

        {has('cleaningStation') ? (
          <Group>
            <RoundedRect x={100} y={212} width={34} height={38} r={4} color="#CFE7EE" />
            <Rect x={98} y={208} width={38} height={6} color="#9FC6D2" />
            <Path path={P('M110 208 L110 196 L124 196')} style="stroke" strokeWidth={3} color="#8A8478" />
            <Circle cx={118} cy={200} r={4} color={withAlpha('#9FD8F7', 0.8)} />
          </Group>
        ) : null}

        {has('paintStation') ? (
          <Group>
            <Path path={P('M270 132 L298 132 L294 186 L274 186 Z')} color="#F4EBD9" />
            <Rect x={268} y={126} width={32} height={8} color={palette.woodDark} />
            <Circle cx={280} cy={150} r={6} color={palette.coral} />
            <Circle cx={290} cy={162} r={5} color={palette.sky} />
            <Circle cx={278} cy={170} r={5} color={palette.mustard} />
            {[0, 1, 2].map((i) => (
              <RoundedRect key={i} x={266 + i * 12} y={232} width={9} height={18} r={2} color={[palette.coral, palette.mint, palette.sky][i]} />
            ))}
          </Group>
        ) : null}

        {has('electronicsTable') ? (
          <Group>
            <Rect x={292} y={196} width={64} height={8} color={palette.woodLight} />
            <Rect x={296} y={204} width={6} height={46} color={palette.woodDark} />
            <Rect x={346} y={204} width={6} height={46} color={palette.woodDark} />
            <RoundedRect x={296} y={160} width={40} height={34} r={4} color={palette.navySoft} />
            <RoundedRect x={299} y={164} width={34} height={20} r={2} color="#123024" />
            <Path path={waveP} style="stroke" strokeWidth={1.6} color="#7FD3B4" />
          </Group>
        ) : null}

        {has('robotStation') ? (
          <Group>
            <Rect x={350} y={146} width={8} height={50} color={palette.navySoft} />
            <Path path={P('M354 150 L376 130 L388 142')} style="stroke" strokeWidth={6} color={palette.orange} strokeCap="round" strokeJoin="round" />
            <Circle cx={388} cy={142} r={5} color={palette.mustard} />
          </Group>
        ) : null}

        {has('musicCorner') ? (
          <Group transform={[{ translateX: 252 }, { translateY: 38 }, { scale: 0.32 }]}>
            <ObjectDrawing category="instrument" variant={0} look={{ baseColor: palette.woodLight, accentColor: palette.coral, pattern: 'none', finish: 'gloss', stickers: [], accessory: false }} />
          </Group>
        ) : null}

        {has('cameraBench') ? (
          <Group transform={[{ translateX: 206 }, { translateY: 162 }, { scale: 0.13 }]}>
            <ObjectDrawing category="camera" variant={1} look={{ baseColor: '#3B3B45', accentColor: palette.mustard, pattern: 'none', finish: 'matte', stickers: [], accessory: false }} />
          </Group>
        ) : null}

        {has('arcadeRoom') ? (
          <Group>
            <Group opacity={arcadeGlow}>
              <Oval x={318} y={60} width={90} height={110} color={withAlpha('#7CC6F2', 0.35)} />
            </Group>
            <Group transform={[{ translateX: 318 }, { translateY: 56 }, { scale: 0.46 }]}>
              <ObjectDrawing category="arcade" variant={0} look={{ baseColor: palette.navy, accentColor: palette.coral, pattern: 'none', finish: 'gloss', stickers: [], accessory: true }} on />
            </Group>
          </Group>
        ) : null}

        {has('waitingArea') ? (
          <Group>
            <RoundedRect x={10} y={268} width={62} height={34} r={10} color={palette.coral} />
            <RoundedRect x={4} y={256} width={18} height={44} r={8} color={palette.coralDeep} />
            <RoundedRect x={62} y={256} width={18} height={44} r={8} color={palette.coralDeep} />
            <RoundedRect x={86} y={286} width={18} height={18} r={3} color="#F4EBD9" />
            <Group transform={steamT} opacity={steamO}>
              <Circle cx={95} cy={280} r={4} color="#FFFFFF" />
            </Group>
          </Group>
        ) : null}

        {has('displayShelves') ? (
          <Group>
            {[44, 84].map((y) => (
              <Rect key={y} x={262} y={y} width={52} height={5} color={palette.woodDark} />
            ))}
            {shelves.map((item, i) => (
              <Group key={i} transform={[{ translateX: 262 + (i % 2) * 26 }, { translateY: i < 2 ? 18 : 58 }, { scale: 26 / ART }]}>
                <ObjectDrawing category={item.category} variant={item.variant} look={item.look} on />
              </Group>
            ))}
          </Group>
        ) : null}

        {/* Door: open with a customer when someone is waiting */}
        <RoundedRect x={356} y={176} width={40} height={74} r={4} color={palette.woodDark} />
        {visitor ? (
          <Group>
            <Rect x={360} y={180} width={34} height={70} color="#FFF3D6" />
            <Group transform={[{ translateX: 344 }, { translateY: 180 }, { scale: 0.62 }]}>
              <AvatarDrawing customer={visitor} mood="happy" />
            </Group>
            <Path path={P('M356 180 L346 186 L346 252 L356 250 Z')} color={darken(palette.woodDark, 0.2)} />
          </Group>
        ) : (
          <Group>
            <RoundedRect x={360} y={180} width={32} height={66} r={3} color={palette.wood} />
            <Circle cx={386} cy={216} r={2.5} color={palette.brass} />
          </Group>
        )}
      </Group>
    </Canvas>
  );
});

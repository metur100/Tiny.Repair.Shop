import {
  Canvas,
  Circle,
  Group,
  Line,
  LinearGradient,
  Oval,
  Path,
  RadialGradient,
  Rect,
  RoundedRect,
  Skia,
  vec,
  type SkPath,
} from '@shopify/react-native-skia';
import { memo, useMemo, type ReactElement } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { Category, Customization, StickerId } from '@/data/types';
import { darken, lighten, luminance, mix, withAlpha } from './color';

/** All object art is authored in a 200 × 200 box. */
export const ART = 200;

export interface ObjectLook {
  category: Category;
  variant: number;
  look: Customization;
  side?: 'front' | 'back';
  /** Shows the damage (cracks, loose parts, smoke). */
  broken?: boolean;
  /** Powered on / working (lights, screen glow). */
  on?: boolean;
}

const EMPTY = Skia.PathBuilder.Make().build();
const P = (svg: string): SkPath => Skia.Path.MakeFromSVGString(svg) ?? EMPTY;

function rr(x: number, y: number, w: number, h: number, r: number): SkPath {
  return Skia.PathBuilder.Make().addRRect(Skia.RRectXY(Skia.XYWHRect(x, y, w, h), r, r)).build();
}

function circlePath(cx: number, cy: number, r: number): SkPath {
  return Skia.PathBuilder.Make().addCircle(cx, cy, r).build();
}

function star(cx: number, cy: number, r: number): SkPath {
  const p = Skia.PathBuilder.Make();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const rr2 = i % 2 === 0 ? r : r * 0.45;
    const x = cx + Math.cos(a) * rr2;
    const y = cy + Math.sin(a) * rr2;
    if (i === 0) p.moveTo(x, y);
    else p.lineTo(x, y);
  }
  return p.close().build();
}

/** Base colour adjusted by the finish (pastel softens it). */
function baseOf(look: Customization): string {
  return look.finish === 'pastel' ? mix(look.baseColor, '#FFFFFF', 0.38) : look.baseColor;
}

const INK = '#2B1F1A';

/** Fill pattern inside a clip path, in the accent colour. */
const Pattern = memo(function Pattern({ path, look }: { path: SkPath; look: Customization }) {
  const b = path.getBounds();
  const color = withAlpha(luminance(look.accentColor) > 0.85 ? darken(look.accentColor, 0.3) : look.accentColor, 0.62);
  const items: ReactElement[] = [];
  const x0 = b.x - 10;
  const y0 = b.y - 10;
  const x1 = b.x + b.width + 10;
  const y1 = b.y + b.height + 10;
  switch (look.pattern) {
    case 'stripes':
      for (let x = x0 - b.height; x < x1; x += 22) items.push(<Line key={x} p1={vec(x, y1)} p2={vec(x + b.height + 20, y0)} color={color} strokeWidth={8} />);
      break;
    case 'dots':
      for (let y = y0; y < y1; y += 18) for (let x = x0 + ((y / 18) % 2) * 9; x < x1; x += 18) items.push(<Circle key={`${x}-${y}`} cx={x} cy={y} r={4.5} color={color} />);
      break;
    case 'checker':
      for (let y = y0, r = 0; y < y1; y += 16, r++) for (let x = x0 + (r % 2) * 16; x < x1; x += 32) items.push(<Rect key={`${x}-${y}`} x={x} y={y} width={16} height={16} color={color} />);
      break;
    case 'waves': {
      for (let y = y0; y < y1; y += 18) {
        const p = Skia.PathBuilder.Make().moveTo(x0, y);
        for (let x = x0; x <= x1; x += 6) p.lineTo(x, y + Math.sin(x / 9) * 4);
        items.push(<Path key={y} path={p.build()} style="stroke" strokeWidth={4} color={color} />);
      }
      break;
    }
    case 'stars':
      for (let y = y0 + 8, r = 0; y < y1; y += 26, r++) for (let x = x0 + (r % 2) * 13; x < x1; x += 26) items.push(<Path key={`${x}-${y}`} path={star(x, y, 6)} color={color} />);
      break;
    default:
      return null;
  }
  return <Group clip={path}>{items}</Group>;
});

/** A painted body part: fill (finish), pattern, gloss / metallic sheen and outline. */
const Body = memo(function Body({ path, look, color, outline = 3, flat }: { path: SkPath; look: Customization; color?: string; outline?: number; flat?: boolean }) {
  const base = color ?? baseOf(look);
  const b = path.getBounds();
  const metallic = look.finish === 'metallic' && !flat;
  const gloss = look.finish === 'gloss' && !flat;
  return (
    <Group>
      <Path path={path} color={base}>
        {metallic ? (
          <LinearGradient start={vec(b.x, b.y)} end={vec(b.x + b.width, b.y + b.height)} colors={[lighten(base, 0.45), base, darken(base, 0.25), lighten(base, 0.2), darken(base, 0.3)]} />
        ) : (
          <LinearGradient start={vec(0, b.y)} end={vec(0, b.y + b.height)} colors={[lighten(base, 0.12), base, darken(base, 0.12)]} />
        )}
      </Path>
      {look.pattern !== 'none' && !flat ? <Pattern path={path} look={look} /> : null}
      {gloss || metallic ? (
        <Group clip={path}>
          <Oval x={b.x + b.width * 0.08} y={b.y + b.height * 0.04} width={b.width * 0.55} height={b.height * 0.28} color={withAlpha('#FFFFFF', gloss ? 0.45 : 0.25)} />
        </Group>
      ) : null}
      <Path path={path} style="stroke" strokeWidth={outline} color={darken(base, 0.6)} strokeJoin="round" />
    </Group>
  );
});

const Screw = ({ x, y }: { x: number; y: number }) => (
  <Group>
    <Circle cx={x} cy={y} r={3.5} color="#C9C2B4" />
    <Line p1={vec(x - 2.5, y)} p2={vec(x + 2.5, y)} color="#6B6355" strokeWidth={1.2} />
  </Group>
);

const Smoke = ({ x, y }: { x: number; y: number }) => (
  <Group opacity={0.55}>
    <Circle cx={x} cy={y} r={8} color="#8A8478" />
    <Circle cx={x + 8} cy={y - 10} r={10} color="#9C968A" />
    <Circle cx={x - 2} cy={y - 22} r={7} color="#B0AA9E" />
  </Group>
);

const Crack = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <Path path={P(`M${x} ${y} l${8 * s} ${6 * s} l${-4 * s} ${7 * s} l${9 * s} ${8 * s} M${x + 8 * s} ${y + 6 * s} l${8 * s} ${-3 * s}`)} style="stroke" strokeWidth={2} color={withAlpha(INK, 0.75)} />
);

// ───────────────────────────── stickers & accessories ─────────────────────────────

const STICKER_SPOTS: Record<Category, [number, number][]> = {
  radio: [
    [52, 72],
    [150, 140],
    [100, 66],
  ],
  bicycle: [
    [98, 112],
    [80, 96],
    [118, 98],
  ],
  robot: [
    [80, 110],
    [120, 112],
    [100, 60],
  ],
  instrument: [
    [84, 150],
    [118, 160],
    [100, 132],
  ],
  camera: [
    [56, 132],
    [150, 132],
    [150, 86],
  ],
  arcade: [
    [64, 40],
    [136, 40],
    [100, 172],
  ],
};

export function stickerPath(id: StickerId, x: number, y: number, r: number): SkPath {
  switch (id) {
    case 'star':
      return star(x, y, r);
    case 'heart':
      return P(`M${x} ${y + r * 0.8} C${x - r * 1.4} ${y - r * 0.2} ${x - r * 0.6} ${y - r * 1.2} ${x} ${y - r * 0.35} C${x + r * 0.6} ${y - r * 1.2} ${x + r * 1.4} ${y - r * 0.2} ${x} ${y + r * 0.8}Z`);
    case 'bolt':
      return P(`M${x + r * 0.2} ${y - r} L${x - r * 0.6} ${y + r * 0.1} L${x} ${y + r * 0.1} L${x - r * 0.2} ${y + r} L${x + r * 0.6} ${y - r * 0.1} L${x} ${y - r * 0.1} Z`);
    case 'flower': {
      const p = Skia.PathBuilder.Make();
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        p.addCircle(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.45);
      }
      return p.build();
    }
    case 'note':
      return P(`M${x - r * 0.5} ${y + r * 0.6} a${r * 0.35} ${r * 0.28} 0 1 0 0.1 0 M${x - r * 0.15} ${y + r * 0.6} L${x - r * 0.15} ${y - r} L${x + r * 0.7} ${y - r * 0.6} L${x + r * 0.7} ${y - r * 0.3} L${x - r * 0.15} ${y - r * 0.7}`);
    case 'smile':
      return circlePath(x, y, r);
  }
}

const STICKER_COLOR: Record<StickerId, string> = { heart: '#EE6352', star: '#F2C14E', bolt: '#F28C38', flower: '#F2A7B8', note: '#7CC6F2', smile: '#F2C14E' };

const Stickers = memo(function Stickers({ category, ids }: { category: Category; ids: StickerId[] }) {
  return (
    <Group>
      {ids.slice(0, 3).map((id, i) => {
        const [x, y] = STICKER_SPOTS[category][i];
        return (
          <Group key={id}>
            <Path path={stickerPath(id, x, y, 11)} color="#FFFFFF" style="stroke" strokeWidth={5} strokeJoin="round" />
            <Path path={stickerPath(id, x, y, 11)} color={STICKER_COLOR[id]} />
            {id === 'smile' ? (
              <Group>
                <Circle cx={x - 3.5} cy={y - 2} r={1.6} color={INK} />
                <Circle cx={x + 3.5} cy={y - 2} r={1.6} color={INK} />
                <Path path={P(`M${x - 5} ${y + 3} Q${x} ${y + 8} ${x + 5} ${y + 3}`)} style="stroke" strokeWidth={1.6} color={INK} />
              </Group>
            ) : null}
          </Group>
        );
      })}
    </Group>
  );
});

// ───────────────────────────── categories ─────────────────────────────

function Radio({ variant, look, side, broken, on }: Required<Omit<ObjectLook, 'category'>>) {
  const accent = look.accentColor;
  const glow = on ? '#FFE9A8' : '#E8D9B8';
  if (side === 'back') {
    const body = rr(28, 52, 144, 112, 16);
    return (
      <Group>
        <Body path={body} look={look} />
        <RoundedRect x={42} y={66} width={116} height={84} r={8} color={darken(baseOf(look), 0.35)} />
        {[0, 1, 2, 3, 4].map((i) => (
          <RoundedRect key={i} x={54} y={74 + i * 9} width={50} height={4} r={2} color={darken(baseOf(look), 0.55)} />
        ))}
        <RoundedRect x={112} y={110} width={38} height={30} r={4} color="#5C5A56" />
        <Rect x={118} y={116} width={26} height={18} color={broken ? '#E5E2D2' : '#9C9A92'} />
        {broken ? (
          <Group>
            <Path path={P('M84 120 C 92 150, 70 150, 62 172')} style="stroke" strokeWidth={4} color="#D9433A" strokeCap="round" />
            <Path path={P('M96 122 C 100 140, 112 146, 118 168')} style="stroke" strokeWidth={4} color="#2F86C4" strokeCap="round" />
          </Group>
        ) : (
          <Path path={P('M84 120 L112 124 M96 128 L112 130')} style="stroke" strokeWidth={4} color="#D9433A" strokeCap="round" />
        )}
        <Screw x={36} y={60} />
        <Screw x={164} y={60} />
        <Screw x={36} y={156} />
        <Screw x={164} y={156} />
      </Group>
    );
  }
  const handle = (
    <Path path={P('M64 54 C 64 26, 136 26, 136 54')} style="stroke" strokeWidth={9} color={darken(accent, 0.25)} strokeCap="round" />
  );
  const speaker = (cx: number, cy: number, r: number) => (
    <Group>
      <Circle cx={cx} cy={cy} r={r + 3} color={darken(accent, 0.35)} />
      <Circle cx={cx} cy={cy} r={r} color={mix(accent, '#FFF6E6', 0.35)} />
      {Array.from({ length: Math.floor(r / 5) }).map((_, i) => (
        <Circle key={i} cx={cx} cy={cy} r={r - i * 5} style="stroke" strokeWidth={1.2} color={withAlpha(darken(accent, 0.5), 0.5)} />
      ))}
    </Group>
  );
  const dial = (x: number, y: number, w: number, h: number) => (
    <Group>
      <RoundedRect x={x} y={y} width={w} height={h} r={5} color={glow}>
        {on ? <RadialGradient c={vec(x + w / 2, y + h / 2)} r={w} colors={['#FFF6C8', '#F2C14E']} /> : null}
      </RoundedRect>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Line key={i} p1={vec(x + 5 + (i * (w - 10)) / 5, y + 4)} p2={vec(x + 5 + (i * (w - 10)) / 5, y + 10)} color={withAlpha(INK, 0.6)} strokeWidth={1.4} />
      ))}
      <Line p1={vec(x + w * (broken ? 0.15 : 0.62), y + 3)} p2={vec(x + w * (broken ? 0.15 : 0.62), y + h - 3)} color="#D9433A" strokeWidth={2.4} />
      <RoundedRect x={x} y={y} width={w} height={h} r={5} style="stroke" strokeWidth={2} color={darken(accent, 0.5)} />
    </Group>
  );
  const knob = (cx: number, cy: number, r = 9) => (
    <Group>
      <Circle cx={cx} cy={cy + 1.5} r={r} color={withAlpha(INK, 0.3)} />
      <Circle cx={cx} cy={cy} r={r} color={darken(accent, 0.15)} />
      <Line p1={vec(cx, cy)} p2={vec(cx, cy - r + 2)} color={lighten(accent, 0.6)} strokeWidth={2} />
    </Group>
  );
  switch (variant) {
    case 1: {
      const body = rr(56, 40, 88, 132, 14);
      return (
        <Group>
          <Line p1={vec(130, 44)} p2={vec(170, 4)} color="#B9B5AA" strokeWidth={3} />
          <Circle cx={170} cy={4} r={3} color="#B9B5AA" />
          <Body path={body} look={look} />
          <RoundedRect x={66} y={52} width={68} height={58} r={8} color={mix(accent, '#FFF6E6', 0.4)} />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <RoundedRect key={i} x={72} y={58 + i * 9} width={56} height={4} r={2} color={withAlpha(darken(accent, 0.5), 0.55)} />
          ))}
          {dial(66, 118, 68, 20)}
          {knob(78, 154)}
          {knob(122, 154)}
          {broken ? <Crack x={110} y={60} /> : null}
        </Group>
      );
    }
    case 2: {
      const body = P('M40 168 L40 92 C 40 40, 160 40, 160 92 L160 168 Z');
      return (
        <Group>
          <Body path={body} look={look} />
          <Path path={P('M58 128 L58 96 C 58 62, 142 62, 142 96 L142 128 Z')} color={mix(accent, '#FFF6E6', 0.35)} />
          {[0, 1, 2, 3, 4].map((i) => (
            <Line key={i} p1={vec(70 + i * 15, 70 + (i === 2 ? -4 : 0))} p2={vec(70 + i * 15, 128)} color={darken(baseOf(look), 0.35)} strokeWidth={5} strokeCap="round" />
          ))}
          {dial(74, 136, 52, 14)}
          {knob(58, 154, 8)}
          {knob(100, 157, 7)}
          {knob(142, 154, 8)}
          {broken ? <Crack x={120} y={92} /> : null}
        </Group>
      );
    }
    case 3: {
      const body = rr(14, 70, 172, 84, 14);
      return (
        <Group>
          <Path path={P('M50 70 L50 50 L150 50 L150 70')} style="stroke" strokeWidth={8} color={darken(accent, 0.3)} strokeJoin="round" />
          <Body path={body} look={look} />
          {speaker(52, 112, 26)}
          {speaker(148, 112, 26)}
          <RoundedRect x={82} y={92} width={36} height={24} r={4} color="#3B3B45" />
          <Rect x={88} y={98} width={24} height={12} color={on ? '#7FD3B4' : '#5C5A56'} />
          {dial(82, 124, 36, 12)}
          {broken ? <Crack x={130} y={84} /> : null}
        </Group>
      );
    }
    case 4: {
      const body = rr(70, 58, 60, 96, 12);
      return (
        <Group>
          <Body path={body} look={look} />
          {Array.from({ length: 16 }).map((_, i) => (
            <Circle key={i} cx={82 + (i % 4) * 12} cy={72 + Math.floor(i / 4) * 11} r={2.6} color={darken(baseOf(look), 0.5)} />
          ))}
          {dial(78, 120, 44, 14)}
          <RoundedRect x={126} y={84} width={10} height={36} r={5} color={darken(accent, 0.2)} />
          {broken ? <Crack x={92} y={130} s={0.8} /> : null}
        </Group>
      );
    }
    default: {
      const body = rr(28, 56, 144, 108, 18);
      return (
        <Group>
          {handle}
          <Body path={body} look={look} />
          {speaker(76, 110, 34)}
          {dial(116, 82, 46, 26)}
          {knob(126, 136)}
          {knob(152, 136)}
          {broken ? <Crack x={60} y={80} /> : null}
          {on ? <Circle cx={160} cy={70} r={4} color="#7FD3B4" /> : <Circle cx={160} cy={70} r={4} color="#8A8478" />}
        </Group>
      );
    }
  }
}

function Bicycle({ variant, look, side, broken }: Required<Omit<ObjectLook, 'category'>>) {
  const base = baseOf(look);
  const accent = look.accentColor;
  const flip = side === 'back';
  const small = variant === 4 || variant === 1;
  const wr = variant === 4 ? 26 : variant === 1 ? 28 : 34;
  const rear = { x: 52, y: 146 };
  const front = { x: 152, y: 146 };
  const crank = { x: 98, y: 146 };
  const seat = { x: 78, y: variant === 1 ? 104 : 86 };
  const head = { x: 136, y: variant === 1 ? 100 : 88 };
  const tyre = variant === 3 ? 4 : variant === 1 ? 9 : 6;
  const wheel = (c: { x: number; y: number }, flat: boolean, bent: boolean) => (
    <Group>
      {flat ? <Oval x={c.x - wr - 2} y={c.y - wr + 8} width={(wr + 2) * 2} height={wr * 2 - 4} style="stroke" strokeWidth={tyre + 2} color="#2E2B2A" /> : null}
      {!flat ? (
        bent ? (
          <Oval x={c.x - wr + 4} y={c.y - wr} width={wr * 2 - 8} height={wr * 2} style="stroke" strokeWidth={tyre} color="#2E2B2A" />
        ) : (
          <Circle cx={c.x} cy={c.y} r={wr} style="stroke" strokeWidth={tyre} color="#2E2B2A" />
        )
      ) : null}
      <Circle cx={c.x} cy={c.y} r={wr - tyre / 2 - 1} style="stroke" strokeWidth={1.6} color="#B9B5AA" />
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i / 8) * Math.PI;
        return (
          <Line
            key={i}
            p1={vec(c.x + Math.cos(a) * (wr - 4), c.y + Math.sin(a) * (wr - 4))}
            p2={vec(c.x - Math.cos(a) * (wr - 4), c.y - Math.sin(a) * (wr - 4))}
            color={withAlpha('#9C968A', 0.8)}
            strokeWidth={1}
          />
        );
      })}
      <Circle cx={c.x} cy={c.y} r={4} color="#8A8478" />
    </Group>
  );
  const frame = P(
    variant === 2
      ? `M${rear.x} ${rear.y} L${crank.x} ${crank.y} L${head.x - 6} ${head.y + 30} L${head.x} ${head.y} M${crank.x} ${crank.y} L${seat.x} ${seat.y} M${rear.x} ${rear.y} L${seat.x + 4} ${seat.y + 14}`
      : `M${rear.x} ${rear.y} L${crank.x} ${crank.y} L${seat.x} ${seat.y} L${head.x} ${head.y} L${crank.x} ${crank.y} M${rear.x} ${rear.y} L${seat.x} ${seat.y} M${head.x} ${head.y} L${front.x} ${front.y}`,
  );
  const fork = P(`M${head.x} ${head.y} L${front.x} ${front.y}`);
  return (
    <Group transform={flip ? [{ translateX: 200 }, { scaleX: -1 }] : []}>
      {wheel(rear, broken && variant !== 3 && variant !== 1, false)}
      {wheel(front, false, broken && (variant === 3 || variant === 1))}
      {variant === 4 ? (
        <Group>
          <Line p1={vec(rear.x - 6, rear.y)} p2={vec(rear.x - 24, rear.y + 14)} color="#8A8478" strokeWidth={3} />
          <Circle cx={rear.x - 26} cy={rear.y + 18} r={8} style="stroke" strokeWidth={4} color="#2E2B2A" />
        </Group>
      ) : null}
      {variant === 0 || variant === 2 ? (
        <Group>
          <Path path={P(`M${rear.x - wr} ${rear.y - 6} A ${wr + 4} ${wr + 4} 0 0 1 ${rear.x + wr * 0.6} ${rear.y - wr}`)} style="stroke" strokeWidth={4} color={darken(base, 0.2)} />
          <Path path={P(`M${front.x - wr * 0.6} ${front.y - wr} A ${wr + 4} ${wr + 4} 0 0 1 ${front.x + wr} ${front.y - 6}`)} style="stroke" strokeWidth={4} color={darken(base, 0.2)} />
        </Group>
      ) : null}
      <Path path={frame} style="stroke" strokeWidth={small ? 8 : 7} color={darken(base, 0.55)} strokeJoin="round" strokeCap="round" />
      <Path path={frame} style="stroke" strokeWidth={small ? 5 : 4.5} color={base} strokeJoin="round" strokeCap="round" />
      <Path path={fork} style="stroke" strokeWidth={4} color={darken(base, 0.3)} strokeCap="round" />
      {/* Chain and crank */}
      {broken && variant === 1 ? (
        <Path path={P(`M${crank.x} ${crank.y + 10} C ${crank.x - 10} ${crank.y + 34}, ${rear.x + 10} ${rear.y + 30}, ${rear.x} ${rear.y + 8}`)} style="stroke" strokeWidth={3} color="#6B6355" />
      ) : (
        <Path path={P(`M${rear.x} ${rear.y - 6} L${crank.x} ${crank.y - 10} M${rear.x} ${rear.y + 6} L${crank.x} ${crank.y + 10}`)} style="stroke" strokeWidth={2.5} color="#6B6355" />
      )}
      <Circle cx={crank.x} cy={crank.y} r={11} color="#8A8478" />
      <Circle cx={crank.x} cy={crank.y} r={11} style="stroke" strokeWidth={2} color="#5C5A56" />
      <Line p1={vec(crank.x, crank.y)} p2={vec(crank.x + 12, crank.y + 14)} color="#3B3B45" strokeWidth={4} strokeCap="round" />
      <RoundedRect x={crank.x + 8} y={crank.y + 12} width={12} height={5} r={2} color="#2E2B2A" />
      {/* Saddle and handlebar */}
      <Line p1={vec(seat.x, seat.y)} p2={vec(seat.x - 3, seat.y - 12)} color="#5C5A56" strokeWidth={4} />
      <Path path={P(`M${seat.x - 18} ${seat.y - 14} Q ${seat.x - 4} ${seat.y - 22} ${seat.x + 12} ${seat.y - 14} Z`)} color={darken(accent, 0.15)} />
      <Line p1={vec(head.x, head.y)} p2={vec(head.x - 2, head.y - 14)} color="#5C5A56" strokeWidth={4} />
      {variant === 3 ? (
        <Path path={P(`M${head.x - 2} ${head.y - 14} L${head.x + 14} ${head.y - 14} C ${head.x + 24} ${head.y - 12}, ${head.x + 22} ${head.y + 6}, ${head.x + 12} ${head.y + 4}`)} style="stroke" strokeWidth={4} color="#3B3B45" strokeCap="round" />
      ) : (
        <Path path={P(`M${head.x - 14} ${head.y - 22} Q ${head.x - 2} ${head.y - 12} ${head.x + 12} ${head.y - 20}`)} style="stroke" strokeWidth={4.5} color="#3B3B45" strokeCap="round" />
      )}
      <Circle cx={head.x - 14} cy={head.y - 22} r={3.5} color={accent} />
      {variant === 2 || look.accessory ? (
        <Group>
          <RoundedRect x={front.x - 8} y={head.y - 12} width={36} height={22} r={4} color="#C9A06A" />
          {[0, 1, 2, 3].map((i) => (
            <Line key={i} p1={vec(front.x - 8 + i * 9, head.y - 12)} p2={vec(front.x - 4 + i * 9, head.y + 10)} color="#8A6A3E" strokeWidth={1.5} />
          ))}
        </Group>
      ) : null}
      {broken && variant !== 1 && variant !== 3 ? <Crack x={crank.x - 20} y={crank.y - 36} s={0.7} /> : null}
    </Group>
  );
}

function Robot({ variant, look, side, broken, on }: Required<Omit<ObjectLook, 'category'>>) {
  const base = baseOf(look);
  const accent = look.accentColor;
  const eye = on ? '#9FF2FF' : broken ? '#3B3B45' : '#5C6B78';
  const back = side === 'back';
  const tiny = variant === 4;
  const s = tiny ? 0.72 : 1;
  const T = tiny ? [{ translateX: 28 }, { translateY: 46 }, { scale: s }] : [];
  const headPath = variant === 1 ? circlePath(100, 70, 34) : rr(62, 34, 76, 62, 16);
  const bodyPath = variant === 1 ? circlePath(100, 130, 42) : variant === 2 ? rr(66, 98, 68, 70, 14) : rr(56, 98, 88, 66, 14);
  return (
    <Group transform={T}>
      {variant === 2 || variant === 0 ? (
        <Group>
          <Line p1={vec(100, 34)} p2={vec(100, variant === 2 ? 4 : 16)} color="#8A8478" strokeWidth={3} />
          <Circle cx={100} cy={variant === 2 ? 4 : 16} r={6} color={on ? '#F2C14E' : accent} />
        </Group>
      ) : null}
      {/* Arms */}
      <Path path={P('M56 112 C 36 116, 30 138, 34 150')} style="stroke" strokeWidth={9} color={darken(base, 0.3)} strokeCap="round" />
      <Path path={P('M144 112 C 164 116, 170 138, 166 150')} style="stroke" strokeWidth={9} color={darken(base, 0.3)} strokeCap="round" />
      <Circle cx={34} cy={154} r={7} color={accent} />
      <Circle cx={166} cy={154} r={7} color={accent} />
      {/* Legs, wheel or tracks */}
      {variant === 3 ? (
        <Group>
          <RoundedRect x={46} y={160} width={108} height={30} r={15} color="#3B3B45" />
          {[0, 1, 2, 3].map((i) => (
            <Circle key={i} cx={62 + i * 25} cy={175} r={9} color="#8A8478" />
          ))}
        </Group>
      ) : variant === 1 ? (
        <Group>
          <Circle cx={100} cy={178} r={14} color="#3B3B45" />
          <Circle cx={100} cy={178} r={6} color="#8A8478" />
        </Group>
      ) : (
        <Group>
          <RoundedRect x={72} y={162} width={18} height={26} r={6} color={darken(base, 0.35)} />
          <RoundedRect x={110} y={162} width={18} height={26} r={6} color={darken(base, 0.35)} />
          <RoundedRect x={66} y={184} width={28} height={10} r={5} color={accent} />
          <RoundedRect x={106} y={184} width={28} height={10} r={5} color={accent} />
        </Group>
      )}
      <Body path={bodyPath} look={look} />
      <Body path={headPath} look={look} />
      {back ? (
        <Group>
          <RoundedRect x={80} y={112} width={40} height={30} r={6} color={darken(base, 0.4)} />
          {broken ? <Rect x={86} y={118} width={28} height={18} color="#1F1A17" /> : <RoundedRect x={86} y={118} width={28} height={18} r={3} color="#7FD3B4" />}
          {[0, 1, 2, 3].map((i) => (
            <Line key={i} p1={vec(76, 60 + i * 8)} p2={vec(124, 60 + i * 8)} color={darken(base, 0.45)} strokeWidth={3} />
          ))}
          <Screw x={70} y={104} />
          <Screw x={130} y={104} />
        </Group>
      ) : (
        <Group>
          {/* Face */}
          {variant === 1 ? null : <RoundedRect x={72} y={46} width={56} height={34} r={10} color="#1F2A44" />}
          <Circle cx={86} cy={63} r={7} color={eye} />
          <Circle cx={114} cy={63} r={7} color={eye} />
          {on ? (
            <Group>
              <Circle cx={86} cy={63} r={12} color={withAlpha('#9FF2FF', 0.35)} />
              <Circle cx={114} cy={63} r={12} color={withAlpha('#9FF2FF', 0.35)} />
            </Group>
          ) : null}
          <Path path={P(on ? 'M90 76 Q 100 82 110 76' : 'M90 78 L110 78')} style="stroke" strokeWidth={2.5} color={on ? '#9FF2FF' : '#5C6B78'} strokeCap="round" />
          {/* Chest screen */}
          <RoundedRect x={82} y={112} width={36} height={24} r={5} color="#1F2A44" />
          {broken ? (
            <Group>
              <Rect x={86} y={116} width={8} height={6} color="#EE6352" />
              <Rect x={100} y={124} width={10} height={6} color="#F2C14E" />
              <Rect x={90} y={128} width={6} height={4} color="#7CC6F2" />
            </Group>
          ) : (
            <Path path={P('M86 124 L94 124 L98 116 L104 132 L108 124 L114 124')} style="stroke" strokeWidth={2} color={on ? '#7FD3B4' : '#3A4766'} />
          )}
          {look.accessory ? <Path path={P('M88 98 L100 104 L112 98 L112 110 L100 104 L88 110 Z')} color={accent} /> : null}
          {broken ? <Smoke x={136} y={34} /> : null}
        </Group>
      )}
    </Group>
  );
}

function Instrument({ variant, look, side, broken }: Required<Omit<ObjectLook, 'category'>>) {
  const base = baseOf(look);
  const accent = look.accentColor;
  const back = side === 'back';
  const bodies = [
    P('M100 92 C 70 92, 58 108, 64 126 C 54 140, 50 176, 100 182 C 150 176, 146 140, 136 126 C 142 108, 130 92, 100 92 Z'),
    P('M100 110 C 80 110, 72 122, 76 134 C 68 144, 68 172, 100 176 C 132 172, 132 144, 124 134 C 128 122, 120 110, 100 110 Z'),
    P('M100 96 C 80 96, 74 108, 78 118 C 70 122, 70 130, 80 134 C 70 150, 74 178, 100 182 C 126 178, 130 150, 120 134 C 130 130, 130 122, 122 118 C 126 108, 120 96, 100 96 Z'),
    circlePath(100, 140, 42),
    P('M100 96 C 70 110, 62 150, 100 182 C 138 150, 130 110, 100 96 Z'),
  ];
  const body = bodies[variant] ?? bodies[0];
  const neckTop = variant === 1 ? 40 : 16;
  const strings = variant === 1 ? 4 : variant === 2 ? 4 : variant === 3 ? 5 : 6;
  return (
    <Group>
      {look.accessory ? <Path path={P('M64 126 C 30 90, 40 40, 92 26')} style="stroke" strokeWidth={6} color={accent} strokeCap="round" /> : null}
      <RoundedRect x={92} y={neckTop} width={16} height={100} r={3} color={darken(base, 0.45)} />
      {/* Headstock and pegs */}
      {variant === 2 ? (
        <Path path={P(`M100 ${neckTop + 4} C 112 ${neckTop - 2}, 112 ${neckTop - 16}, 100 ${neckTop - 14} C 92 ${neckTop - 12}, 96 ${neckTop - 4}, 102 ${neckTop - 6}`)} style="stroke" strokeWidth={6} color={darken(base, 0.4)} strokeCap="round" />
      ) : (
        <RoundedRect x={88} y={neckTop - 14} width={24} height={26} r={5} color={darken(base, 0.45)} />
      )}
      {Array.from({ length: Math.min(strings, 6) }).map((_, i) => {
        const left = i % 2 === 0;
        const y = neckTop - 8 + Math.floor(i / 2) * 9;
        const loose = broken && i === 1;
        return <RoundedRect key={i} x={left ? 78 : 112} y={y + (loose ? 3 : 0)} width={10} height={5} r={2} color={loose ? '#8A8478' : '#E8D9B8'} />;
      })}
      <Body path={body} look={look} />
      {back ? (
        <Group>
          {[0, 1, 2, 3, 4].map((i) => (
            <Path key={i} path={P(`M${70 + i * 15} 104 C ${66 + i * 15} 130, ${76 + i * 15} 156, ${72 + i * 15} 178`)} style="stroke" strokeWidth={1.5} color={withAlpha(darken(base, 0.5), 0.5)} />
          ))}
        </Group>
      ) : (
        <Group>
          {variant === 3 ? (
            <Group>
              <Circle cx={100} cy={140} r={34} color="#F4EBD9" />
              <Circle cx={100} cy={140} r={34} style="stroke" strokeWidth={3} color="#B9B5AA" />
            </Group>
          ) : variant === 2 ? (
            <Group>
              <Path path={P('M84 132 C 78 140, 90 148, 84 158')} style="stroke" strokeWidth={3} color={darken(base, 0.6)} />
              <Path path={P('M116 132 C 122 140, 110 148, 116 158')} style="stroke" strokeWidth={3} color={darken(base, 0.6)} />
            </Group>
          ) : (
            <Group>
              <Circle cx={100} cy={variant === 1 ? 134 : 128} r={variant === 1 ? 10 : 14} color="#2B1F1A" />
              <Circle cx={100} cy={variant === 1 ? 134 : 128} r={variant === 1 ? 13 : 17} style="stroke" strokeWidth={2.5} color={accent} />
            </Group>
          )}
          <RoundedRect x={84} y={160} width={32} height={6} r={2} color={darken(base, 0.6)} />
          {Array.from({ length: strings }).map((_, i) => {
            const x = 94 + (i * 12) / Math.max(1, strings - 1);
            const snapped = broken && i === 2;
            return snapped ? (
              <Path key={i} path={P(`M${x} 163 C ${x + 10} 150, ${x - 8} 140, ${x + 6} 130`)} style="stroke" strokeWidth={1.2} color="#C9C2B4" />
            ) : (
              <Line key={i} p1={vec(x, neckTop)} p2={vec(x, 163)} color="#E8E2D2" strokeWidth={1.1} />
            );
          })}
        </Group>
      )}
    </Group>
  );
}

function CameraArt({ variant, look, side, broken, on }: Required<Omit<ObjectLook, 'category'>>) {
  const base = baseOf(look);
  const accent = look.accentColor;
  const back = side === 'back';
  const shapes = [rr(44, 70, 112, 92, 12), rr(26, 74, 148, 80, 14), rr(36, 64, 128, 104, 22), rr(56, 40, 88, 140, 10), rr(28, 78, 144, 76, 10)];
  const body = shapes[variant] ?? shapes[0];
  const lens = (cx: number, cy: number, r: number) => (
    <Group>
      <Circle cx={cx} cy={cy} r={r + 6} color={darken(base, 0.45)} />
      <Circle cx={cx} cy={cy} r={r + 6} style="stroke" strokeWidth={2} color={accent} />
      <Circle cx={cx} cy={cy} r={r} color="#1F2A44">
        <RadialGradient c={vec(cx - r * 0.3, cy - r * 0.3)} r={r * 1.4} colors={['#5A7AA8', '#1F2A44', '#0E1424']} />
      </Circle>
      <Circle cx={cx - r * 0.35} cy={cy - r * 0.35} r={r * 0.22} color={withAlpha('#FFFFFF', 0.55)} />
      {broken ? (
        <Group>
          <Line p1={vec(cx - r * 0.7, cy - r * 0.2)} p2={vec(cx + r * 0.6, cy + r * 0.4)} color={withAlpha('#FFFFFF', 0.6)} strokeWidth={1.2} />
          <Line p1={vec(cx - r * 0.3, cy + r * 0.6)} p2={vec(cx + r * 0.5, cy - r * 0.5)} color={withAlpha('#FFFFFF', 0.5)} strokeWidth={1} />
        </Group>
      ) : null}
    </Group>
  );
  return (
    <Group>
      {look.accessory ? <Path path={P('M40 96 C 20 30, 180 30, 160 96')} style="stroke" strokeWidth={5} color={accent} /> : null}
      {variant === 4 ? (
        <Group>
          <Path path={P('M70 96 L46 78 L46 156 L70 138 Z')} color="#3B3B45" />
          {[0, 1, 2].map((i) => (
            <Line key={i} p1={vec(52 + i * 6, 82 + i * 4)} p2={vec(52 + i * 6, 152 - i * 4)} color="#5C5A56" strokeWidth={2} />
          ))}
        </Group>
      ) : null}
      <Body path={body} look={look} />
      {/* Leatherette band */}
      {variant !== 2 ? <Rect x={variant === 1 ? 26 : variant === 4 ? 28 : 44} y={variant === 3 ? 110 : 108} width={variant === 1 ? 148 : variant === 3 ? 88 : variant === 4 ? 144 : 112} height={variant === 3 ? 30 : 28} color={withAlpha('#2B1F1A', 0.35)} /> : <Rect x={36} y={136} width={128} height={10} color={accent} />}
      {back ? (
        <Group>
          <RoundedRect x={86} y={88} width={28} height={20} r={4} color="#1F2A44" />
          <Circle cx={100} cy={98} r={6} color={broken ? '#8A8478' : '#5A7AA8'} />
          <Line p1={vec(150, 80)} p2={vec(150, 150)} color={darken(base, 0.5)} strokeWidth={3} />
          <Circle cx={60} cy={70} r={8} color="#B9B5AA" />
        </Group>
      ) : variant === 3 ? (
        <Group>
          {lens(100, 82, 18)}
          {lens(100, 138, 22)}
        </Group>
      ) : (
        lens(variant === 1 ? 104 : 100, variant === 2 ? 118 : 116, variant === 1 ? 24 : 26)
      )}
      {!back ? (
        <Group>
          {/* Flash, viewfinder and shutter button */}
          <RoundedRect x={variant === 3 ? 60 : 48} y={variant === 3 ? 46 : 76} width={22} height={14} r={3} color={on ? '#FFF6C8' : broken ? '#5C5A56' : '#E8E2D2'} />
          {on ? <Circle cx={(variant === 3 ? 60 : 48) + 11} cy={(variant === 3 ? 46 : 76) + 7} r={18} color={withAlpha('#FFF6C8', 0.5)} /> : null}
          <RoundedRect x={128} y={variant === 3 ? 46 : 76} width={18} height={12} r={3} color="#1F2A44" />
          <RoundedRect x={140} y={variant === 3 ? 30 : 60} width={16} height={10} r={3} color={accent} />
          {variant === 2 ? <Rect x={60} y={156} width={80} height={6} color="#1F1A17" /> : null}
        </Group>
      ) : null}
    </Group>
  );
}

function Arcade({ variant, look, side, broken, on }: Required<Omit<ObjectLook, 'category'>>) {
  const base = baseOf(look);
  const accent = look.accentColor;
  const back = side === 'back';
  const shapes = [
    P('M52 12 L148 12 L148 40 L140 46 L140 96 L160 120 L160 196 L40 196 L40 120 L60 96 L60 46 L52 40 Z'),
    P('M48 70 L152 70 L152 88 L146 92 L146 132 L164 152 L164 186 L36 186 L36 152 L54 132 L54 92 L48 88 Z'),
    rr(22, 100, 156, 66, 12),
    P('M66 40 L134 40 L134 58 L128 62 L128 112 L142 128 L142 188 L58 188 L58 128 L72 112 L72 62 L66 58 Z'),
    P('M46 20 L154 20 L154 52 L146 58 L146 104 L170 128 L170 196 L30 196 L30 128 L54 104 L54 58 L46 52 Z'),
  ];
  const cab = shapes[variant] ?? shapes[0];
  const screen = variant === 2 ? { x: 56, y: 108, w: 88, h: 40 } : variant === 1 ? { x: 62, y: 94, w: 76, h: 36 } : variant === 3 ? { x: 76, y: 64, w: 48, h: 44 } : variant === 4 ? { x: 62, y: 60, w: 76, h: 42 } : { x: 66, y: 48, w: 68, h: 46 };
  const panelY = variant === 2 ? 150 : variant === 1 ? 140 : variant === 3 ? 122 : variant === 4 ? 112 : 104;
  const buttons = ['#EE6352', '#F2C14E', '#7FD3B4'];
  return (
    <Group>
      {variant === 2 ? (
        <Group>
          <Rect x={46} y={166} width={10} height={30} color={darken(base, 0.4)} />
          <Rect x={144} y={166} width={10} height={30} color={darken(base, 0.4)} />
        </Group>
      ) : null}
      <Body path={cab} look={look} />
      {back ? (
        <Group>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <RoundedRect key={i} x={70} y={56 + i * 10} width={60} height={4} r={2} color={darken(base, 0.45)} />
          ))}
          <RoundedRect x={74} y={140} width={52} height={40} r={4} color={darken(base, 0.3)} />
          <Circle cx={100} cy={188} r={5} color="#3B3B45" />
          {broken ? <Path path={P('M100 188 C 110 196, 130 192, 140 198')} style="stroke" strokeWidth={4} color="#2B2A33" strokeCap="round" /> : <Path path={P('M100 188 L100 199')} style="stroke" strokeWidth={4} color="#2B2A33" />}
        </Group>
      ) : (
        <Group>
          {variant !== 2 ? (
            <Group>
              <RoundedRect x={screen.x - 8} y={variant === 1 ? 74 : variant === 3 ? 44 : 18} width={screen.w + 16} height={14} r={4} color={on ? '#F2C14E' : darken(accent, 0.2)} />
              {look.accessory
                ? [0, 1, 2, 3, 4].map((i) => (
                    <Circle key={i} cx={screen.x - 2 + (i * (screen.w + 4)) / 4} cy={(variant === 1 ? 74 : variant === 3 ? 44 : 18) + 7} r={3} color={on ? '#FFF6C8' : '#E8D9B8'} />
                  ))
                : null}
            </Group>
          ) : null}
          <RoundedRect x={screen.x - 4} y={screen.y - 4} width={screen.w + 8} height={screen.h + 8} r={6} color="#1F1A17" />
          <RoundedRect x={screen.x} y={screen.y} width={screen.w} height={screen.h} r={4} color={on ? '#1F3A5C' : '#141414'}>
            {on ? <LinearGradient start={vec(0, screen.y)} end={vec(0, screen.y + screen.h)} colors={['#2F86C4', '#1F2A44']} /> : null}
          </RoundedRect>
          {on ? (
            <Group>
              <Rect x={screen.x + screen.w * 0.2} y={screen.y + screen.h * 0.6} width={8} height={8} color="#F2C14E" />
              <Rect x={screen.x + screen.w * 0.6} y={screen.y + screen.h * 0.3} width={8} height={8} color="#EE6352" />
              <Rect x={screen.x + screen.w * 0.4} y={screen.y + screen.h * 0.45} width={6} height={6} color="#7FD3B4" />
            </Group>
          ) : null}
          {broken && on ? (
            <Group>
              <Rect x={screen.x + 10} y={screen.y + 8} width={5} height={5} color="#000" />
              <Rect x={screen.x + screen.w - 18} y={screen.y + 18} width={5} height={5} color="#000" />
            </Group>
          ) : null}
          {/* Control panel */}
          <RoundedRect x={variant === 2 ? 40 : screen.x - 10} y={panelY} width={variant === 2 ? 120 : screen.w + 20} height={18} r={4} color={darken(base, 0.35)} />
          {variant === 4 ? (
            <Group>
              <Circle cx={100} cy={panelY + 4} r={16} style="stroke" strokeWidth={5} color="#2B2A33" />
              <Line p1={vec(100, panelY - 12)} p2={vec(100, panelY + 20)} color="#2B2A33" strokeWidth={4} />
            </Group>
          ) : (
            <Group>
              <Line p1={vec(screen.x + 6, panelY + 9)} p2={vec(screen.x + (broken ? 2 : 6), panelY - 6)} color="#2B2A33" strokeWidth={4} />
              <Circle cx={screen.x + (broken ? 2 : 6)} cy={panelY - 8} r={5} color="#EE6352" />
              {buttons.map((c, i) =>
                broken && i === 1 ? (
                  <Circle key={i} cx={screen.x + screen.w * 0.5 + i * 12} cy={panelY + 9} r={4} color="#5C5A56" />
                ) : (
                  <Circle key={i} cx={screen.x + screen.w * 0.5 + i * 12} cy={panelY + 9} r={4.5} color={c} />
                ),
              )}
            </Group>
          )}
          {variant !== 2 ? (
            <Group>
              <RoundedRect x={88} y={panelY + 40} width={24} height={30} r={3} color={darken(base, 0.4)} />
              <Rect x={94} y={panelY + 48} width={4} height={10} color={accent} />
              <Rect x={102} y={panelY + 48} width={4} height={10} color={accent} />
            </Group>
          ) : null}
        </Group>
      )}
    </Group>
  );
}

const DRAW: Record<Category, (p: Required<Omit<ObjectLook, 'category'>>) => ReactElement> = {
  radio: Radio,
  bicycle: Bicycle,
  robot: Robot,
  instrument: Instrument,
  camera: CameraArt,
  arcade: Arcade,
};

/** The object drawn into an existing Skia canvas, in the 200 × 200 art box. */
export const ObjectDrawing = memo(function ObjectDrawing({ category, variant, look, side = 'front', broken = false, on = false }: ObjectLook) {
  const Draw = DRAW[category];
  return (
    <Group>
      <Oval x={30} y={182} width={140} height={16} color={withAlpha('#5B3A26', 0.18)} />
      <Draw variant={variant} look={look} side={side} broken={broken} on={on} />
      {side === 'front' && look.stickers.length ? <Stickers category={category} ids={look.stickers} /> : null}
    </Group>
  );
});

export interface ObjectArtProps extends ObjectLook {
  size: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

/** Stand-alone object picture (cards, previews, results). */
export const ObjectArt = memo(function ObjectArt({ size, style, accessibilityLabel, ...look }: ObjectArtProps) {
  const transform = useMemo(() => [{ scale: size / ART }], [size]);
  return (
    <Canvas style={[{ width: size, height: size }, style]} accessible={!!accessibilityLabel} accessibilityLabel={accessibilityLabel} accessibilityRole="image">
      <Group transform={transform}>
        <ObjectDrawing {...look} />
      </Group>
    </Canvas>
  );
});

/** Rough silhouette of each category in the art box (cleaning dirt is only placed inside). */
function distToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

export function silhouette(category: Category, variant: number): (u: number, v: number) => boolean {
  const inBox = (u: number, v: number, x: number, y: number, w: number, h: number) => u * ART >= x && u * ART <= x + w && v * ART >= y && v * ART <= y + h;
  switch (category) {
    case 'radio':
      return variant === 3 ? (u, v) => inBox(u, v, 14, 70, 172, 84) : variant === 1 ? (u, v) => inBox(u, v, 56, 40, 88, 132) : variant === 4 ? (u, v) => inBox(u, v, 70, 58, 60, 96) : (u, v) => inBox(u, v, 28, 46, 144, 122);
    case 'bicycle': {
      // Same geometry as <Bicycle>: two wheels plus the frame tubes, saddle and handlebar.
      const wr = variant === 4 ? 26 : variant === 1 ? 28 : 34;
      const seat = { x: 78, y: variant === 1 ? 104 : 86 };
      const head = { x: 136, y: variant === 1 ? 100 : 88 };
      const rear = { x: 52, y: 146 };
      const front = { x: 152, y: 146 };
      const crank = { x: 98, y: 146 };
      const tubes: [typeof rear, typeof rear][] = [
        [rear, crank],
        [crank, seat],
        [seat, head],
        [head, crank],
        [rear, seat],
        [head, front],
        [seat, { x: seat.x - 6, y: seat.y - 18 }],
        [head, { x: head.x + 8, y: head.y - 16 }],
      ];
      return (u, v) => {
        const x = u * ART;
        const y = v * ART;
        if (Math.hypot(x - rear.x, y - rear.y) <= wr + 4 || Math.hypot(x - front.x, y - front.y) <= wr + 4) return true;
        return tubes.some(([a, b]) => distToSegment(x, y, a.x, a.y, b.x, b.y) <= 9);
      };
    }
    case 'robot':
      return variant === 4 ? (u, v) => inBox(u, v, 50, 70, 100, 110) : (u, v) => inBox(u, v, 40, 34, 120, 156);
    case 'instrument':
      return (u, v) => inBox(u, v, 58, 18, 84, 166);
    case 'camera':
      return variant === 3 ? (u, v) => inBox(u, v, 56, 40, 88, 140) : (u, v) => inBox(u, v, 26, 64, 148, 104);
    case 'arcade':
      return variant === 2 ? (u, v) => inBox(u, v, 22, 100, 156, 66) : (u, v) => inBox(u, v, 36, 14, 128, 182);
  }
}

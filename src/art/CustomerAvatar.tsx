import { Canvas, Circle, Group, Oval, Path, RoundedRect, Skia, type SkPath } from '@shopify/react-native-skia';
import { memo, useMemo } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { Customer } from '@/data/types';
import type { Mood } from '@/utils/economy';
import { darken, lighten } from './color';

const EMPTY = Skia.PathBuilder.Make().build();
const P = (svg: string): SkPath => Skia.Path.MakeFromSVGString(svg) ?? EMPTY;
const INK = '#2B1F1A';

/** Face drawn in a 100 × 100 box. */
export const AvatarDrawing = memo(function AvatarDrawing({ customer, mood = 'happy' }: { customer: Customer; mood?: Mood }) {
  const { skin, hair, hairStyle, shirt, glasses, hat, beard } = customer.looks;
  const mouth =
    mood === 'delighted'
      ? P('M38 64 Q50 78 62 64 Z')
      : mood === 'happy'
        ? P('M40 64 Q50 72 60 64')
        : mood === 'neutral'
          ? P('M42 66 L58 66')
          : P('M40 70 Q50 62 60 70');
  const brow = mood === 'disappointed' ? 3 : 0;
  return (
    <Group>
      {/* Shoulders and collar */}
      <Path path={P('M14 100 C 16 80, 30 74, 50 74 C 70 74, 84 80, 86 100 Z')} color={shirt} />
      <Path path={P('M40 74 L50 86 L60 74')} color={lighten(shirt, 0.35)} />
      {/* Long hair behind the head */}
      {hairStyle === 'long' ? <Path path={P('M24 44 C 22 70, 26 86, 36 88 L64 88 C 74 86, 78 70, 76 44 Z')} color={hair} /> : null}
      {hairStyle === 'bun' ? <Circle cx={50} cy={14} r={10} color={hair} /> : null}
      {/* Neck and head */}
      <RoundedRect x={42} y={60} width={16} height={16} r={6} color={darken(skin, 0.12)} />
      <Oval x={24} y={18} width={52} height={58} color={skin} />
      <Circle cx={25} cy={50} r={6} color={darken(skin, 0.06)} />
      <Circle cx={75} cy={50} r={6} color={darken(skin, 0.06)} />
      {/* Hair */}
      {hairStyle === 'short' ? <Path path={P('M24 42 C 22 20, 40 12, 52 14 C 66 14, 80 22, 76 42 C 70 30, 60 26, 50 28 C 40 26, 30 32, 24 42 Z')} color={hair} /> : null}
      {hairStyle === 'long' || hairStyle === 'bun' ? <Path path={P('M24 44 C 22 18, 78 18, 76 44 C 68 30, 32 30, 24 44 Z')} color={hair} /> : null}
      {hairStyle === 'curly' ? (
        <Group>
          {[28, 38, 50, 62, 72, 33, 67].map((x, i) => (
            <Circle key={i} cx={x} cy={i < 5 ? 24 + Math.abs(50 - x) * 0.25 : 34} r={9} color={hair} />
          ))}
        </Group>
      ) : null}
      {hairStyle === 'mohawk' ? <Path path={P('M42 30 L46 6 L52 24 L56 4 L60 28 Z')} color={hair} /> : null}
      {hairStyle === 'bald' ? (
        <Group>
          <Path path={P('M24 46 C 24 40, 28 38, 30 44 Z')} color={hair} />
          <Path path={P('M76 46 C 76 40, 72 38, 70 44 Z')} color={hair} />
        </Group>
      ) : null}
      {/* Eyes and brows */}
      {mood === 'delighted' ? (
        <Group>
          <Path path={P('M34 46 Q39 40 44 46')} style="stroke" strokeWidth={3} color={INK} strokeCap="round" />
          <Path path={P('M56 46 Q61 40 66 46')} style="stroke" strokeWidth={3} color={INK} strokeCap="round" />
        </Group>
      ) : (
        <Group>
          <Circle cx={39} cy={46} r={3.6} color={INK} />
          <Circle cx={61} cy={46} r={3.6} color={INK} />
          <Circle cx={40} cy={45} r={1.1} color="#FFFFFF" />
          <Circle cx={62} cy={45} r={1.1} color="#FFFFFF" />
        </Group>
      )}
      <Path path={P(`M33 ${37 + brow} L44 ${37 - brow}`)} style="stroke" strokeWidth={2.4} color={darken(hair, 0.2)} strokeCap="round" />
      <Path path={P(`M56 ${37 - brow} L67 ${37 + brow}`)} style="stroke" strokeWidth={2.4} color={darken(hair, 0.2)} strokeCap="round" />
      {/* Cheeks */}
      <Circle cx={33} cy={56} r={5} color="rgba(238,99,82,0.25)" />
      <Circle cx={67} cy={56} r={5} color="rgba(238,99,82,0.25)" />
      {beard ? <Path path={P('M30 56 C 32 76, 68 76, 70 56 C 64 66, 36 66, 30 56 Z')} color={hair} /> : null}
      <Path path={mouth} style={mood === 'delighted' ? 'fill' : 'stroke'} strokeWidth={2.6} color={mood === 'delighted' ? '#8A2F28' : INK} strokeCap="round" />
      {glasses ? (
        <Group>
          <Circle cx={39} cy={46} r={8} style="stroke" strokeWidth={2.2} color={INK} />
          <Circle cx={61} cy={46} r={8} style="stroke" strokeWidth={2.2} color={INK} />
          <Path path={P('M47 46 L53 46')} style="stroke" strokeWidth={2.2} color={INK} />
        </Group>
      ) : null}
      {hat === 'beanie' ? (
        <Group>
          <Path path={P('M24 36 C 24 10, 76 10, 76 36 Z')} color="#EE6352" />
          <RoundedRect x={22} y={32} width={56} height={8} r={4} color="#C2432F" />
          <Circle cx={50} cy={10} r={5} color="#F2C14E" />
        </Group>
      ) : null}
      {hat === 'cap' ? (
        <Group>
          <Path path={P('M26 34 C 26 14, 74 14, 74 34 Z')} color="#2F86C4" />
          <Path path={P('M60 32 L90 34 L88 38 L60 36 Z')} color="#1F5A8A" />
        </Group>
      ) : null}
      {hat === 'beret' ? <Path path={P('M22 32 C 18 16, 70 10, 80 26 C 70 30, 40 34, 22 32 Z')} color="#7A5AA8" /> : null}
    </Group>
  );
});

/** A customer's portrait in a round frame. */
export const CustomerAvatar = memo(function CustomerAvatar({ customer, size = 64, mood, style, framed = true }: { customer: Customer; size?: number; mood?: Mood; style?: StyleProp<ViewStyle>; framed?: boolean }) {
  const t = useMemo(() => [{ scale: size / 100 }], [size]);
  return (
    <Canvas style={[{ width: size, height: size }, style]} accessible accessibilityRole="image" accessibilityLabel={`${customer.name}${mood ? `, looking ${mood}` : ''}`}>
      <Group transform={t}>
        {framed ? <Circle cx={50} cy={50} r={50} color="#FBE9CC" /> : null}
        <Group clip={framed ? Skia.PathBuilder.Make().addCircle(50, 50, 50).build() : undefined}>
          <Group transform={[{ translateY: 6 }]}>
            <AvatarDrawing customer={customer} mood={mood} />
          </Group>
        </Group>
        {framed ? <Circle cx={50} cy={50} r={48.5} style="stroke" strokeWidth={3} color="#E8D5B5" /> : null}
      </Group>
    </Canvas>
  );
});

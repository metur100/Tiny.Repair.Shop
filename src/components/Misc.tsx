import { MaterialCommunityIcons } from '@expo/vector-icons';
import { memo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { haptic } from '@/services/haptics';
import { palette, radius, spacing, touch, useColors } from '@/theme';
import { AppText } from './AppText';

/** Three stars, filled up to `value`, with a text equivalent for screen readers. */
export const StarRow = memo(function StarRow({ value, size = 22 }: { value: number; size?: number }) {
  return (
    <View style={styles.row} accessible accessibilityLabel={`${value} of 3 stars`}>
      {[1, 2, 3].map((i) => (
        <MaterialCommunityIcons key={i} name={i <= value ? 'star' : 'star-outline'} size={size} color={i <= value ? palette.mustardDeep : '#B9A88E'} />
      ))}
    </View>
  );
});

/** Small labelled pill (difficulty, priority…). Always text + colour, never colour alone. */
export const Pill = memo(function Pill({ label, color, icon, textColor }: { label: string; color: string; icon?: keyof typeof MaterialCommunityIcons.glyphMap; textColor?: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: color }]}>
      {icon ? <MaterialCommunityIcons name={icon} size={13} color={textColor ?? '#1F2A44'} /> : null}
      <AppText variant="caption" color={textColor ?? '#1F2A44'}>
        {label}
      </AppText>
    </View>
  );
});

export const SectionHeader = memo(function SectionHeader({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="heading" accessibilityRole="header">
        {title}
      </AppText>
      {right}
    </View>
  );
});

/** Settings row with a switch; the whole row is one accessible toggle. */
export const ToggleRow = memo(function ToggleRow({
  label,
  description,
  value,
  onChange,
  icon,
  testID,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  testID?: string;
}) {
  const c = useColors();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityHint={description}
      accessibilityState={{ checked: value }}
      onPress={() => {
        haptic('tick');
        onChange(!value);
      }}
      style={[styles.toggle, { borderColor: c.border }]}
    >
      <View style={[styles.toggleIcon, { backgroundColor: c.surfaceAlt }]}>
        <MaterialCommunityIcons name={icon} size={22} color={c.text} />
      </View>
      <View style={styles.flex}>
        <AppText variant="bodyStrong">{label}</AppText>
        {description ? (
          <AppText variant="caption" muted>
            {description}
          </AppText>
        ) : null}
      </View>
      <AppText variant="label" muted>
        {value ? 'On' : 'Off'}
      </AppText>
      <Switch
        value={value}
        onValueChange={(v) => {
          haptic('tick');
          onChange(v);
        }}
        trackColor={{ false: '#D8CBB5', true: palette.mintDeep }}
        thumbColor="#fff"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
    </Pressable>
  );
});

/** Round icon button (back, close, settings) with a 52dp touch target. */
export const IconButton = memo(function IconButton({ icon, onPress, label, tint }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; onPress: () => void; label: string; tint?: string }) {
  const c = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        haptic('tap');
        onPress();
      }}
      style={({ pressed }) => [styles.iconBtn, { backgroundColor: tint ?? c.surface, borderColor: c.border, transform: [{ scale: pressed ? 0.92 : 1 }] }]}
    >
      <MaterialCommunityIcons name={icon} size={24} color={c.text} />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 2 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  section: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.lg, marginBottom: spacing.sm },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, minHeight: touch + 8 },
  toggleIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  iconBtn: { width: touch, height: touch, borderRadius: touch / 2, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
});

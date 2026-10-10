import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { BottomTabBarProps } from 'expo-router/tabs';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { haptic } from '@/services/haptics';
import { palette, radius, shadows, spacing, useColors } from '@/theme';
import { AppText } from './AppText';

const ICONS: Record<string, { icon: keyof typeof MaterialCommunityIcons.glyphMap; label: string }> = {
  workshop: { icon: 'home-variant', label: 'Workshop' },
  jobs: { icon: 'clipboard-text', label: 'Jobs' },
  collection: { icon: 'cards', label: 'Collection' },
  shop: { icon: 'storefront', label: 'Shop' },
};

export const TAB_BAR_HEIGHT = 72;

/** Wooden tab bar with big labelled tabs (icon + text, never icon alone). */
export const BottomTabBar = memo(function BottomTabBar({ state, navigation }: BottomTabBarProps) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  return (
    // Opaque cream backing so scrolled content never shows around or below the floating bar.
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, spacing.sm), backgroundColor: c.background }]} pointerEvents="box-none">
      <View style={[styles.bar, shadows.lg, { backgroundColor: c.surface, borderColor: c.wood }]} accessibilityRole="tablist">
        {state.routes.map((route, index) => {
          const meta = ICONS[route.name];
          if (!meta) return null;
          const focused = state.index === index;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityLabel={meta.label}
              accessibilityState={{ selected: focused }}
              testID={`tab-${route.name}`}
              onPress={() => {
                const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) {
                  haptic('tick');
                  navigation.navigate(route.name, route.params);
                }
              }}
              style={styles.tab}
            >
              {/* Never flattened, so the rounded highlight keeps its corners when it switches on. */}
              <View collapsable={false} style={[styles.iconWrap, { backgroundColor: focused ? palette.orange : 'transparent' }]}>
                <MaterialCommunityIcons name={meta.icon} size={24} color={focused ? '#3B1B05' : c.textMuted} />
              </View>
              <AppText variant="caption" color={focused ? c.text : c.textMuted}>
                {meta.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: spacing.md, paddingTop: spacing.xs },
  bar: { flexDirection: 'row', borderRadius: radius.xl, borderWidth: 3, paddingVertical: 6, maxWidth: 560, width: '100%', alignSelf: 'center' },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 56, gap: 2 },
  iconWrap: { width: 48, height: 32, borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
});

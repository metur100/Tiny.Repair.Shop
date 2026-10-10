import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ConfirmModal } from '@/components/Modal';
import { IconButton, SectionHeader, ToggleRow } from '@/components/Misc';
import { Screen } from '@/components/Screen';
import { syncMusic } from '@/services/audio';
import { haptic } from '@/services/haptics';
import { useGameStore } from '@/store/useGameStore';
import { spacing } from '@/theme';

export default function SettingsScreen() {
  const settings = useGameStore((s) => s.settings);
  const update = useGameStore((s) => s.updateSettings);
  const reset = useGameStore((s) => s.resetProgress);
  const [confirm, setConfirm] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <Screen scroll testID="settings-screen">
      <View style={styles.top}>
        <IconButton icon="arrow-left" label="Back" onPress={() => router.back()} />
        <AppText variant="title" accessibilityRole="header">
          Settings
        </AppText>
        <View style={styles.spacer} />
      </View>

      <Card>
        <SectionHeader title="Sound & feel" />
        <ToggleRow icon="volume-high" label="Sound effects" description="Taps, tools, coins and chimes" value={settings.sound} onChange={(v) => update({ sound: v })} testID="toggle-sound" />
        <ToggleRow
          icon="music"
          label="Music"
          description="Gentle workshop tunes"
          value={settings.music}
          onChange={(v) => {
            update({ music: v });
            setTimeout(syncMusic, 0);
          }}
          testID="toggle-music"
        />
        <ToggleRow
          icon="vibrate"
          label="Vibration"
          description="Haptic feedback for repairs and rewards"
          value={settings.vibration}
          onChange={(v) => {
            update({ vibration: v });
            if (v) haptic('correct');
          }}
          testID="toggle-vibration"
        />
        <SectionHeader title="Accessibility" />
        <ToggleRow icon="motion-pause" label="Reduced motion" description="Calmer animations, no bounces or particles" value={settings.reducedMotion} onChange={(v) => update({ reducedMotion: v })} testID="toggle-motion" />
        <ToggleRow icon="contrast-circle" label="High contrast" description="Stronger colours and borders, no paper texture" value={settings.highContrast} onChange={(v) => update({ highContrast: v })} testID="toggle-contrast" />
      </Card>

      <Card style={styles.block}>
        <SectionHeader title="Privacy" />
        <AppText muted>
          Tiny Repair Shop works completely offline. There are no accounts, no ads, no analytics and no tracking. Your progress is saved only on this device and is never sent anywhere.
        </AppText>
      </Card>

      <Card style={styles.block}>
        <SectionHeader title="Progress" />
        <AppText muted style={styles.resetText}>
          Start the workshop from scratch. Your settings are kept.
        </AppText>
        <Button label={resetDone ? 'Progress reset' : 'Reset progress'} icon="restore" variant="danger" onPress={() => setConfirm(true)} testID="reset-progress" />
      </Card>

      <AppText variant="caption" muted center style={styles.version}>
        Tiny Repair Shop {version} · Made by Medin Turkes
      </AppText>

      <ConfirmModal
        visible={confirm}
        title="Reset progress?"
        message="All repairs, coins, reputation and upgrades will be deleted. This cannot be undone."
        confirmLabel="Delete progress"
        danger
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          setConfirm(false);
          void reset().then(() => setResetDone(true));
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  spacer: { width: 52 },
  block: { marginTop: spacing.md },
  resetText: { marginBottom: spacing.md },
  version: { marginTop: spacing.xl },
});

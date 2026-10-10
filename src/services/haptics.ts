import * as Haptics from 'expo-haptics';

import { useGameStore } from '@/store/useGameStore';

export type HapticKind = 'tap' | 'correct' | 'error' | 'complete' | 'sale' | 'upgrade' | 'tick';

let lastTick = 0;

/**
 * Tactile feedback (respects the vibration setting; silently ignored where unsupported).
 * `minGap` (ms) throttles feedback fired from continuous gestures.
 */
export function haptic(kind: HapticKind, minGap = 0): void {
  if (!useGameStore.getState().settings.vibration) return;
  if (minGap) {
    const now = Date.now();
    if (now - lastTick < minGap) return;
    lastTick = now;
  }
  try {
    switch (kind) {
      case 'tick':
        void Haptics.selectionAsync();
        break;
      case 'tap':
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'correct':
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'error':
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case 'complete':
      case 'sale':
      case 'upgrade':
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
    }
  } catch {
    // Unsupported platform.
  }
}

import { useReducedMotion } from 'react-native-reanimated';

import { useSettings } from '@/store/useGameStore';

/** True when animations should be minimal: the in-game setting or the OS accessibility setting. */
export function useReduceMotion(): boolean {
  const os = useReducedMotion();
  const setting = useSettings((s) => s.reducedMotion);
  return os || setting;
}

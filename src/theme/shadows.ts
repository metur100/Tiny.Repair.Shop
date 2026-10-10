import { Platform, type ViewStyle } from 'react-native';

import { palette } from './colors';

/** Soft, warm drop shadows (wood-brown tint rather than black). */
function shadow(height: number, radius: number, opacity: number, elevation: number): ViewStyle {
  return Platform.select<ViewStyle>({
    ios: { shadowColor: palette.shadow, shadowOffset: { width: 0, height }, shadowRadius: radius, shadowOpacity: opacity },
    android: { elevation, shadowColor: palette.shadow },
    default: { boxShadow: `0px ${height}px ${radius * 2}px rgba(91,58,38,${opacity})` } as ViewStyle,
  }) as ViewStyle;
}

export const shadows = {
  sm: shadow(2, 4, 0.12, 2),
  md: shadow(5, 10, 0.16, 5),
  lg: shadow(10, 18, 0.2, 10),
};

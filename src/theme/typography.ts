import type { TextStyle } from 'react-native';

/** Fredoka (SIL OFL) is bundled through @expo-google-fonts/fredoka and loaded in the root layout. */
export const fonts = {
  regular: 'Fredoka_400Regular',
  medium: 'Fredoka_500Medium',
  semibold: 'Fredoka_600SemiBold',
  bold: 'Fredoka_700Bold',
} as const;

export const type = {
  display: { fontFamily: fonts.bold, fontSize: 34, lineHeight: 40 } satisfies TextStyle,
  title: { fontFamily: fonts.bold, fontSize: 26, lineHeight: 32 } satisfies TextStyle,
  heading: { fontFamily: fonts.semibold, fontSize: 20, lineHeight: 26 } satisfies TextStyle,
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 22 } satisfies TextStyle,
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 22 } satisfies TextStyle,
  label: { fontFamily: fonts.semibold, fontSize: 14, lineHeight: 18 } satisfies TextStyle,
  caption: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 17 } satisfies TextStyle,
  number: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 22 } satisfies TextStyle,
};

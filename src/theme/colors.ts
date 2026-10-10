/** Cozy workshop palette. Every pairing used for text meets WCAG AA on its background. */
export const palette = {
  cream: '#FFF6E6',
  creamDeep: '#FBE9CC',
  paper: '#FFFBF3',
  navy: '#1F2A44',
  navySoft: '#3A4766',
  ink: '#2B2A33',
  mint: '#7FD3B4',
  mintDeep: '#2E9C7A',
  orange: '#F28C38',
  orangeDeep: '#C9631A',
  coral: '#EE6352',
  coralDeep: '#C2432F',
  mustard: '#F2C14E',
  mustardDeep: '#B98A14',
  sky: '#7CC6F2',
  skyDeep: '#2F86C4',
  wood: '#8A5A3B',
  woodDark: '#5B3A26',
  woodLight: '#C08A5E',
  brass: '#D4A84A',
  copper: '#C77B4A',
  white: '#FFFFFF',
  shadow: '#5B3A26',
} as const;

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  primary: string;
  primaryText: string;
  accent: string;
  success: string;
  danger: string;
  warning: string;
  info: string;
  border: string;
  wood: string;
  woodDark: string;
  brass: string;
}

export const lightColors: ThemeColors = {
  background: palette.cream,
  surface: palette.paper,
  surfaceAlt: palette.creamDeep,
  text: palette.navy,
  textMuted: '#5A6380',
  primary: palette.orange,
  primaryText: '#3B1B05',
  accent: palette.mint,
  success: palette.mintDeep,
  danger: palette.coralDeep,
  warning: palette.mustardDeep,
  info: palette.skyDeep,
  border: '#E8D5B5',
  wood: palette.wood,
  woodDark: palette.woodDark,
  brass: palette.brass,
};

/** High-contrast mode: stronger text and borders, flatter surfaces. */
export const highContrastColors: ThemeColors = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#F3F3F3',
  text: '#000000',
  textMuted: '#1F2A44',
  primary: '#B5520F',
  primaryText: '#FFFFFF',
  accent: '#1E7A5C',
  success: '#145C44',
  danger: '#9E2412',
  warning: '#7A5A00',
  info: '#155A8A',
  border: '#000000',
  wood: '#4A2A16',
  woodDark: '#2E190C',
  brass: '#8A6418',
};

/** Paint swatches for the customisation studio. */
export const paintColors = [
  { id: 'coral', name: 'Coral', color: palette.coral },
  { id: 'orange', name: 'Tangerine', color: palette.orange },
  { id: 'mustard', name: 'Mustard', color: palette.mustard },
  { id: 'mint', name: 'Mint', color: palette.mint },
  { id: 'sky', name: 'Sky', color: palette.sky },
  { id: 'navy', name: 'Navy', color: palette.navy },
  { id: 'cream', name: 'Cream', color: '#F4E3C3' },
  { id: 'wood', name: 'Walnut', color: palette.wood },
  { id: 'lilac', name: 'Lilac', color: '#B9A3E3' },
  { id: 'rose', name: 'Rose', color: '#F2A7B8' },
  { id: 'forest', name: 'Forest', color: '#3F7D5A' },
  { id: 'charcoal', name: 'Charcoal', color: '#3B3B45' },
] as const;

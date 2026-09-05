/** QuietRoutine design tokens — exact values from the design system. */
export const tokens = {
  canvasLight: '#FBFDFF',
  componentBG: '#FFFFFF',
  glassOverlay: 'rgba(255, 255, 255, 0.70)',
  glassBorder: 'rgba(255, 255, 255, 0.80)',
  primaryText: '#1A2236',
  mutedText: '#64748B',
  skyAccent: '#38BDF8',
  iceTint: '#E0F2FE',
  activeQuiet: '#0284C7',
  mapBorder: '#E2E8F0',
  activeGreen: '#22C55E',
  mutePin: '#EF4444',
} as const;

export type ThemeColors = {
  text: string;
  background: string;
  backgroundAlt: string;
  tint: string;
  tintDeep: string;
  tabIconDefault: string;
  tabIconSelected: string;
  card: string;
  glass: string;
  glassBorder: string;
  glassInner: string;
  border: string;
  muted: string;
  success: string;
  danger: string;
  accent: string;
  iceTint: string;
  activeQuiet: string;
  mutePin: string;
  switchOff: string;
  switchOn: string;
};

const light: ThemeColors = {
  text: tokens.primaryText,
  background: tokens.canvasLight,
  backgroundAlt: tokens.iceTint,
  tint: tokens.skyAccent,
  tintDeep: tokens.activeQuiet,
  tabIconDefault: tokens.mutedText,
  tabIconSelected: tokens.skyAccent,
  card: tokens.componentBG,
  glass: tokens.glassOverlay,
  glassBorder: tokens.glassBorder,
  glassInner: 'rgba(255, 255, 255, 0.92)',
  border: tokens.mapBorder,
  muted: tokens.mutedText,
  success: tokens.activeGreen,
  danger: '#FB7185',
  accent: tokens.iceTint,
  iceTint: tokens.iceTint,
  activeQuiet: tokens.activeQuiet,
  mutePin: tokens.mutePin,
  switchOff: '#CBD5E1',
  switchOn: tokens.skyAccent,
};

// Keep dark identical to light so any leftover scheme reads stay readable
// on the light glass canvas.
const dark: ThemeColors = { ...light };

export default {
  light,
  dark,
};

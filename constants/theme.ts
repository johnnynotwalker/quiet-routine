import { tokens } from './Colors';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  screen: 24,
} as const;

export const radius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  button: 28,
  pill: 999,
} as const;

export const shadow = {
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 6,
  },
  soft: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  button: {
    shadowColor: tokens.skyAccent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 4,
  },
  glow: {
    shadowColor: tokens.skyAccent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 0,
  },
} as const;

export const switchColors = {
  on: tokens.skyAccent,
  off: '#CBD5E1',
  thumb: '#FFFFFF',
} as const;

export const typography = {
  display: { fontSize: 34, fontWeight: '600' as const, letterSpacing: -0.8 },
  hero: { fontSize: 34, fontWeight: '600' as const, letterSpacing: -0.8 },
  title: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.4 },
  heading: { fontSize: 18, fontWeight: '500' as const, letterSpacing: -0.2 },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  caption: { fontSize: 12, fontWeight: '500' as const, lineHeight: 16 },
  label: { fontSize: 14, fontWeight: '600' as const },
};

const tintColorLight = '#5B5FC7';
const tintColorDark = '#A5A9FF';

export default {
  light: {
    text: '#111827',
    background: '#F8FAFC',
    tint: tintColorLight,
    tabIconDefault: '#94A3B8',
    tabIconSelected: tintColorLight,
    card: '#FFFFFF',
    border: '#E2E8F0',
    muted: '#64748B',
    success: '#059669',
    danger: '#DC2626',
    accent: '#EEF2FF',
  },
  dark: {
    text: '#F8FAFC',
    background: '#0F172A',
    tint: tintColorDark,
    tabIconDefault: '#64748B',
    tabIconSelected: tintColorDark,
    card: '#1E293B',
    border: '#334155',
    muted: '#94A3B8',
    success: '#34D399',
    danger: '#F87171',
    accent: '#312E81',
  },
};

export type ThemeColors = typeof import('./Colors').default.light;

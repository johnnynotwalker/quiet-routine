const sky = '#38BDF8';
const skyDeep = '#0EA5E9';

export default {
  light: {
    text: '#0F172A',
    background: '#F0F9FF',
    backgroundAlt: '#E0F2FE',
    tint: sky,
    tintDeep: skyDeep,
    tabIconDefault: '#94A3B8',
    tabIconSelected: sky,
    card: '#FFFFFF',
    glass: 'rgba(255, 255, 255, 0.72)',
    glassBorder: 'rgba(255, 255, 255, 0.9)',
    border: 'rgba(148, 163, 184, 0.22)',
    muted: '#64748B',
    success: '#38BDF8',
    danger: '#FB7185',
    accent: 'rgba(56, 189, 248, 0.14)',
    switchOff: '#CBD5E1',
    switchOn: sky,
  },
  dark: {
    text: '#F8FAFC',
    background: '#0C1929',
    backgroundAlt: '#102A43',
    tint: sky,
    tintDeep: '#7DD3FC',
    tabIconDefault: '#64748B',
    tabIconSelected: sky,
    card: '#152238',
    glass: 'rgba(21, 34, 56, 0.75)',
    glassBorder: 'rgba(148, 163, 184, 0.18)',
    border: 'rgba(148, 163, 184, 0.15)',
    muted: '#94A3B8',
    success: '#38BDF8',
    danger: '#FB7185',
    accent: 'rgba(56, 189, 248, 0.18)',
    switchOff: '#475569',
    switchOn: sky,
  },
};

export type ThemeColors = typeof import('./Colors').default.light;

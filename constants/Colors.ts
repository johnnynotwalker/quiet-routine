const sky = '#38BDF8';
const skyDeep = '#0EA5E9';

export default {
  light: {
    text: '#0F172A',
    background: '#DBEAFE',
    backgroundAlt: '#BFDBFE',
    tint: sky,
    tintDeep: skyDeep,
    tabIconDefault: '#64748B',
    tabIconSelected: skyDeep,
    card: '#FFFFFF',
    glass: 'rgba(255, 255, 255, 0.94)',
    glassBorder: 'rgba(100, 116, 139, 0.32)',
    glassInner: 'rgba(255, 255, 255, 0.88)',
    border: 'rgba(100, 116, 139, 0.35)',
    muted: '#475569',
    success: '#38BDF8',
    danger: '#FB7185',
    accent: 'rgba(56, 189, 248, 0.2)',
    switchOff: '#94A3B8',
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
    glass: 'rgba(21, 34, 56, 0.88)',
    glassBorder: 'rgba(148, 163, 184, 0.35)',
    glassInner: 'rgba(30, 48, 72, 0.85)',
    border: 'rgba(148, 163, 184, 0.28)',
    muted: '#94A3B8',
    success: '#38BDF8',
    danger: '#FB7185',
    accent: 'rgba(56, 189, 248, 0.22)',
    switchOff: '#475569',
    switchOn: sky,
  },
};

export type ThemeColors = typeof import('./Colors').default.light;

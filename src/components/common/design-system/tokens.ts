/** 교회이음 Premium Design System — Warm Yellow Soft-3D */

export type IconSizeVariant = 'sidebar' | 'mobile' | 'desktop' | 'list';

export const DS = {
  colors: {
    /* Primary Warm Yellow */
    primary: '#FFCD00',
    primaryHover: '#F5BE00',
    primaryPressed: '#E6B000',
    primaryLight: '#FFF7D6',
    primarySoft: '#FFFBEA',

    /* Surfaces */
    bgPage: '#FFFDF7',
    bgSurface: '#FFFFFF',
    bgSidebar: '#FFFFFF',
    bgGray: '#F5F5F5',

    /* Text */
    textPrimary: '#1A1A1A',
    textSecondary: '#4B5563',
    textMuted: '#9CA3AF',
    textInverse: '#1A1A1A',
    textOnYellow: '#1A1A1A',

    /* Borders */
    borderSubtle: '#F5F5F5',
    borderCard: '#ECECEC',
    borderDefault: '#ECECEC',

    /* Active sidebar — soft yellow highlight (not filled capsule) */
    activeBg: '#FFF7D6',
    activeText: '#1A1A1A',
    activeAccent: '#FFCD00',

    /* Accent palette */
    accentBlue: '#4A8CFF',
    accentPurple: '#7B6EF6',
    accentGreen: '#22C55E',
    accentOrange: '#FF9D42',
    accentRed: '#FF5A5F',
    accentTeal: '#00BFA6',
    accentPink: '#FF5DA8',
    accentNavy: '#1E293B',

    successGreen: '#22C55E',
    navInactive: '#9CA3AF',

    /* Role badges */
    badgeMemberBg: '#FFF7D6',
    badgeMemberText: '#B45309',
    badgePastorBg: '#E8F5E9',
    badgePastorText: '#15803D',
    badgeAdminBg: '#FFF7D6',
    badgeAdminText: '#92400E',

    bannerGradient:
      'linear-gradient(135deg, #FFFBEA 0%, #FFF7D6 40%, #FFFFFF 100%)',
    profileRing: '#FFCD00',
  },
  radius: {
    card: 24,
    cardMobile: 24,
    banner: 24,
    btn: 18,
    capsule: 16,
    input: 18,
  },
  shadow: {
    card: '0 8px 30px rgba(0,0,0,0.06)',
    cardHover: '0 12px 40px rgba(0,0,0,0.10)',
    iconDrop: '0 8px 20px rgba(0,0,0,0.10)',
    iconDropSoft: '0 4px 12px rgba(0,0,0,0.08)',
    banner: '0 8px 30px rgba(255,205,0,0.12)',
    btnPrimary: '0 4px 14px rgba(255,205,0,0.35)',
  },
  spacing: {
    gridGapMobile: 12,
    gridGapDesktop: 16,
    sectionGap: 28,
  },
  layout: {
    contentMax: 900,
    sidebarWidth: 240,
    bannerHeight: 180,
    cardHeightDesktop: 168,
    cardHeightMobile: 118,
  },
  icon: {
    sidebar: { size: 28, container: 32 },
    mobile: { size: 52, container: 64 },
    desktop: { size: 56, container: 72 },
    list: { size: 40, container: 48 },
  },
  typography: {
    pageTitle: { size: 26, weight: 700 },
    bannerTitle: { size: 22, weight: 700 },
    menuLabel: { size: 14, weight: 600 },
    body: { size: 15, weight: 500 },
    caption: { size: 13, weight: 400 },
  },
} as const;

export function iconSpec(variant: IconSizeVariant) {
  return DS.icon[variant];
}

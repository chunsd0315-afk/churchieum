/** 교회이음 Design System — Color Leather · KidsNote · Premium 3D */

export type IconSizeVariant = 'sidebar' | 'mobile' | 'desktop' | 'list';

export const DS = {
  colors: {
    /* Gold primary (buttons / accent) */
    primary: '#E7B447',
    primaryHover: '#D7A63A',
    primaryPressed: '#C7952F',
    primaryLight: '#FFF3C4',
    primarySoft: '#FFF5E8',
    premiumYellow: '#FFCD00',

    /* Leather browns (points only — never full UI) */
    leather: '#8A542F',
    leatherDeep: '#4A2B1A',
    leatherLight: '#D8A875',
    gold: '#E7B447',

    /* Surfaces — bright ivory / white */
    bgPage: '#FFF9F2',
    bgSurface: '#FFFFFF',
    bgIvory: '#FFF5E8',
    bgSidebar: '#FFF9F2',
    bgGray: '#F7F1EA',

    /* Text */
    textPrimary: '#2A211C',
    textSecondary: '#5C524A',
    textMuted: '#8A7E75',
    textInverse: '#FFFFFF',
    textOnYellow: '#2A211C',

    /* Borders */
    borderSubtle: '#F3EBE3',
    borderCard: '#EADFD5',
    borderDefault: '#EADFD5',

    /* Active sidebar — soft gold / light brown */
    activeBg: '#FFF0CF',
    activeText: '#4A2B1A',
    activeAccent: '#E7B447',

    /* Accent palette (color leather icons) */
    accentBlue: '#5B8DEF',
    accentPurple: '#9B7EDE',
    accentGreen: '#4CAF70',
    accentOrange: '#F0A05A',
    accentRed: '#E85D5D',
    accentTeal: '#3DB8A8',
    accentPink: '#F07A9A',
    accentCoral: '#E8796A',
    accentNavy: '#4A2B1A',
    accentBrown: '#8A542F',

    successGreen: '#4CAF70',
    navInactive: '#8A7E75',

    /* Role badges */
    badgeMemberBg: '#FFF3C4',
    badgeMemberText: '#8A542F',
    badgePastorBg: '#E8F5E9',
    badgePastorText: '#2E7D4F',
    badgeAdminBg: '#FFF0CF',
    badgeAdminText: '#4A2B1A',

    bannerGradient:
      'linear-gradient(135deg, #FFF5E8 0%, #FFF9F2 45%, #FFFFFF 100%)',
    profileRing: '#E7B447',
  },
  radius: {
    card: 24,
    cardMobile: 20,
    banner: 28,
    btn: 18,
    capsule: 16,
    input: 18,
  },
  shadow: {
    card: '0 8px 30px rgba(80,50,30,0.07)',
    cardHover: '0 14px 36px rgba(80,50,30,0.12)',
    iconDrop: '0 8px 20px rgba(80,50,30,0.16)',
    iconDropSoft: '0 4px 12px rgba(80,50,30,0.10)',
    banner: '0 12px 36px rgba(138,84,47,0.10)',
    btnPrimary: '0 4px 14px rgba(231,180,71,0.35)',
  },
  spacing: {
    gridGapMobile: 8,
    gridGapDesktop: 16,
    sectionGap: 24,
  },
  layout: {
    contentMax: 900,
    sidebarWidth: 240,
    bannerHeight: 190,
    bannerHeightMobile: 168,
    cardHeightDesktop: 168,
    cardHeightMobile: 118,
  },
  icon: {
    sidebar: { size: 28, container: 32 },
    mobile: { size: 56, container: 60 },
    desktop: { size: 64, container: 72 },
    list: { size: 40, container: 48 },
  },
  typography: {
    pageTitle: { size: 26, weight: 700 },
    bannerTitle: { size: 22, weight: 700 },
    menuLabel: { size: 13, weight: 700 },
    body: { size: 15, weight: 500 },
    caption: { size: 12, weight: 400 },
  },
} as const;

export function iconSpec(variant: IconSizeVariant) {
  return DS.icon[variant];
}

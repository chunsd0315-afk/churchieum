/** 교회이음 v0.4 — 블루 통일 3D 젤리 홈 디자인 시스템 */

export type IconSizeVariant = 'sidebar' | 'mobile' | 'desktop';

export const DS = {
  colors: {
    /* Primary blue scale */
    primary: '#2563EB',
    primaryLight: '#DBEAFE',
    skyBlue: '#A7D8FF',
    softBlueBg: '#EFF6FF',
    bgPage: '#F8FAFC',
    bgSurface: '#FFFFFF',
    bgSidebar: '#FAFAFA',
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    textMuted: '#6B7280',
    textInverse: '#FFFFFF',
    borderSubtle: '#F3F4F6',
    borderCard: '#E5E7EB',
    borderDefault: '#E5E7EB',
    activeCapsule: '#2563EB',
    activeCapsuleShadow: '0 4px 16px rgba(37, 99, 235, 0.38)',
    accentYellow: '#FFD24D',
    successGreen: '#22C55E',
    navInactive: '#9CA3AF',
    /* Role badges only — not global theme */
    badgeMemberBg: '#DBEAFE',
    badgeMemberText: '#1D4ED8',
    badgePastorBg: '#D1FAE5',
    badgePastorText: '#047857',
    badgeAdminBg: '#FEF3C7',
    badgeAdminText: '#B45309',
    bannerGradient:
      'linear-gradient(135deg, #DBEAFE 0%, #EFF6FF 45%, #F0F9FF 100%)',
    profileRing: '#2563EB',
  },
  radius: {
    card: 20,
    cardMobile: 20,
    banner: 24,
    capsule: 14,
  },
  shadow: {
    card: '0 8px 24px rgba(15, 23, 42, 0.06)',
    cardHover: '0 12px 32px rgba(15, 23, 42, 0.08)',
    iconDrop: '0 8px 18px rgba(15, 23, 42, 0.12)',
    iconDropSoft: '0 4px 10px rgba(15, 23, 42, 0.08)',
    banner: '0 8px 24px rgba(37, 99, 235, 0.08)',
  },
  spacing: {
    gridGapMobile: 12,
    gridGapDesktop: 14,
    sectionGap: 24,
  },
  layout: {
    contentMax: 900,
    sidebarWidth: 240,
    bannerHeight: 168,
    cardHeightDesktop: 180,
    cardHeightMobile: 120,
  },
  icon: {
    sidebar: { size: 26, container: 28 },
    mobile: { size: 60, container: 72 },
    desktop: { size: 68, container: 88 },
  },
  typography: {
    pageTitle: { size: 26, weight: 700 },
    bannerTitle: { size: 22, weight: 700 },
    menuLabel: { size: 14, weight: 600 },
    body: { size: 15, weight: 400 },
    caption: { size: 13, weight: 400 },
  },
} as const;

export function iconSpec(variant: IconSizeVariant) {
  return DS.icon[variant];
}

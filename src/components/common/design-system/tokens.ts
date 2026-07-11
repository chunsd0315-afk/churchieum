/** 교회이음 v4 — 3D 젤리 홈 디자인 시스템 */

export type IconSizeVariant = 'sidebar' | 'mobile' | 'desktop';

export const DS = {
  colors: {
    bgPage: '#FFFFFF',
    bgSurface: '#FFFFFF',
    bgSidebar: '#FAFAFA',
    textPrimary: '#111827',
    textSecondary: '#374151',
    textMuted: '#6B7280',
    textInverse: '#FFFFFF',
    borderSubtle: '#F3F4F6',
    borderCard: '#E8ECF2',
    borderDefault: '#E8ECF2',
    activeCapsule: '#2563EB',
    activeCapsuleShadow: '0 4px 16px rgba(37, 99, 235, 0.38)',
    bannerGradient:
      'linear-gradient(118deg, #E8F4FD 0%, #E6F7F0 42%, #FFF8EE 78%, #FFFFFF 100%)',
  },
  radius: {
    card: 20,
    cardMobile: 18,
    banner: 24,
    capsule: 14,
  },
  shadow: {
    card: '0 2px 8px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.06)',
    cardHover: '0 4px 12px rgba(15, 23, 42, 0.06), 0 16px 40px rgba(15, 23, 42, 0.10)',
    iconDrop: '0 8px 18px rgba(15, 23, 42, 0.14)',
    iconDropSoft: '0 4px 10px rgba(15, 23, 42, 0.10)',
    banner: '0 4px 24px rgba(37, 99, 235, 0.10), 0 2px 8px rgba(15, 23, 42, 0.04)',
  },
  spacing: {
    gridGapMobile: 11,
    gridGapDesktop: 14,
    sectionGap: 28,
  },
  layout: {
    contentMax: 900,
    sidebarWidth: 240,
    bannerHeight: 190,
    cardHeightDesktop: 180,
    cardHeightMobile: 118,
  },
  /** 아이콘 실제 크기 / 컨테이너 크기 */
  icon: {
    sidebar: { size: 26, container: 28 },
    mobile: { size: 58, container: 72 },
    desktop: { size: 70, container: 90 },
  },
} as const;

export function iconSpec(variant: IconSizeVariant) {
  return DS.icon[variant];
}

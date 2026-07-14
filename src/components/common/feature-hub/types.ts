import type { LucideIcon } from 'lucide-react';

/** FeatureHub 카드에 표시될 역할 */
export type FeatureHubRole = 'member' | 'pastor' | 'super_admin';

export type FeatureCardConfig = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  /** Tailwind: 아이콘 배경 (예: bg-emerald-50) */
  iconBg: string;
  /** Tailwind: 아이콘 색 (예: text-emerald-600) */
  iconColor: string;
  /**
   * 이 카드가 보일 역할. 비어 있으면 전원에게 표시.
   * pastor 카드는 AuthContext.isPastor(true for pastor+super_admin)과 매칭.
   */
  roles?: FeatureHubRole[];
  badge?: string | number;
  disabled?: boolean;
};

export type FeatureHubPageConfig = {
  title: string;
  description: string;
  features: FeatureCardConfig[];
};

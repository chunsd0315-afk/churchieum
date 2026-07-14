import type { FeatureCardConfig, FeatureHubRole } from './types';

export type FeatureHubViewer = {
  isPastor: boolean;
  isAdmin: boolean;
  role?: string | null;
};

/** 역할에 따라 FeatureHub 카드를 필터링 */
export function filterFeaturesByRole(
  features: FeatureCardConfig[],
  viewer: FeatureHubViewer,
): FeatureCardConfig[] {
  return features.filter(f => {
    if (f.disabled) return false;
    if (!f.roles || f.roles.length === 0) return true;

    const allowed = new Set<FeatureHubRole>();
    if (viewer.isAdmin || viewer.role === 'super_admin') allowed.add('super_admin');
    if (viewer.isPastor || viewer.role === 'pastor' || viewer.role === 'super_admin') {
      allowed.add('pastor');
    }
    allowed.add('member');

    return f.roles.some(r => allowed.has(r));
  });
}

import type { Announcement } from './announcementStorage';
import { getDistrictNameById, getDepartmentNameById, getAllZones } from './orgData';

export type ScopeBadge = {
  type: 'church' | 'district' | 'districtGroup' | 'department';
  label: string;
  variant: 'blue' | 'green' | 'purple' | 'orange';
};

/**
 * Returns ordered scope badges for an announcement.
 * Order: church → district/districtGroup → department
 * For level2 (zone), looks up the parent district to produce "District · Zone" label.
 */
export function buildNoticeScopeBadges(ann: Announcement): ScopeBadge[] {
  if (ann.scope === 'all') {
    return [{ type: 'church', label: '교회공지', variant: 'blue' }];
  }

  if (ann.scope === 'level1') {
    const name = getDistrictNameById(ann.scopeId);
    const label = name !== '-' ? name : (ann.scopeName ?? '상위조직');
    return [{ type: 'district', label, variant: 'green' }];
  }

  if (ann.scope === 'level2') {
    const zone = getAllZones().find(z => z.id === ann.scopeId);
    if (zone) {
      const distName = getDistrictNameById(zone.district_id);
      const label = distName !== '-'
        ? `${distName} · ${zone.name}`
        : zone.name;
      return [{ type: 'districtGroup', label, variant: 'purple' }];
    }
    // Fallback: scopeName already contains "상위 · 하위" format for seed data
    const label = ann.scopeName ?? '하위조직';
    return [{ type: 'districtGroup', label, variant: 'purple' }];
  }

  if (ann.scope === 'department') {
    const name = getDepartmentNameById(ann.scopeId);
    const label = name !== '-' ? name : (ann.scopeName ?? '부서');
    return [{ type: 'department', label, variant: 'orange' }];
  }

  return [];
}

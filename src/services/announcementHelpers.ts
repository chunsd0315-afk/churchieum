import type { Announcement } from './announcementStorage';
import { getDistrictNameById, getDepartmentNameById, getAllZones } from './orgData';
import { getOrganizationPathLabel } from './userOrganizationTree';

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
    return [{ type: 'church', label: '전체 공개', variant: 'blue' }];
  }

  if (ann.scope === 'organizations') {
    const ids = ann.sharedOrganizationIds ?? [];
    if (ids.length === 0) {
      return [{ type: 'district', label: '조직 공유', variant: 'green' }];
    }
    if (ids.length === 1) {
      const name = getOrganizationPathLabel(ids[0]) || ann.scopeName || '조직';
      const short = name.includes(' · ') ? name.split(' · ').pop()! : name;
      return [{ type: 'district', label: `${short} 공유`, variant: 'green' }];
    }
    return [{ type: 'district', label: `조직 ${ids.length}곳 공유`, variant: 'green' }];
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

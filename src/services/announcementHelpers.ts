import type { Announcement } from './announcementStorage';
import { getDistrictNameById, getDepartmentNameById, getAllZones } from './orgData';
import { getOrganizationPathLabel, getUserCoreOrganizationIds } from './userOrganizationTree';
import type { AppUser } from './permissions';

/** 역할별 열람 가능 여부. 상세설정의 “전체”도 이 범위를 넘지 않습니다. */
export function isAnnouncementVisible(ann: Announcement, user: AppUser | null): boolean {
  if (!user) return ann.scope === 'all';
  if (user.role === 'super_admin') return true;
  if (ann.scope === 'all') return true;

  if (ann.scope === 'organizations') {
    const shared = ann.sharedOrganizationIds ?? [];
    if (shared.length === 0) return false;
    const core = getUserCoreOrganizationIds(user);
    return shared.some(id => core.includes(id));
  }

  if (user.role === 'pastor') {
    if (ann.scope === 'level1') return user.assignedDistrictIds?.includes(ann.scopeId ?? '') ?? false;
    if (ann.scope === 'level2') return user.assignedZoneIds?.includes(ann.scopeId ?? '') ?? false;
    if (ann.scope === 'department') return user.assignedDepartmentIds?.includes(ann.scopeId ?? '') ?? false;
  }
  if (user.role === 'member') {
    if (ann.scope === 'level1') return ann.scopeId === user.districtId;
    if (ann.scope === 'level2') return ann.scopeId === user.zoneId;
    if (ann.scope === 'department') return user.departmentIds?.includes(ann.scopeId ?? '') ?? false;
  }
  return false;
}

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
    const live = ann.scopeId ? getOrganizationPathLabel(ann.scopeId) : '';
    const name = live && live !== '조직 정보 없음'
      ? live
      : getDistrictNameById(ann.scopeId);
    const label = name !== '-' ? name : (ann.scopeName ?? '상위조직');
    return [{ type: 'district', label, variant: 'green' }];
  }

  if (ann.scope === 'level2') {
    if (ann.scopeId) {
      const livePath = getOrganizationPathLabel(ann.scopeId);
      if (livePath && livePath !== '조직 정보 없음') {
        return [{ type: 'districtGroup', label: livePath.replace(' > ', ' · '), variant: 'purple' }];
      }
    }
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
    const live = ann.scopeId ? getOrganizationPathLabel(ann.scopeId) : '';
    const name = live && live !== '조직 정보 없음'
      ? live
      : getDepartmentNameById(ann.scopeId);
    const label = name !== '-' ? name : (ann.scopeName ?? '부서');
    return [{ type: 'department', label, variant: 'orange' }];
  }

  return [];
}

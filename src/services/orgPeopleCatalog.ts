/**
 * 조직 담당자 선택용 — 교역자(clergy_v1) / 성도(demo members) 통합 목록
 */

import {
  getAllClergy,
  getAssignmentsForClergy,
  getAssignmentSummary,
  positionLabel,
  type ClergyMember,
} from './clergyData';
import { getDemoData, type DemoMember } from './demoData';
import {
  getDistrictNameById,
  getZoneNameById,
  getDepartmentNameById,
} from './orgData';
import type { OrgPersonCandidate, OrganizationAssigneeType } from '../types/organization';

function clergyOrgSummary(c: ClergyMember): string {
  const assigns = getAssignmentsForClergy(c.id).filter(a => a.isActive);
  if (assigns.length > 0) {
    return assigns.map(getAssignmentSummary).slice(0, 2).join(' · ');
  }
  return '';
}

function memberOrgSummary(m: DemoMember): string {
  const parts = [
    m.districtName || getDistrictNameById(m.districtId),
    m.zoneName || getZoneNameById(m.zoneId),
    m.deptName || getDepartmentNameById(m.deptId),
  ].filter(p => p && p !== '-');
  return parts.join(' · ');
}

/** 교역자 목록 (활성) — super_admin 계정 교역자도 교역자로 표시 */
export function listPastorCandidates(): OrgPersonCandidate[] {
  return getAllClergy()
    .filter(c => c.status === 'active' || c.status === 'invited')
    .map(c => ({
      userId: c.id,
      name: c.name,
      assigneeType: 'pastor' as const,
      titleLabel: positionLabel(c),
      orgSummary: clergyOrgSummary(c),
      email: c.email,
      profileImage: c.profileImage,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
}

/** 성도 목록 (데모 멤버) — 교역자 이메일과 겹치면 제외 */
export function listMemberCandidates(): OrgPersonCandidate[] {
  const clergyEmails = new Set(
    getAllClergy().map(c => c.email?.toLowerCase()).filter(Boolean) as string[],
  );
  const members = getDemoData().members ?? [];
  return members
    .filter(m => !clergyEmails.has((m.email || '').toLowerCase()))
    .map(m => ({
      userId: m.id,
      name: m.name,
      assigneeType: 'member' as const,
      titleLabel: m.position || '성도',
      orgSummary: memberOrgSummary(m),
      email: m.email,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
}

export function listAllPersonCandidates(
  filter: 'all' | OrganizationAssigneeType = 'all',
): OrgPersonCandidate[] {
  if (filter === 'pastor') return listPastorCandidates();
  if (filter === 'member') return listMemberCandidates();
  return [...listPastorCandidates(), ...listMemberCandidates()]
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
}

export function findPersonCandidate(userId: string): OrgPersonCandidate | undefined {
  return listAllPersonCandidates('all').find(p => p.userId === userId);
}

export function searchPersonCandidates(
  query: string,
  filter: 'all' | OrganizationAssigneeType = 'all',
): OrgPersonCandidate[] {
  const q = query.trim().toLowerCase();
  const list = listAllPersonCandidates(filter);
  if (!q) return list;
  return list.filter(p =>
    p.name.toLowerCase().includes(q)
    || (p.email?.toLowerCase().includes(q) ?? false)
    || p.titleLabel.toLowerCase().includes(q)
    || p.orgSummary.toLowerCase().includes(q),
  );
}

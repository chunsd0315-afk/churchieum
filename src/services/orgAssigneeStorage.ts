/**
 * orgAssigneeStorage — 조직 담당자(개인) + 담당자 권한
 *
 * 신규 키: org_assignees_v1
 * 레거시: org_leaders_v1 읽기 → 1회 마이그레이션 (키 삭제 없음)
 */

import type {
  AssigneePermissionCode,
  OrganizationAssignee,
  OrganizationAssigneeRole,
  OrganizationAssigneeType,
  OrganizationLeader,
} from '../types/organization';
import {
  assigneeRoleLabel,
  defaultPermissionsForRole,
} from '../types/organization';
import { findPersonCandidate, listMemberCandidates, listPastorCandidates } from './orgPeopleCatalog';
import { notifyOrganizationTreeChanged } from './organizationStorage';

const LS_ASSIGNEES = 'org_assignees_v1';
const LS_LEADERS = 'org_leaders_v1';
const LS_MIGRATE = 'org_assignees_v1_migrated_from_leaders';

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch { /* corrupt → fallback */ }
  return fallback;
}

function saveJSON<T>(key: string, data: T): void {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* quota */ }
}

function nowIso() {
  return new Date().toISOString();
}

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function mapLegacyRole(leaderType: string): {
  assigneeType: OrganizationAssigneeType;
  role: OrganizationAssigneeRole;
} {
  const t = leaderType.trim();
  if (t.includes('목사') && !t.includes('장로')) {
    return { assigneeType: 'pastor', role: t.includes('담당목사') || t === '담당목사' ? 'senior_pastor' : 'pastor' };
  }
  if (t.includes('전도사') || t.includes('교역')) {
    return { assigneeType: 'pastor', role: 'evangelist' };
  }
  if (t.includes('장로')) return { assigneeType: 'member', role: 'elder' };
  if (t.includes('부장')) return { assigneeType: 'member', role: 'department_head' };
  if (t.includes('회장')) return { assigneeType: 'member', role: 'president' };
  if (t.includes('총무')) return { assigneeType: 'member', role: 'secretary_general' };
  if (t.includes('회계')) return { assigneeType: 'member', role: 'treasurer' };
  if (t.includes('서기')) return { assigneeType: 'member', role: 'clerk' };
  if (t.includes('부리더')) return { assigneeType: 'member', role: 'assistant_leader' };
  if (t.includes('리더')) return { assigneeType: 'member', role: 'leader' };
  if (t.includes('교사')) return { assigneeType: 'member', role: 'teacher' };
  return { assigneeType: 'member', role: 'other' };
}

function migrateLeadersIfNeeded(): void {
  if (localStorage.getItem(LS_MIGRATE) === '1') return;
  const existing = loadJSON<OrganizationAssignee[]>(LS_ASSIGNEES, []);
  if (existing.length > 0) {
    localStorage.setItem(LS_MIGRATE, '1');
    return;
  }
  const leaders = loadJSON<OrganizationLeader[]>(LS_LEADERS, []);
  if (leaders.length === 0) {
    localStorage.setItem(LS_MIGRATE, '1');
    return;
  }
  const ts = nowIso();
  const migrated: OrganizationAssignee[] = leaders.map(l => {
    const mapped = mapLegacyRole(l.leaderType);
    const person = findPersonCandidate(l.memberId);
    // 교역자 카탈로그에 있으면 교역자. 없으면 레거시 역할 매핑을 우선 (이름만으로 성도 처리하지 않음)
    let assigneeType: OrganizationAssigneeType = mapped.assigneeType;
    if (person?.assigneeType === 'pastor') assigneeType = 'pastor';
    else if (person?.assigneeType === 'member' && mapped.assigneeType === 'member') {
      assigneeType = 'member';
    }
    const role = mapped.role;
    return {
      id: l.id.startsWith('lead') ? l.id.replace(/^lead/, 'asg') : uid('asg'),
      organizationId: l.organizationId,
      userId: l.memberId,
      userName: person?.name || l.memberName || '이름 없음',
      titleLabel: person?.titleLabel ?? '',
      assigneeType,
      role,
      roleLabel: l.leaderType,
      isPrimary: false,
      isActive: true,
      permissionCodes: defaultPermissionsForRole(assigneeType, role),
      createdAt: l.createdAt || ts,
      updatedAt: ts,
    };
  });
  saveJSON(LS_ASSIGNEES, migrated);
  localStorage.setItem(LS_MIGRATE, '1');
}

/** 이미 마이그레이션된 담당자의 교역자/성도 구분을 카탈로그 기준으로 1회 보정 */
function repairAssigneeTypesIfNeeded(): void {
  const LS_REPAIR = 'org_assignees_v1_type_repaired';
  if (localStorage.getItem(LS_REPAIR) === '1') return;
  const list = loadJSON<OrganizationAssignee[]>(LS_ASSIGNEES, []);
  if (list.length === 0) {
    localStorage.setItem(LS_REPAIR, '1');
    return;
  }
  let changed = false;
  const next = list.map(a => {
    let person = findPersonCandidate(a.userId);
    // 레거시 memberId가 성도 id인데 동명 교역자가 있으면 교역자로 맞춤
    if (!person || person.assigneeType === 'member') {
      const bareName = a.userName.replace(/\s*(목사|전도사|장로|권사|집사)$/u, '').trim();
      const byNamePastor = listPastorCandidates().find(
        p => p.name === a.userName || p.name === bareName,
      );
      if (byNamePastor) person = byNamePastor;
      else if (!person) {
        const byNameMember = listMemberCandidates().find(
          p => p.name === a.userName || p.name === bareName,
        );
        if (byNameMember) person = byNameMember;
      }
    }
    if (!person) return a;
    if (
      person.assigneeType === a.assigneeType
      && person.titleLabel === a.titleLabel
      && person.name === a.userName
      && person.userId === a.userId
    ) {
      return a;
    }
    changed = true;
    return {
      ...a,
      userId: person.userId,
      assigneeType: person.assigneeType,
      titleLabel: person.titleLabel || a.titleLabel,
      userName: person.name || a.userName,
      updatedAt: nowIso(),
    };
  });
  if (changed) saveJSON(LS_ASSIGNEES, next);
  localStorage.setItem(LS_REPAIR, '1');
}

export function getAllAssignees(): OrganizationAssignee[] {
  migrateLeadersIfNeeded();
  repairAssigneeTypesIfNeeded();
  return loadJSON<OrganizationAssignee[]>(LS_ASSIGNEES, []);
}

export function getAssigneesForOrg(organizationId: string): OrganizationAssignee[] {
  return getAllAssignees()
    .filter(a => a.organizationId === organizationId)
    .sort((a, b) => {
      if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
      if (a.assigneeType !== b.assigneeType) return a.assigneeType === 'pastor' ? -1 : 1;
      return a.userName.localeCompare(b.userName, 'ko');
    });
}

export function getAssignee(organizationId: string, userId: string): OrganizationAssignee | undefined {
  return getAllAssignees().find(
    a => a.organizationId === organizationId && a.userId === userId && a.isActive,
  );
}

export function getAssigneesForUser(userId: string): OrganizationAssignee[] {
  return getAllAssignees().filter(a => a.userId === userId && a.isActive);
}

export function isAlreadyAssignee(organizationId: string, userId: string): boolean {
  return getAllAssignees().some(
    a => a.organizationId === organizationId && a.userId === userId,
  );
}

export function upsertAssignee(
  input: Omit<OrganizationAssignee, 'id' | 'createdAt' | 'updatedAt'> & {
    id?: string;
    createdAt?: string;
  },
): OrganizationAssignee {
  const list = getAllAssignees();
  const ts = nowIso();
  const idx = input.id
    ? list.findIndex(a => a.id === input.id)
    : list.findIndex(a => a.organizationId === input.organizationId && a.userId === input.userId);

  const roleLabel = input.roleLabel ?? assigneeRoleLabel(input.role);
  const next: OrganizationAssignee = {
    id: input.id ?? (idx >= 0 ? list[idx].id : uid('asg')),
    organizationId: input.organizationId,
    userId: input.userId,
    userName: input.userName,
    titleLabel: input.titleLabel,
    assigneeType: input.assigneeType,
    role: input.role,
    roleLabel,
    isPrimary: input.isPrimary,
    isActive: input.isActive,
    permissionCodes: [...input.permissionCodes],
    createdAt: input.createdAt ?? (idx >= 0 ? list[idx].createdAt : ts),
    updatedAt: ts,
  };

  // 주 담당자 1명만
  if (next.isPrimary) {
    list.forEach((a, i) => {
      if (a.organizationId === next.organizationId && a.id !== next.id && a.isPrimary) {
        list[i] = { ...a, isPrimary: false, updatedAt: ts };
      }
    });
  }

  if (idx >= 0) list[idx] = next;
  else list.push(next);
  saveJSON(LS_ASSIGNEES, list);
  notifyOrganizationTreeChanged();
  return next;
}

export function removeAssignee(id: string): void {
  saveJSON(LS_ASSIGNEES, getAllAssignees().filter(a => a.id !== id));
  notifyOrganizationTreeChanged();
}

export function removeAssigneesForOrg(organizationId: string): void {
  removeAssigneesForOrganizations([organizationId]);
}

export function removeAssigneesForOrganizations(organizationIds: string[]): void {
  const set = new Set(organizationIds);
  saveJSON(
    LS_ASSIGNEES,
    getAllAssignees().filter(a => !set.has(a.organizationId)),
  );
  notifyOrganizationTreeChanged();
}

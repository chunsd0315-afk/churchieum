/**
 * organizationStorage — 무제한 계층 조직 + 직분·담당자·권한
 *
 * 신규 키만 사용하고, 기존 org_districts_v1 / org_zones_v1 / org_departments_v1 은
 * 읽기·쓰기 투영으로 유지한다 (키 이름 변경 없음).
 */

import type {
  ChurchRole,
  OrgPermissionCode,
  OrgTypeDef,
  Organization,
  OrganizationLeader,
  OrganizationMember,
  OrganizationPermission,
  OrgTreeNode,
} from '../types/organization';
import {
  getAllDepartments,
  getAllDistricts,
  getAllZones,
  saveDepartments,
  saveDistricts,
  saveZones,
  type OrgDepartment,
  type OrgDistrict,
  type OrgZone,
} from './orgData';
import { removeAssigneesForOrganizations } from './orgAssigneeStorage';

// ─── New localStorage keys (do not rename casually) ───────────────────────────
const LS_ORGS = 'org_nodes_v1';
const LS_TYPES = 'org_types_v1';
const LS_ROLES = 'org_church_roles_v1';
const LS_MEMBERS = 'org_memberships_v1';
const LS_LEADERS = 'org_leaders_v1';
const LS_PERMS = 'org_permissions_v1';
const LS_SEEDED = 'org_nodes_v1_seeded';

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch { /* ignore */ }
  return fallback;
}

function saveJSON<T>(key: string, data: T): void {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* ignore */ }
}

function nowIso() {
  return new Date().toISOString();
}

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_TYPES: OrgTypeDef[] = [
  { id: 't-district', name: '교구', sortOrder: 1, isActive: true, isSystem: true },
  { id: 't-zone', name: '구역', sortOrder: 2, isActive: true, isSystem: true },
  { id: 't-dept', name: '부서', sortOrder: 3, isActive: true, isSystem: true },
  { id: 't-agency', name: '기관', sortOrder: 4, isActive: true, isSystem: true },
  { id: 't-committee', name: '위원회', sortOrder: 5, isActive: true, isSystem: true },
  { id: 't-ministry', name: '사역팀', sortOrder: 6, isActive: true, isSystem: true },
  { id: 't-choir', name: '성가대', sortOrder: 7, isActive: true, isSystem: true },
  { id: 't-worship', name: '찬양팀', sortOrder: 8, isActive: true, isSystem: true },
  { id: 't-cell', name: '셀', sortOrder: 9, isActive: true, isSystem: true },
  { id: 't-small', name: '소모임', sortOrder: 10, isActive: true, isSystem: true },
  { id: 't-tf', name: 'TF', sortOrder: 11, isActive: true, isSystem: true },
  { id: 't-other', name: '기타', sortOrder: 12, isActive: true, isSystem: true },
];

const DEFAULT_ROLES: ChurchRole[] = [
  { id: 'r-senior', name: '담임목사', sortOrder: 1, isActive: true, isSystem: true },
  { id: 'r-assoc', name: '부목사', sortOrder: 2, isActive: true, isSystem: true },
  { id: 'r-evang', name: '전도사', sortOrder: 3, isActive: true, isSystem: true },
  { id: 'r-mission', name: '선교사', sortOrder: 4, isActive: true, isSystem: true },
  { id: 'r-elder', name: '장로', sortOrder: 5, isActive: true, isSystem: true },
  { id: 'r-ord-deacon', name: '안수집사', sortOrder: 6, isActive: true, isSystem: true },
  { id: 'r-kwonsa', name: '권사', sortOrder: 7, isActive: true, isSystem: true },
  { id: 'r-temp-deacon', name: '서리집사', sortOrder: 8, isActive: true, isSystem: true },
  { id: 'r-deacon', name: '집사', sortOrder: 9, isActive: true, isSystem: true },
  { id: 'r-member', name: '성도', sortOrder: 10, isActive: true, isSystem: true },
  { id: 'r-youth', name: '청년', sortOrder: 11, isActive: true, isSystem: true },
  { id: 'r-teacher', name: '교사', sortOrder: 12, isActive: true, isSystem: true },
  { id: 'r-cell', name: '셀리더', sortOrder: 13, isActive: true, isSystem: true },
  { id: 'r-praise', name: '찬양팀', sortOrder: 14, isActive: true, isSystem: true },
  { id: 'r-staff', name: '간사', sortOrder: 15, isActive: true, isSystem: true },
  { id: 'r-employee', name: '직원', sortOrder: 16, isActive: true, isSystem: true },
];

const DEFAULT_PERM_CODES: OrgPermissionCode[] = [
  'notice:view', 'notice:write', 'grace:view', 'grace:write',
  'event:view', 'event:write', 'album:write', 'prayer:write',
];

function seedFromLegacy(): Organization[] {
  const districts = getAllDistricts();
  const zones = getAllZones();
  const depts = getAllDepartments();
  const ts = nowIso();
  const orgs: Organization[] = [];

  const rootChurch: Organization = {
    id: 'org-church-root',
    name: '교회',
    code: 'CHURCH',
    type: '기타',
    parentId: null,
    description: '최상위 조직',
    sortOrder: 0,
    isActive: true,
    legacyKind: null,
    createdAt: ts,
    updatedAt: ts,
  };
  orgs.push(rootChurch);

  const eduRoot: Organization = {
    id: 'org-edu-root',
    name: '교육부',
    code: 'EDU',
    type: '부서',
    parentId: null,
    description: '교육 사역',
    sortOrder: 100,
    isActive: true,
    legacyKind: null,
    createdAt: ts,
    updatedAt: ts,
  };
  orgs.push(eduRoot);

  districts.forEach((d, i) => {
    orgs.push({
      id: d.id,
      name: d.name,
      code: `D-${d.id.toUpperCase()}`,
      type: '교구',
      parentId: rootChurch.id,
      description: d.description ?? '',
      sortOrder: d.sort_order || i + 1,
      isActive: d.is_active,
      legacyKind: 'district',
      createdAt: ts,
      updatedAt: ts,
    });
  });

  zones.forEach((z, i) => {
    orgs.push({
      id: z.id,
      name: z.name,
      code: `Z-${z.id.toUpperCase()}`,
      type: '구역',
      parentId: z.district_id,
      description: '',
      sortOrder: z.sort_order || i + 1,
      isActive: z.is_active,
      legacyKind: 'zone',
      createdAt: ts,
      updatedAt: ts,
    });
  });

  depts.forEach((d, i) => {
    const underEdu = /부$|학교|선교/.test(d.name) && !/장년|청년부$/.test(d.name);
    orgs.push({
      id: d.id,
      name: d.name,
      code: `DEP-${d.id.toUpperCase()}`,
      type: /성가|찬양/.test(d.name) ? '성가대' : /선교/.test(d.name) ? '기관' : '부서',
      parentId: underEdu ? eduRoot.id : null,
      description: d.description ?? '',
      sortOrder: d.sort_order || i + 1,
      isActive: d.is_active,
      legacyKind: 'department',
      createdAt: ts,
      updatedAt: ts,
    });
  });

  return orgs;
}

function seedLeadersFromLegacy(orgs: Organization[]): OrganizationLeader[] {
  const ts = nowIso();
  const leaders: OrganizationLeader[] = [];
  const districts = getAllDistricts();
  const zones = getAllZones();
  const depts = getAllDepartments();

  const add = (orgId: string, name: string | null, type: string) => {
    if (!name) return;
    leaders.push({
      id: uid('lead'),
      organizationId: orgId,
      memberId: `legacy-${orgId}`,
      memberName: name,
      leaderType: type,
      createdAt: ts,
    });
  };

  districts.forEach(d => add(d.id, d.leader_name, '담당목사'));
  zones.forEach(z => add(z.id, z.leader_name, '리더'));
  depts.forEach(d => add(d.id, d.leader_name, '부장'));
  void orgs;
  return leaders;
}

function ensureSeeded(): void {
  if (localStorage.getItem(LS_SEEDED) === '1' && loadJSON<Organization[]>(LS_ORGS, []).length > 0) {
    return;
  }
  const orgs = seedFromLegacy();
  saveJSON(LS_ORGS, orgs);
  saveJSON(LS_TYPES, DEFAULT_TYPES);
  saveJSON(LS_ROLES, DEFAULT_ROLES);
  saveJSON(LS_LEADERS, seedLeadersFromLegacy(orgs));
  saveJSON(LS_MEMBERS, [] as OrganizationMember[]);
  saveJSON(LS_PERMS, [] as OrganizationPermission[]);
  localStorage.setItem(LS_SEEDED, '1');
  projectToLegacy(orgs);
}

/** 레거시 3키로 투영 — 기존 성도/초대/기도 화면이 계속 동작 */
export function projectToLegacy(orgs?: Organization[]): void {
  const list = orgs ?? getAllOrganizations();
  const districts: OrgDistrict[] = [];
  const zones: OrgZone[] = [];
  const departments: OrgDepartment[] = [];
  const leaders = getAllLeaders();

  const primaryLeader = (orgId: string) =>
    leaders.find(l => l.organizationId === orgId)?.memberName ?? null;

  list.forEach(o => {
    if (o.legacyKind === 'district') {
      districts.push({
        id: o.id,
        name: o.name,
        leader_name: primaryLeader(o.id),
        description: o.description || null,
        is_active: o.isActive,
        sort_order: o.sortOrder,
      });
    } else if (o.legacyKind === 'zone') {
      zones.push({
        id: o.id,
        district_id: o.parentId ?? '',
        name: o.name,
        leader_name: primaryLeader(o.id),
        is_active: o.isActive,
        sort_order: o.sortOrder,
      });
    } else if (o.legacyKind === 'department') {
      departments.push({
        id: o.id,
        name: o.name,
        leader_name: primaryLeader(o.id),
        description: o.description || null,
        is_active: o.isActive,
        sort_order: o.sortOrder,
      });
    }
  });

  if (districts.length > 0) saveDistricts(districts);
  if (zones.length > 0) saveZones(zones);
  if (departments.length > 0) saveDepartments(departments);
}

// ─── Organizations ────────────────────────────────────────────────────────────

export function getAllOrganizations(): Organization[] {
  ensureSeeded();
  return loadJSON<Organization[]>(LS_ORGS, []);
}

export function getOrganizationById(id: string): Organization | undefined {
  return getAllOrganizations().find(o => o.id === id);
}

export function getChildOrganizations(parentId: string | null): Organization[] {
  return getAllOrganizations()
    .filter(o => o.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'ko'));
}

export function buildOrgTree(includeInactive = true): OrgTreeNode[] {
  const all = getAllOrganizations().filter(o => includeInactive || o.isActive);
  const map = new Map<string, OrgTreeNode>();
  all.forEach(o => map.set(o.id, { ...o, children: [] }));
  const roots: OrgTreeNode[] = [];
  map.forEach(node => {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  const sortRec = (nodes: OrgTreeNode[]) => {
    nodes.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'ko'));
    nodes.forEach(n => sortRec(n.children));
  };
  sortRec(roots);
  return roots;
}

export function getAncestorIds(orgId: string): string[] {
  const all = getAllOrganizations();
  const ids: string[] = [];
  let cur = all.find(o => o.id === orgId);
  const guard = new Set<string>();
  while (cur?.parentId && !guard.has(cur.parentId)) {
    guard.add(cur.parentId);
    ids.push(cur.parentId);
    cur = all.find(o => o.id === cur!.parentId);
  }
  return ids;
}

export function getDescendantIds(orgId: string): string[] {
  const result: string[] = [];
  const walk = (pid: string) => {
    getChildOrganizations(pid).forEach(c => {
      result.push(c.id);
      walk(c.id);
    });
  };
  walk(orgId);
  return result;
}

export function saveAllOrganizations(list: Organization[]): void {
  saveJSON(LS_ORGS, list);
  projectToLegacy(list);
}

export function upsertOrganization(input: Omit<Organization, 'createdAt' | 'updatedAt'> & {
  createdAt?: string;
}): Organization {
  const list = getAllOrganizations();
  const ts = nowIso();
  const idx = list.findIndex(o => o.id === input.id);
  const next: Organization = {
    ...input,
    createdAt: input.createdAt ?? list[idx]?.createdAt ?? ts,
    updatedAt: ts,
  };
  if (idx >= 0) list[idx] = next;
  else list.push(next);
  saveAllOrganizations(list);
  return next;
}

export function createOrganization(partial: {
  name: string;
  type: string;
  parentId: string | null;
  description?: string;
  code?: string;
  legacyKind?: Organization['legacyKind'];
}): Organization {
  const siblings = getChildOrganizations(partial.parentId);
  const maxOrder = siblings.reduce((m, s) => Math.max(m, s.sortOrder), 0);
  const id = uid('org');
  return upsertOrganization({
    id,
    name: partial.name.trim(),
    code: (partial.code || id).toUpperCase(),
    type: partial.type,
    parentId: partial.parentId,
    description: partial.description ?? '',
    sortOrder: maxOrder + 1,
    isActive: true,
    legacyKind: partial.legacyKind ?? null,
  });
}

export function deleteOrganization(id: string, cascade = true): void {
  let list = getAllOrganizations();
  const toRemove = new Set<string>([id]);
  if (cascade) getDescendantIds(id).forEach(d => toRemove.add(d));
  // 자식을 상위(삭제 대상의 parent)로 옮기지 않고 cascade 기본
  list = list.filter(o => !toRemove.has(o.id));
  saveAllOrganizations(list);

  saveJSON(LS_LEADERS, getAllLeaders().filter(l => !toRemove.has(l.organizationId)));
  saveJSON(LS_MEMBERS, getAllMemberships().filter(m => !toRemove.has(m.organizationId)));
  saveJSON(LS_PERMS, getAllPermissions().filter(p => !toRemove.has(p.organizationId)));
  removeAssigneesForOrganizations([...toRemove]);
}

export function wouldCreateCycle(orgId: string, newParentId: string | null): boolean {
  if (!newParentId) return false;
  if (orgId === newParentId) return true;
  return getDescendantIds(orgId).includes(newParentId);
}

// ─── Types ────────────────────────────────────────────────────────────────────

export function getOrgTypes(): OrgTypeDef[] {
  ensureSeeded();
  return loadJSON<OrgTypeDef[]>(LS_TYPES, DEFAULT_TYPES)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function saveOrgTypes(list: OrgTypeDef[]): void {
  saveJSON(LS_TYPES, list);
}

export function upsertOrgType(t: OrgTypeDef): void {
  const list = getOrgTypes();
  const i = list.findIndex(x => x.id === t.id);
  if (i >= 0) list[i] = t;
  else list.push(t);
  saveOrgTypes(list);
}

export function deleteOrgType(id: string): boolean {
  const list = getOrgTypes();
  const item = list.find(t => t.id === id);
  if (item?.isSystem) return false;
  saveOrgTypes(list.filter(t => t.id !== id));
  return true;
}

// ─── Church roles (직분) ──────────────────────────────────────────────────────

export function getChurchRoles(): ChurchRole[] {
  ensureSeeded();
  return loadJSON<ChurchRole[]>(LS_ROLES, DEFAULT_ROLES)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function saveChurchRoles(list: ChurchRole[]): void {
  saveJSON(LS_ROLES, list);
}

export function upsertChurchRole(r: ChurchRole): void {
  const list = getChurchRoles();
  const i = list.findIndex(x => x.id === r.id);
  if (i >= 0) list[i] = r;
  else list.push(r);
  saveChurchRoles(list);
}

export function deleteChurchRole(id: string): boolean {
  const list = getChurchRoles();
  const item = list.find(r => r.id === id);
  if (item?.isSystem) return false;
  saveChurchRoles(list.filter(r => r.id !== id));
  return true;
}

// ─── Leaders ──────────────────────────────────────────────────────────────────

export function getAllLeaders(): OrganizationLeader[] {
  ensureSeeded();
  return loadJSON<OrganizationLeader[]>(LS_LEADERS, []);
}

export function getLeadersForOrg(organizationId: string): OrganizationLeader[] {
  return getAllLeaders().filter(l => l.organizationId === organizationId);
}

export function addLeader(input: Omit<OrganizationLeader, 'id' | 'createdAt'>): OrganizationLeader {
  const list = getAllLeaders();
  const row: OrganizationLeader = { ...input, id: uid('lead'), createdAt: nowIso() };
  list.push(row);
  saveJSON(LS_LEADERS, list);
  projectToLegacy();
  return row;
}

export function removeLeader(id: string): void {
  saveJSON(LS_LEADERS, getAllLeaders().filter(l => l.id !== id));
  projectToLegacy();
}

// ─── Memberships ──────────────────────────────────────────────────────────────

export function getAllMemberships(): OrganizationMember[] {
  ensureSeeded();
  return loadJSON<OrganizationMember[]>(LS_MEMBERS, []);
}

export function getMembershipsForOrg(organizationId: string): OrganizationMember[] {
  return getAllMemberships().filter(m => m.organizationId === organizationId);
}

export function getMembershipsForMember(memberId: string): OrganizationMember[] {
  return getAllMemberships().filter(m => m.memberId === memberId);
}

export function addMembership(input: Omit<OrganizationMember, 'id' | 'createdAt'>): OrganizationMember {
  const list = getAllMemberships();
  const exists = list.find(
    m => m.organizationId === input.organizationId && m.memberId === input.memberId && m.roleId === input.roleId,
  );
  if (exists) return exists;
  const row: OrganizationMember = { ...input, id: uid('om'), createdAt: nowIso() };
  list.push(row);
  saveJSON(LS_MEMBERS, list);
  return row;
}

export function removeMembership(id: string): void {
  saveJSON(LS_MEMBERS, getAllMemberships().filter(m => m.id !== id));
}

// ─── Permissions ──────────────────────────────────────────────────────────────

export function getAllPermissions(): OrganizationPermission[] {
  ensureSeeded();
  return loadJSON<OrganizationPermission[]>(LS_PERMS, []);
}

export function getPermissionsForOrg(organizationId: string): OrganizationPermission[] {
  return getAllPermissions().filter(p => p.organizationId === organizationId);
}

export function setOrgPermission(
  organizationId: string,
  permissionCode: OrgPermissionCode,
  enabled: boolean,
): void {
  const list = getAllPermissions();
  const i = list.findIndex(p => p.organizationId === organizationId && p.permissionCode === permissionCode);
  if (i >= 0) {
    list[i] = { ...list[i], enabled };
  } else {
    list.push({
      id: uid('perm'),
      organizationId,
      permissionCode,
      enabled,
    });
  }
  saveJSON(LS_PERMS, list);
}

export function ensureDefaultPermissions(organizationId: string): void {
  const existing = getPermissionsForOrg(organizationId);
  if (existing.length > 0) return;
  DEFAULT_PERM_CODES.forEach(code => {
    setOrgPermission(organizationId, code, code.endsWith(':view'));
  });
}

/** 데모 성도 목록에서 소속 후보 이름 가져오기 */
export function getDemoMemberCandidates(): { id: string; name: string }[] {
  try {
    const raw = localStorage.getItem('churchieum_demo_generated_v2');
    if (raw) {
      const data = JSON.parse(raw) as {
        members?: Array<{ id?: string; email?: string; name?: string }>;
      };
      return (data.members ?? [])
        .filter(m => m.name)
        .slice(0, 80)
        .map(m => ({ id: m.id || m.email || uid('m'), name: m.name! }));
    }
  } catch { /* ignore */ }
  return [
    { id: 'demo-pastor01', name: '정재명' },
    { id: 'demo-pastor02', name: '이변우' },
    { id: 'demo-member60', name: '천성대' },
  ];
}

/**
 * permissions.ts — 교회이음 권한 체크 함수
 *
 * Roles:
 *   super_admin  — 전체 관리
 *   pastor       — 담당 범위 관리
 *   member       — 성도모드만
 */

export type UserRole = 'super_admin' | 'pastor' | 'member';

export type AppUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  position?: string;
  phone?: string;
  // assigned scopes (pastor)
  assignedDistrictIds?: string[];
  assignedZoneIds?: string[];
  assignedDepartmentIds?: string[];
  // membership scopes (all users)
  districtId?: string;
  zoneId?: string;
  departmentIds?: string[];
};

/** Content item with visibility metadata */
export type ContentItem = {
  createdBy: string;
  visibilityType: 'all' | 'district' | 'zone' | 'department';
  districtIds?: string[];
  zoneIds?: string[];
  departmentIds?: string[];
};

/** Grace note with visibility */
export type GraceNoteItem = {
  userId: string;
  visibility: 'private' | 'pastor' | 'group';
};

/** Scope the user can target when creating content */
export type ContentScope = {
  type: 'all' | 'district' | 'zone' | 'department';
  id?: string;
  name?: string;
};

// ─── Core role checks ─────────────────────────────────────────────────────────

export function isSuperAdmin(user: AppUser | null): boolean {
  return user?.role === 'super_admin';
}

export function isPastor(user: AppUser | null): boolean {
  return user?.role === 'pastor' || user?.role === 'super_admin';
}

export function canAccessAdmin(user: AppUser | null): boolean {
  return user?.role === 'super_admin' || user?.role === 'pastor';
}

// ─── Content creation ─────────────────────────────────────────────────────────

export function canCreateNotice(user: AppUser | null, scope?: ContentScope): boolean {
  if (!user) return false;
  if (user.role === 'super_admin') return true;
  if (user.role === 'pastor') {
    if (!scope || scope.type === 'all') return false;
    return _scopeInAssigned(user, scope);
  }
  return false;
}

export function canCreateSchedule(user: AppUser | null, scope?: ContentScope): boolean {
  return canCreateNotice(user, scope);
}

export function canCreateAlbum(user: AppUser | null, scope?: ContentScope): boolean {
  return canCreateNotice(user, scope);
}

/** Can the user write ANY notice/schedule/album (i.e., show the create button)? */
export function canWriteContent(user: AppUser | null): boolean {
  if (!user) return false;
  return user.role === 'super_admin' || user.role === 'pastor';
}

// ─── Content visibility ───────────────────────────────────────────────────────

export function canViewContent(user: AppUser | null, content: ContentItem): boolean {
  if (!user) return false;
  if (user.role === 'super_admin') return true;
  if (content.visibilityType === 'all') return true;
  if (content.visibilityType === 'district') {
    return !!(content.districtIds?.includes(user.districtId ?? ''));
  }
  if (content.visibilityType === 'zone') {
    return !!(content.zoneIds?.includes(user.zoneId ?? ''));
  }
  if (content.visibilityType === 'department') {
    return !!(content.departmentIds?.some(d => user.departmentIds?.includes(d)));
  }
  return false;
}

// ─── Grace notes ──────────────────────────────────────────────────────────────

export function canViewGraceNote(user: AppUser | null, note: GraceNoteItem): boolean {
  if (!user) return false;
  if (note.userId === user.id) return true;
  if (note.visibility === 'private') return false;
  if (note.visibility === 'pastor') {
    return user.role === 'super_admin' || user.role === 'pastor';
  }
  if (note.visibility === 'group') {
    return user.role === 'super_admin' || user.role === 'pastor';
  }
  return false;
}

// ─── Reading progress ─────────────────────────────────────────────────────────

export function canViewMemberReadingProgress(
  viewer: AppUser | null,
  member: Pick<AppUser, 'districtId' | 'zoneId' | 'departmentIds'>
): boolean {
  if (!viewer) return false;
  if (viewer.role === 'super_admin') return true;
  if (viewer.role === 'pastor') {
    if (viewer.assignedDistrictIds?.includes(member.districtId ?? '')) return true;
    if (viewer.assignedZoneIds?.includes(member.zoneId ?? '')) return true;
    if (viewer.assignedDepartmentIds?.some(d => member.departmentIds?.includes(d))) return true;
    return false;
  }
  return false;
}

// ─── Scope helpers ────────────────────────────────────────────────────────────

/**
 * Returns all content scopes available to the user.
 * super_admin: all + every district/zone/department
 * pastor: their assigned districts/zones/departments
 * member: none
 */
export function getAvailableScopes(
  user: AppUser | null,
  orgData: { districts: { id: string; name: string }[]; zones: { id: string; name: string }[]; departments: { id: string; name: string }[] }
): ContentScope[] {
  if (!user) return [];

  if (user.role === 'super_admin') {
    return [
      { type: 'all', name: '전체 성도' },
      ...orgData.districts.map(d => ({ type: 'district' as const, id: d.id, name: d.name })),
      ...orgData.zones.map(z => ({ type: 'zone' as const, id: z.id, name: z.name })),
      ...orgData.departments.map(dep => ({ type: 'department' as const, id: dep.id, name: dep.name })),
    ];
  }

  if (user.role === 'pastor') {
    const scopes: ContentScope[] = [];
    (user.assignedDistrictIds ?? []).forEach(id => {
      const d = orgData.districts.find(x => x.id === id);
      if (d) scopes.push({ type: 'district', id: d.id, name: d.name });
    });
    (user.assignedZoneIds ?? []).forEach(id => {
      const z = orgData.zones.find(x => x.id === id);
      if (z) scopes.push({ type: 'zone', id: z.id, name: z.name });
    });
    (user.assignedDepartmentIds ?? []).forEach(id => {
      const dep = orgData.departments.find(x => x.id === id);
      if (dep) scopes.push({ type: 'department', id: dep.id, name: dep.name });
    });
    return scopes;
  }

  return [];
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function _scopeInAssigned(user: AppUser, scope: ContentScope): boolean {
  if (scope.type === 'district') return !!(user.assignedDistrictIds?.includes(scope.id ?? ''));
  if (scope.type === 'zone') return !!(user.assignedZoneIds?.includes(scope.id ?? ''));
  if (scope.type === 'department') return !!(user.assignedDepartmentIds?.includes(scope.id ?? ''));
  return false;
}

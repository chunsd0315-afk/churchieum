import type { AppUser } from './permissions';
import type { AssigneePermissionCode, OrganizationAssignee } from '../types/organization';
import {
  getAssignee,
  getAssigneesForUser,
  getAllAssignees,
} from './orgAssigneeStorage';
import { isSuperAdmin } from './permissions';
import { getClergyByEmail } from './clergyData';
import { getDemoData } from './demoData';

export function getOrganizationAssignee(
  organizationId: string,
  userId: string,
): OrganizationAssignee | undefined {
  return getAssignee(organizationId, userId);
}

export function isOrganizationAssignee(
  organizationId: string,
  userId: string,
): boolean {
  return Boolean(getAssignee(organizationId, userId));
}

export function getUserManagedOrganizations(userId: string): string[] {
  return getAssigneesForUser(userId).map(a => a.organizationId);
}

export function hasOrganizationPermission(
  organizationId: string,
  userId: string,
  permissionCode: AssigneePermissionCode,
  user?: AppUser | null,
): boolean {
  if (user && isSuperAdmin(user)) return true;
  if (user?.id === userId && isSuperAdmin(user)) return true;

  const row = getAssignee(organizationId, userId);
  if (!row || !row.isActive) return false;
  return row.permissionCodes.includes(permissionCode);
}

/** Auth 사용자 → 담당자 userId 후보 (clergy id / member id / demo id) */
export function resolveAssigneeUserIds(user: AppUser | null): string[] {
  if (!user) return [];
  const ids = new Set<string>([user.id]);
  const clergy = getClergyByEmail(user.email);
  if (clergy) ids.add(clergy.id);
  const m = getDemoData().members?.find(
    x => x.email?.toLowerCase() === user.email.toLowerCase(),
  );
  if (m) ids.add(m.id);
  return [...ids];
}

export function hasOrganizationPermissionForUser(
  organizationId: string,
  user: AppUser | null,
  permissionCode: AssigneePermissionCode,
): boolean {
  if (!user) return false;
  if (isSuperAdmin(user)) return true;
  return resolveAssigneeUserIds(user).some(uid =>
    hasOrganizationPermission(organizationId, uid, permissionCode, user),
  );
}

export function countAssigneePermissions(a: OrganizationAssignee): number {
  return a.permissionCodes.length;
}

export function listAllOrganizationAssignees(): OrganizationAssignee[] {
  return getAllAssignees();
}

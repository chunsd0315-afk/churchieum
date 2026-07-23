/**
 * 헤더·사이드바·모바일 메뉴용 — 현재 사용자·교회·조직 표시 메타
 */

import type { AppUser } from './permissions';
import { isSuperAdmin } from './permissions';
import { combineNameAndPosition } from './graceNoteAuthorDisplay';
import {
  formatOrgMetaSecondaryLine,
  getUserDepartmentLabelOutsidePath,
  getUserPrimaryOrganizationPath,
  getOrganizationIdsForUserId,
} from './userOrganizationPath';
import { getAllOrganizations } from './organizationStorage';
import { getClergyByEmail, positionLabel } from './clergyData';
import { getProfileImage, resolveProfileImage, PROFILE_IMAGE_CHANGED_EVENT } from './profileImage';

export const CHURCH_NAME_STORAGE_KEY = 'churchieum_church_name_v1';
export { PROFILE_IMAGE_CHANGED_EVENT };
export const CHURCH_NAME_CHANGED_EVENT = 'churchieum-church-name-changed';

const DEFAULT_CHURCH_NAME = '교회이음';

export type CurrentUserDisplayMeta = {
  churchName: string;
  userDisplayName: string;
  name: string;
  position: string;
  roleLabel: string;
  profileImageUrl: string;
  organizationPathLabel: string;
  primaryOrganizationPath: string[];
  departmentNames: string[];
};

export function readStoredChurchName(): string | null {
  try {
    const v = localStorage.getItem(CHURCH_NAME_STORAGE_KEY)?.trim();
    return v || null;
  } catch {
    return null;
  }
}

export function writeStoredChurchName(name: string): void {
  const trimmed = name.trim();
  if (!trimmed) return;
  try {
    localStorage.setItem(CHURCH_NAME_STORAGE_KEY, trimmed);
    window.dispatchEvent(new CustomEvent(CHURCH_NAME_CHANGED_EVENT, { detail: { name: trimmed } }));
  } catch {
    /* ignore */
  }
}

/** 이름 + 직분 (중복 방지) */
export function formatUserDisplayName(
  name?: string | null,
  position?: string | null,
): string {
  const n = (name ?? '').trim();
  const p = (position ?? '').trim();
  if (!n && !p) return '사용자';
  if (!n) return p;
  if (!p) return n;
  return combineNameAndPosition(n, p);
}

function resolvePosition(user: AppUser): string {
  const fromUser = user.position?.trim() || '';
  if (fromUser) return fromUser;
  try {
    const clergy = getClergyByEmail(user.email);
    const fromClergy = clergy ? positionLabel(clergy)?.trim() : '';
    if (fromClergy) return fromClergy;
  } catch {
    /* ignore */
  }
  if (isSuperAdmin(user)) return '최고관리자';
  if (user.role === 'pastor') return '교역자';
  return '성도';
}

function resolveRoleLabel(user: AppUser): string {
  if (isSuperAdmin(user)) return '최고관리자';
  if (user.role === 'pastor') return '교역자';
  return '성도';
}

/**
 * 대표 조직 경로 라벨
 * 계층: A > B > C · 부서
 * 교역자: 경로 · 담당교역자 (부서 있으면 부서 포함)
 */
export function buildUserOrganizationPathLabel(user: AppUser | null | undefined): {
  pathNames: string[];
  departmentNames: string[];
  label: string;
} {
  if (!user?.id) {
    return { pathNames: [], departmentNames: [], label: '' };
  }

  const orgs = getAllOrganizations();
  const pathNames = getUserPrimaryOrganizationPath(user.id, orgs);
  const dept = getUserDepartmentLabelOutsidePath(user.id, pathNames);
  const departmentNames = dept ? [dept] : [];

  const isPastoral = isSuperAdmin(user) || user.role === 'pastor';
  const hasOrgs = getOrganizationIdsForUserId(user.id).length > 0;

  if (pathNames.length === 0 && departmentNames.length === 0) {
    if (isSuperAdmin(user)) {
      return { pathNames: [], departmentNames: [], label: '최고관리자' };
    }
    if (user.role === 'pastor') {
      return { pathNames: [], departmentNames: [], label: hasOrgs ? '담당교역자' : '' };
    }
    return { pathNames: [], departmentNames: [], label: '' };
  }

  let label = formatOrgMetaSecondaryLine({
    pathNames,
    departmentLabel: dept,
    dateLabel: '',
  });

  if (isPastoral && label && !label.includes('담당교역자')) {
    label = `${label} · 담당교역자`;
  }

  return { pathNames, departmentNames, label };
}

export function buildCurrentUserDisplayMeta(
  user: AppUser | null | undefined,
  churchNameOverride?: string | null,
): CurrentUserDisplayMeta {
  const churchName =
    (churchNameOverride?.trim()
      || readStoredChurchName()
      || DEFAULT_CHURCH_NAME);

  if (!user) {
    return {
      churchName,
      userDisplayName: '사용자',
      name: '사용자',
      position: '',
      roleLabel: '',
      profileImageUrl: resolveProfileImage({ role: 'member' }),
      organizationPathLabel: '',
      primaryOrganizationPath: [],
      departmentNames: [],
    };
  }

  const position = resolvePosition(user);
  const name = user.name?.trim() || '사용자';
  const userDisplayName = formatUserDisplayName(name, position);
  const org = buildUserOrganizationPathLabel(user);

  return {
    churchName,
    userDisplayName,
    name,
    position,
    roleLabel: resolveRoleLabel(user),
    profileImageUrl: resolveProfileImage({
      userId: user.id,
      role: user.role,
      src: getProfileImage(user.id),
    }),
    organizationPathLabel: org.label,
    primaryOrganizationPath: org.pathNames,
    departmentNames: org.departmentNames,
  };
}

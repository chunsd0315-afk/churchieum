import type { UserRole } from './permissions';

const PREFIX = 'churchieum_profile_img_';

export const PROFILE_IMAGE_CHANGED_EVENT = 'churchieum-profile-image-changed';

function emitProfileImageChanged(userId?: string): void {
  try {
    window.dispatchEvent(
      new CustomEvent(PROFILE_IMAGE_CHANGED_EVENT, { detail: { userId } }),
    );
  } catch {
    /* ignore */
  }
}

/** 역할별 기본 3D 프로필 — public/images/profile (단일 경로) */
export const DEFAULT_PROFILE_IMAGES = {
  admin: '/images/profile/admin-default.webp',
  pastor: '/images/profile/pastor-default.webp',
  member: '/images/profile/member-default.webp',
} as const;

export type ProfileImageRole = keyof typeof DEFAULT_PROFILE_IMAGES;

export function getDefaultProfileImage(role: ProfileImageRole): string {
  return DEFAULT_PROFILE_IMAGES[role];
}

export function roleToProfileImageRole(role?: UserRole | null): ProfileImageRole {
  if (role === 'super_admin') return 'admin';
  if (role === 'pastor') return 'pastor';
  return 'member';
}

export function getProfileImage(userId: string): string | null {
  return localStorage.getItem(PREFIX + userId);
}

export function saveProfileImage(userId: string, file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      localStorage.setItem(PREFIX + userId, dataUrl);
      emitProfileImageChanged(userId);
      resolve(dataUrl);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function removeProfileImage(userId: string): void {
  localStorage.removeItem(PREFIX + userId);
  emitProfileImageChanged(userId);
}

export type ResolveProfileImageInput = {
  userId?: string | null;
  role?: UserRole | ProfileImageRole | null;
  src?: string | null;
};

/**
 * 사용자 등록 사진 → 역할별 기본 3D 프로필 순으로 반환.
 * src가 명시되면 우선, 없으면 localStorage, 둘 다 없으면 기본 이미지.
 */
export function resolveProfileImage({
  userId,
  role,
  src,
}: ResolveProfileImageInput): string {
  const explicit = src?.trim();
  if (explicit) return explicit;

  if (userId) {
    const stored = getProfileImage(userId);
    if (stored?.trim()) return stored;
  }

  const profileRole =
    role === 'admin' || role === 'pastor' || role === 'member'
      ? role
      : roleToProfileImageRole(role as UserRole | null | undefined);

  return getDefaultProfileImage(profileRole);
}

/** 교역자 프로필 — 담임(최고관리자) 이메일은 admin 기본 이미지 */
export function resolveClergyProfileImage(clergy: {
  id?: string;
  email?: string;
  profileImage?: string;
}): string {
  const isChiefAdmin = clergy.email?.toLowerCase() === 'pastor01@churchieum.com';
  return resolveProfileImage({
    userId: clergy.id,
    role: isChiefAdmin ? 'admin' : 'pastor',
    src: clergy.profileImage,
  });
}

export function inferProfileRoleFromAuthorRole(authorRole?: string): ProfileImageRole {
  const r = authorRole?.trim();
  if (!r) return 'member';
  if (r.includes('관리') || r === '담임목사') return 'admin';
  if (r.includes('목사') || r.includes('전도') || r.includes('간사')) return 'pastor';
  return 'member';
}


/** 성도 후보 — 역할 member 기본 */
export function resolveMemberProfileImage(
  userId?: string | null,
  customSrc?: string | null,
): string {
  return resolveProfileImage({ userId, role: 'member', src: customSrc });
}

/**
 * 대표 최고관리자 지정 — 기존 권한(super_admin)을 깨지 않고 표시·정책용 메타만 저장
 */
export const PRIMARY_SUPER_ADMIN_KEY = 'churchieum_primary_super_admin_id_v1';
export const PRIMARY_SUPER_ADMIN_EVENT = 'churchieum:primary-super-admin-changed';
export const SUPER_ADMIN_INVITES_KEY = 'churchieum_super_admin_invites_v1';

export type SuperAdminInvite = {
  id: string;
  name: string;
  phone: string;
  email: string;
  code: string;
  status: '초대 대기' | '가입 완료' | '만료';
  createdAt: string;
};

export function getPrimarySuperAdminId(): string | null {
  try {
    return localStorage.getItem(PRIMARY_SUPER_ADMIN_KEY);
  } catch {
    return null;
  }
}

export function setPrimarySuperAdminId(userId: string): void {
  try {
    localStorage.setItem(PRIMARY_SUPER_ADMIN_KEY, userId);
    window.dispatchEvent(new CustomEvent(PRIMARY_SUPER_ADMIN_EVENT, { detail: { userId } }));
  } catch { /* ignore */ }
}

export function getSuperAdminInvites(): SuperAdminInvite[] {
  try {
    const raw = localStorage.getItem(SUPER_ADMIN_INVITES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SuperAdminInvite[];
  } catch {
    return [];
  }
}

export function saveSuperAdminInvites(list: SuperAdminInvite[]): void {
  try {
    localStorage.setItem(SUPER_ADMIN_INVITES_KEY, JSON.stringify(list));
  } catch { /* ignore */ }
}

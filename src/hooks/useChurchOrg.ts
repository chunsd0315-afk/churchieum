/**
 * @deprecated Prefer useCurrentUserDisplayMeta
 * 하위 호환 — 교회명·조직 라벨만 필요한 기존 호출부용
 */

import type { AppUser } from '../services/permissions';
import { useCurrentUserDisplayMeta } from './useCurrentUserDisplayMeta';

export function useChurchOrg(_user: AppUser | null): {
  churchName: string;
  orgLabel: string;
} {
  void _user;
  const meta = useCurrentUserDisplayMeta();
  return {
    churchName: meta.churchName,
    orgLabel: meta.organizationPathLabel,
  };
}

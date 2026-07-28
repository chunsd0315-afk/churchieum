import { useEffect, useState } from 'react';
import type { ChurchRole, OrgTypeDef } from '../types/organization';
import {
  ORG_META_CHANGED_EVENT,
  getChurchRoles,
  getOrgTypes,
} from '../services/organizationStorage';

/** 조직 종류·직분 변경 시 리렌더 (새로고침 없이 전역 반영) */
export function useOrgMetaVersion(): number {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const bump = () => setVersion(v => v + 1);
    window.addEventListener(ORG_META_CHANGED_EVENT, bump);
    return () => window.removeEventListener(ORG_META_CHANGED_EVENT, bump);
  }, []);
  return version;
}

export function useOrgTypes(activeOnly = true): OrgTypeDef[] {
  const version = useOrgMetaVersion();
  void version;
  const list = getOrgTypes();
  return activeOnly ? list.filter(t => t.isActive) : list;
}

export function useChurchRoles(activeOnly = true): ChurchRole[] {
  const version = useOrgMetaVersion();
  void version;
  const list = getChurchRoles();
  return activeOnly ? list.filter(r => r.isActive) : list;
}

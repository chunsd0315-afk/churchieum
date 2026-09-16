import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Organization, OrgTreeNode } from '../types/organization';
import {
  ORG_TREE_CHANGED_EVENT,
  buildOrgTree,
  getAllOrganizations,
} from '../services/organizationStorage';

const ORG_STORAGE_KEYS = new Set([
  'org_nodes_v1',
  'org_districts_v1',
  'org_zones_v1',
  'org_departments_v1',
]);

/** 조직관리 변경(추가·수정·이동·삭제·정렬)을 새로고침 없이 반영 */
export function useOrganizationTreeVersion(): number {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const bump = () => setVersion(v => v + 1);
    const onStorage = (e: StorageEvent) => {
      if (e.key && ORG_STORAGE_KEYS.has(e.key)) bump();
    };
    window.addEventListener(ORG_TREE_CHANGED_EVENT, bump);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(ORG_TREE_CHANGED_EVENT, bump);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return version;
}

export type OrganizationTreeData = {
  tree: OrgTreeNode[];
  organizations: Organization[];
  version: number;
  refresh: () => void;
};

/** 조직관리 조직트리 — 앱 전체 조직 선택 UI의 단일 원본 */
export function useOrganizationTree(includeInactive = false): OrganizationTreeData {
  const changedVersion = useOrganizationTreeVersion();
  const [manualVersion, setManualVersion] = useState(0);
  const version = changedVersion + manualVersion;

  const refresh = useCallback(() => setManualVersion(v => v + 1), []);

  const tree = useMemo(
    () => buildOrgTree(includeInactive),
    // 조직 저장소 변경 시 재계산
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [includeInactive, version],
  );

  const organizations = useMemo(
    () => getAllOrganizations(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [version],
  );

  return { tree, organizations, version, refresh };
}

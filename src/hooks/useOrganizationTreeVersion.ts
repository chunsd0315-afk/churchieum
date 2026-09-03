import { useEffect, useState } from 'react';
import { ORG_TREE_CHANGED_EVENT } from '../services/organizationStorage';

/** 조직 트리 변경 시 구독 — orgNameById 등 캐시 무효화용 */
export function useOrganizationTreeVersion(): number {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const bump = () => setVersion(v => v + 1);
    window.addEventListener(ORG_TREE_CHANGED_EVENT, bump);
    return () => window.removeEventListener(ORG_TREE_CHANGED_EVENT, bump);
  }, []);
  return version;
}

/**
 * 공개범위 — 내 조직 선택 (공통)
 * 조직관리 트리 원본 + 담당 교역자 표시
 */

import { useEffect, useMemo, useState } from 'react';
import { Check, X } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import {
  getOrganizationPathLabel,
  getUserOrganizationTree,
  resolveOrgTreeMode,
  type OrgFilterTreeNode,
} from '../../../services/userOrganizationTree';
import {
  getPastoralAssigneesForOrganization,
  type DirectPastorOnOrg,
} from '../../../services/directPastorShare';
import { ORG_TREE_CHANGED_EVENT } from '../../../services/organizationStorage';
import { uniqueVisibilityIds } from '../../../services/visibilityNormalize';

export function formatOrgAssigneeLine(pastors: DirectPastorOnOrg[]): string {
  if (pastors.length === 0) return '담당 교역자 없음';
  const first = `${pastors[0].name}${pastors[0].position ? ` ${pastors[0].position}` : ''}`.trim();
  if (pastors.length === 1) return `담당 : ${first}`;
  return `담당 : ${first} 외 ${pastors.length - 1}명`;
}

function flattenOrgsWithDepth(
  nodes: OrgFilterTreeNode[],
  depth = 0,
): { node: OrgFilterTreeNode; depth: number }[] {
  return nodes.flatMap(n => [
    { node: n, depth },
    ...flattenOrgsWithDepth(n.children, depth + 1),
  ]);
}

function Chip({ label, onRemove }: { label: string; onRemove?: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 max-w-full px-2.5 py-1 rounded-full bg-primary-50 text-primary-800 text-[12px] font-semibold border border-primary-200">
      <span className="truncate">{label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 p-0.5 rounded-full hover:bg-primary-100 touch-target min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center"
          aria-label={`${label} 선택 해제`}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </span>
  );
}

export type SelectableOrgRow = {
  id: string;
  name: string;
  depth: number;
  pastors: DirectPastorOnOrg[];
  assigneeLine: string;
};

/** 현재 사용자 관계 조직 + 담당 교역자 — 메뉴 공통 */
export function useUserShareableOrganizations(): {
  orgs: SelectableOrgRow[];
  hasOrgTree: boolean;
  orgTick: number;
} {
  const { user } = useAuth();
  const [orgTick, setOrgTick] = useState(0);

  useEffect(() => {
    const bump = () => setOrgTick(t => t + 1);
    window.addEventListener(ORG_TREE_CHANGED_EVENT, bump);
    window.addEventListener('storage', bump);
    return () => {
      window.removeEventListener(ORG_TREE_CHANGED_EVENT, bump);
      window.removeEventListener('storage', bump);
    };
  }, []);

  const orgTree = useMemo(() => {
    void orgTick;
    return getUserOrganizationTree({
      user,
      mode: resolveOrgTreeMode(user),
      scope: 'mine',
    });
  }, [user, orgTick]);

  const orgs = useMemo(() => {
    return flattenOrgsWithDepth(orgTree)
      .filter(row => row.node.selectable)
      .map(({ node, depth }) => {
        const pastors = getPastoralAssigneesForOrganization(node.id);
        return {
          id: node.id,
          name: node.name,
          depth,
          pastors,
          assigneeLine: formatOrgAssigneeLine(pastors),
        };
      });
  }, [orgTree, orgTick]);

  return { orgs, hasOrgTree: orgs.length > 0, orgTick };
}

type Props = {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  title?: string;
};

export function OrganizationShareSelector({
  selectedIds,
  onChange,
  title = '내 조직 선택',
}: Props) {
  const { orgs, hasOrgTree } = useUserShareableOrganizations();

  const toggleOrg = (orgId: string) => {
    const next = selectedIds.includes(orgId)
      ? selectedIds.filter(id => id !== orgId)
      : [...selectedIds, orgId];
    onChange(uniqueVisibilityIds(next));
  };

  return (
    <div className="rounded-[18px] border border-[#E5E7EB] bg-white overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 pt-3.5 pb-2">
        <p className="text-sm font-bold text-gray-800">{title}</p>
        {selectedIds.length > 0 && (
          <span className="text-[11px] font-semibold text-primary-600 shrink-0">
            {selectedIds.length}개 선택
          </span>
        )}
      </div>
      {!hasOrgTree ? (
        <p className="text-sm text-gray-500 px-4 pb-4">현재 소속·담당 조직이 없습니다.</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {orgs.map(org => {
            const checked = selectedIds.includes(org.id);
            return (
              <button
                key={org.id}
                type="button"
                onClick={() => toggleOrg(org.id)}
                className={`w-full flex items-start gap-3 min-h-[52px] touch-target text-left px-4 py-3 ${
                  checked ? 'bg-[#FFF7D6]/70' : 'bg-white hover:bg-gray-50'
                }`}
                style={{ paddingLeft: 16 + Math.min(org.depth, 4) * 12 }}
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-bold text-gray-900">{org.name}</span>
                  <span
                    className={`block text-[13px] mt-0.5 ${
                      org.pastors.length === 0 ? 'text-amber-700' : 'text-gray-500'
                    }`}
                  >
                    {org.assigneeLine}
                  </span>
                </span>
                <span
                  className={`mt-0.5 shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center ${
                    checked ? 'border-primary-500 bg-primary-500' : 'border-gray-300 bg-white'
                  }`}
                  aria-hidden
                >
                  {checked && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                </span>
              </button>
            );
          })}
        </div>
      )}
      {selectedIds.length === 0 && hasOrgTree && (
        <p className="text-[12px] text-amber-800 bg-[#FFF7D6] mx-3 my-3 rounded-xl px-3 py-2 border border-primary-200">
          공유할 조직을 하나 이상 선택해 주세요.
        </p>
      )}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 py-3 border-t border-gray-100">
          {selectedIds.map(id => {
            const row = orgs.find(o => o.id === id);
            return (
              <Chip
                key={id}
                label={row?.name || getOrganizationPathLabel(id)}
                onRemove={() => toggleOrg(id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

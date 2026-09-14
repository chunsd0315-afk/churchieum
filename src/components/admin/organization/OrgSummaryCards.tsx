/**
 * 조직 상세 상단 요약카드 — 기존 3열 빠른요약 패널을 대체
 */

import { useMemo } from 'react';
import { Users, UserRound, FolderTree, ChevronRight } from 'lucide-react';
import {
  getChildOrganizations,
  getMembershipsForOrg,
  getOrganizationById,
} from '../../../services/organizationStorage';
import { getAssigneesForOrg } from '../../../services/orgAssigneeStorage';
import { assigneeRoleLabel } from '../../../types/organization';

type Props = {
  orgId: string | null;
  tick?: number;
  onGoMembers?: () => void;
  onGoClergy?: () => void;
};

export function OrgSummaryCards({ orgId, tick = 0, onGoMembers, onGoClergy }: Props) {
  void tick;

  const org = orgId ? getOrganizationById(orgId) ?? null : null;

  const summary = useMemo(() => {
    if (!org) return null;
    const assignees = getAssigneesForOrg(org.id);
    const pastors = assignees.filter(a => a.assigneeType === 'pastor');
    const primaryPastor = pastors.find(a => a.isPrimary) ?? pastors[0] ?? null;
    const memberships = getMembershipsForOrg(org.id);
    const childCount = getChildOrganizations(org.id).length;

    return {
      primaryPastor,
      pastorCount: pastors.length,
      membershipCount: memberships.length,
      childCount,
    };
  }, [org, tick]);

  if (!org || !summary) return null;

  const pastorLine = summary.primaryPastor
    ? `${summary.primaryPastor.userName}${
        summary.primaryPastor.roleLabel || summary.primaryPastor.titleLabel
          ? ` · ${assigneeRoleLabel(summary.primaryPastor.role, summary.primaryPastor.roleLabel)}`
          : ''
      }`
    : '미지정';

  const cards = [
    {
      key: 'pastor',
      label: '담당 교역자',
      value: pastorLine,
      sub: summary.primaryPastor?.titleLabel || undefined,
      icon: UserRound,
    },
    {
      key: 'members',
      label: '성도',
      value: `${summary.membershipCount}명`,
      icon: Users,
    },
    {
      key: 'clergy',
      label: '교역자',
      value: `${summary.pastorCount}명`,
      icon: UserRound,
    },
    {
      key: 'children',
      label: '하위조직',
      value: `${summary.childCount}개`,
      icon: FolderTree,
    },
  ] as const;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-2">
        {cards.map(c => (
          <div
            key={c.key}
            className="rounded-[14px] border border-[#ECECEC] bg-[#FFFDF7] px-3 py-2.5 min-w-0"
          >
            <div className="flex items-center gap-1.5 text-gray-400 mb-1">
              <c.icon className="w-3.5 h-3.5 shrink-0" />
              <span className="text-[11px] font-semibold truncate">{c.label}</span>
            </div>
            <p className="text-sm font-bold text-gray-900 truncate" title={c.value}>
              {c.value}
            </p>
            {'sub' in c && c.sub ? (
              <p className="text-[10px] text-gray-400 mt-0.5 truncate">{c.sub}</p>
            ) : null}
          </div>
        ))}
      </div>
      {(onGoMembers || onGoClergy) && (
        <div className="flex flex-wrap gap-2">
          {onGoMembers && (
            <button
              type="button"
              onClick={onGoMembers}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary-700 hover:underline touch-target min-h-[36px]"
            >
              성도관리에서 보기
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
          {onGoClergy && (
            <button
              type="button"
              onClick={onGoClergy}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary-700 hover:underline touch-target min-h-[36px]"
            >
              교역자관리에서 보기
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

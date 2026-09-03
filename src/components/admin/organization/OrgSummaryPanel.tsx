/**
 * 조직관리 오른쪽 빠른 요약 / 관리 패널
 */

import { useMemo } from 'react';
import {
  Users, UserRound, FolderTree, Clock, ChevronRight, Church,
} from 'lucide-react';
import {
  getAllOrganizations,
  getAncestorIds,
  getChildOrganizations,
  getDescendantIds,
  getMembershipsForOrg,
  getOrganizationById,
} from '../../../services/organizationStorage';
import { getAssigneesForOrg } from '../../../services/orgAssigneeStorage';
import { getOrganizationTypeDisplay } from '../../../services/orgTerminology';
import { assigneeRoleLabel } from '../../../types/organization';

type Props = {
  orgId: string | null;
  tick?: number;
  onGoMembers?: () => void;
  onGoClergy?: () => void;
};

function formatUpdatedAt(iso?: string): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso.slice(0, 16);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${y}.${m}.${day} ${hh}:${mm}`;
  } catch {
    return '—';
  }
}

export function OrgSummaryPanel({ orgId, tick = 0, onGoMembers, onGoClergy }: Props) {
  void tick;

  const org = orgId ? getOrganizationById(orgId) ?? null : null;

  const summary = useMemo(() => {
    if (!org) return null;
    const all = getAllOrganizations();
    const ancestors = getAncestorIds(org.id)
      .map(id => all.find(o => o.id === id)?.name)
      .filter(Boolean)
      .reverse();
    const path = [...ancestors, org.name].join(' > ');
    const assignees = getAssigneesForOrg(org.id);
    const pastors = assignees.filter(a => a.assigneeType === 'pastor');
    const memberAssignees = assignees.filter(a => a.assigneeType === 'member');
    const primaryPastor =
      pastors.find(a => a.isPrimary) ?? pastors[0] ?? null;
    const memberships = getMembershipsForOrg(org.id);
    const childCount = getChildOrganizations(org.id).length;
    const descendantCount = getDescendantIds(org.id).length;

    return {
      path,
      typeLabel: getOrganizationTypeDisplay(org),
      primaryPastor,
      pastorCount: pastors.length,
      memberAssigneeCount: memberAssignees.length,
      membershipCount: memberships.length,
      childCount,
      descendantCount,
      updatedAt: org.updatedAt,
      isActive: org.isActive,
    };
  }, [org, tick]);

  if (!org || !summary) {
    return (
      <aside className="bg-white border border-[#ECECEC] rounded-[20px] shadow-[0_8px_30px_rgba(0,0,0,0.06)] p-5 h-full min-h-[320px] flex flex-col items-center justify-center text-center">
        <Church className="w-10 h-10 text-gray-200 mb-3" />
        <p className="text-sm font-semibold text-gray-500">조직을 선택하세요</p>
        <p className="text-xs text-gray-400 mt-1">왼쪽 트리에서 조직을 고르면<br />요약이 여기에 표시됩니다.</p>
      </aside>
    );
  }

  return (
    <aside className="bg-white border border-[#ECECEC] rounded-[20px] shadow-[0_8px_30px_rgba(0,0,0,0.06)] overflow-hidden h-full flex flex-col min-h-[320px]">
      <div className="px-4 py-4 border-b border-gray-100 bg-[#FFFDF7]">
        <p className="text-[11px] font-semibold text-gray-400 mb-1 truncate" title={summary.path}>
          {summary.path}
        </p>
        <h3 className="text-base font-bold text-gray-900 truncate">{org.name}</h3>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
            {summary.typeLabel}
          </span>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
            summary.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {summary.isActive ? '활성' : '비활성'}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <section>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">담당 교역자</p>
          {summary.primaryPastor ? (
            <div className="rounded-[14px] bg-primary-50/60 border border-primary-100 px-3 py-2.5">
              <p className="text-sm font-bold text-gray-900">{summary.primaryPastor.userName}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {assigneeRoleLabel(summary.primaryPastor.role, summary.primaryPastor.roleLabel)}
                {summary.primaryPastor.titleLabel ? ` · ${summary.primaryPastor.titleLabel}` : ''}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-400">지정된 담당 교역자가 없습니다</p>
          )}
        </section>

        <div className="border-t border-gray-100" />

        <section className="space-y-2">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">소속 인원</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-[14px] border border-[#ECECEC] px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                <Users className="w-3.5 h-3.5" />
                <span className="text-[11px] font-semibold">소속</span>
              </div>
              <p className="text-lg font-bold text-gray-900 tabular-nums">{summary.membershipCount}<span className="text-xs font-semibold text-gray-400 ml-0.5">명</span></p>
            </div>
            <div className="rounded-[14px] border border-[#ECECEC] px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                <UserRound className="w-3.5 h-3.5" />
                <span className="text-[11px] font-semibold">담당</span>
              </div>
              <p className="text-lg font-bold text-gray-900 tabular-nums">
                {summary.pastorCount + summary.memberAssigneeCount}
                <span className="text-xs font-semibold text-gray-400 ml-0.5">명</span>
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                교역자 {summary.pastorCount} · 성도 {summary.memberAssigneeCount}
              </p>
            </div>
          </div>
        </section>

        <div className="border-t border-gray-100" />

        <section>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">하위 조직</p>
          <div className="flex items-center gap-2 rounded-[14px] border border-[#ECECEC] px-3 py-2.5">
            <FolderTree className="w-4 h-4 text-primary-500" />
            <div>
              <p className="text-sm font-bold text-gray-900">
                직속 {summary.childCount}개
              </p>
              <p className="text-[11px] text-gray-400">전체 하위 {summary.descendantCount}개</p>
            </div>
          </div>
        </section>

        <div className="border-t border-gray-100" />

        <section>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">최근 변경</p>
          <p className="text-sm text-gray-600 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            {formatUpdatedAt(summary.updatedAt)}
          </p>
        </section>
      </div>

      <div className="p-3 border-t border-gray-100 space-y-2">
        {onGoMembers && (
          <button
            type="button"
            onClick={onGoMembers}
            className="w-full flex items-center justify-between gap-2 px-3 py-2.5 min-h-[44px] rounded-[14px] border border-[#ECECEC] text-sm font-semibold text-gray-700 hover:bg-primary-50 hover:border-primary-200 transition-colors touch-target"
          >
            성도관리에서 보기
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        )}
        {onGoClergy && (
          <button
            type="button"
            onClick={onGoClergy}
            className="w-full flex items-center justify-between gap-2 px-3 py-2.5 min-h-[44px] rounded-[14px] border border-[#ECECEC] text-sm font-semibold text-gray-700 hover:bg-primary-50 hover:border-primary-200 transition-colors touch-target"
          >
            교역자관리에서 보기
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>
    </aside>
  );
}

import type { VisibilityType } from '../../../types/sharedContent';
import { migrateVisibility, VISIBILITY_LABELS } from '../../../types/sharedContent';
import {
  getDistrictNameById,
  getZoneNameById,
  getDepartmentNameById,
} from '../../../services/orgData';
import { getAllClergy } from '../../../services/clergyData';
import type { SharedContentLike } from '../../../services/sharedContentAccess';
import { resolveSharedOrganizationIds } from '../../../services/sharedContentAccess';

function orgName(id: string): string {
  const d = getDistrictNameById(id);
  if (d && d !== '-') return d;
  const z = getZoneNameById(id);
  if (z && z !== '-') return z;
  const dep = getDepartmentNameById(id);
  if (dep && dep !== '-') return dep;
  return id;
}

export function VisibilityBadge({
  visibility,
  className = '',
}: {
  visibility: VisibilityType | string;
  className?: string;
}) {
  const v = migrateVisibility(visibility);
  const colors: Record<VisibilityType, string> = {
    private: 'bg-gray-100 text-gray-600',
    pastor_share: 'bg-indigo-50 text-indigo-700',
    organization_share: 'bg-emerald-50 text-emerald-700',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${colors[v]} ${className}`}
    >
      {VISIBILITY_LABELS[v]}
    </span>
  );
}

export function SharedTargetSummary({
  content,
  className = '',
}: {
  content: SharedContentLike;
  className?: string;
}) {
  const v = migrateVisibility(content.visibility);
  if (v === 'private') {
    return <span className={`text-[12px] text-gray-400 ${className}`}>나만 보기</span>;
  }

  if (v === 'pastor_share') {
    const clergy = getAllClergy();
    const ids = content.sharedPastorIds ?? [];
    if (content.sharedPastorAll || ids.length === 0) {
      return <span className={`text-[12px] text-indigo-600 ${className}`}>담당 교역자와 공유</span>;
    }
    const names = ids
      .map(id => clergy.find(c => c.id === id)?.name)
      .filter(Boolean) as string[];
    if (names.length === 0) {
      return <span className={`text-[12px] text-indigo-600 ${className}`}>교역자와 공유</span>;
    }
    if (names.length === 1) {
      return (
        <span className={`text-[12px] text-indigo-600 ${className}`}>
          {names[0]} 목사님과 공유
        </span>
      );
    }
    return (
      <span className={`text-[12px] text-indigo-600 ${className}`}>
        {names[0]} 외 {names.length - 1}명과 공유
      </span>
    );
  }

  const orgs = resolveSharedOrganizationIds(content).map(orgName);
  if (orgs.length === 0) {
    return <span className={`text-[12px] text-emerald-600 ${className}`}>교구·부서 공유</span>;
  }
  if (orgs.length === 1) {
    return (
      <span className={`text-[12px] text-emerald-600 ${className}`}>{orgs[0]} 공유</span>
    );
  }
  return (
    <span className={`text-[12px] text-emerald-600 ${className}`}>
      {orgs[0]} 외 {orgs.length - 1}개 조직
    </span>
  );
}

export function PrayerStatusBadge({
  status,
  className = '',
}: {
  status: 'praying' | 'answered' | string;
  className?: string;
}) {
  const answered = status === 'answered';
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
        answered ? 'bg-amber-50 text-amber-700' : 'bg-sky-50 text-sky-700'
      } ${className}`}
    >
      {answered ? '응답' : '기도 중'}
    </span>
  );
}

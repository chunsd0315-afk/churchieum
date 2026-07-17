import { useMemo, useState } from 'react';
import type { EligibleGroup } from '../../../services/graceNoteShareScope';
import { getDistrictNameById } from '../../../services/orgData';

export type OrganizationFilterItem = EligibleGroup & {
  parentName?: string;
};

export type OrganizationFilterSelectorProps = {
  organizations: OrganizationFilterItem[];
  selectedOrganizationIds: string[];
  onChange: (organizationIds: string[]) => void;
  showTypeTabs?: boolean;
  showSearch?: boolean;
  className?: string;
};

type KindTab = 'all' | 'district' | 'department';

const KIND_LABEL: Record<EligibleGroup['kind'], string> = {
  district: '교구',
  zone: '구역',
  department: '부서',
};

function parentLabel(g: OrganizationFilterItem): string | undefined {
  if (g.parentName) return g.parentName;
  if (g.kind === 'zone' && g.parentId) {
    const name = getDistrictNameById(g.parentId);
    return name && name !== '-' ? name : undefined;
  }
  return undefined;
}

/**
 * 공유받은 기록 필터용 — 조회 가능 조직 다중 선택 (OR)
 * selectedOrganizationIds === [] → 전체 조직
 */
export function OrganizationFilterSelector({
  organizations,
  selectedOrganizationIds,
  onChange,
  showTypeTabs = true,
  showSearch = true,
  className = '',
}: OrganizationFilterSelectorProps) {
  const [q, setQ] = useState('');
  const [kindTab, setKindTab] = useState<KindTab>('all');

  const filtered = useMemo(() => {
    let list = organizations;
    if (kindTab === 'district') {
      list = list.filter(g => g.kind === 'district' || g.kind === 'zone');
    } else if (kindTab === 'department') {
      list = list.filter(g => g.kind === 'department');
    }
    const needle = q.trim().toLowerCase();
    if (!needle) return list;
    return list.filter(g => {
      const parent = parentLabel(g) ?? '';
      const kind = KIND_LABEL[g.kind];
      return (
        g.name.toLowerCase().includes(needle) ||
        parent.toLowerCase().includes(needle) ||
        kind.includes(needle)
      );
    });
  }, [organizations, kindTab, q]);

  const isAll = selectedOrganizationIds.length === 0;

  const selectAll = () => onChange([]);

  const toggle = (id: string) => {
    if (selectedOrganizationIds.includes(id)) {
      const next = selectedOrganizationIds.filter(x => x !== id);
      onChange(next);
    } else {
      onChange([...selectedOrganizationIds, id]);
    }
  };

  if (organizations.length === 0) {
    return (
      <p className={`text-sm text-gray-500 px-1 py-2 ${className}`}>
        선택할 수 있는 교구·부서가 없습니다.
      </p>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2 gap-2">
        <p className="text-xs font-bold text-gray-500">교구·부서 선택</p>
        {!isAll && (
          <span className="text-[11px] font-semibold text-primary-600">
            {selectedOrganizationIds.length}개 선택
          </span>
        )}
      </div>

      {showTypeTabs && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {(
            [
              { id: 'all' as const, label: '전체' },
              { id: 'district' as const, label: '교구' },
              { id: 'department' as const, label: '부서' },
            ] as const
          ).map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setKindTab(t.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold touch-target ${
                kindTab === t.id ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {showSearch && organizations.length > 6 && (
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="조직명 검색"
          className="w-full mb-2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:bg-white focus:border-primary-400 focus:outline-none"
        />
      )}

      <div className="bg-white border border-gray-200 overflow-hidden rounded-card divide-y divide-gray-100 max-h-56 overflow-y-auto">
        <label className="flex items-center gap-3 px-4 py-3 min-h-[48px] touch-target cursor-pointer hover:bg-gray-50">
          <input
            type="checkbox"
            checked={isAll}
            onChange={selectAll}
            className="w-5 h-5 rounded border-gray-300 text-primary-600 shrink-0"
          />
          <span className="text-[14px] font-semibold text-gray-800">전체 조직</span>
        </label>

        {filtered.map(g => {
          const checked = !isAll && selectedOrganizationIds.includes(g.id);
          const parent = parentLabel(g);
          return (
            <label
              key={g.id}
              className="flex items-start gap-3 px-4 py-3 min-h-[48px] touch-target cursor-pointer hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(g.id)}
                className="mt-0.5 w-5 h-5 rounded border-gray-300 text-primary-600 shrink-0"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-semibold text-gray-800">{g.name}</span>
                {parent && (
                  <span className="block text-[11px] text-gray-400 mt-0.5">{parent}</span>
                )}
              </span>
              <span className="text-[11px] text-gray-400 shrink-0 mt-0.5">
                {KIND_LABEL[g.kind]}
              </span>
            </label>
          );
        })}

        {filtered.length === 0 && (
          <p className="px-4 py-3 text-sm text-gray-400">검색 결과가 없습니다.</p>
        )}
      </div>
    </div>
  );
}

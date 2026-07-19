import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';
import type { EligiblePastor } from '../../../services/graceNoteShareScope';
import type { PastorOrgGroup } from '../../../services/graceShareFilterHelpers';

export type PastorOrgFilterSelectorProps = {
  groups: PastorOrgGroup[];
  selectedPastorIds: string[];
  onChange: (pastorIds: string[]) => void;
  searchable?: boolean;
  sectionTitle?: string;
  className?: string;
  /** [] = 전체 교역자 */
  emptyMeansAll?: boolean;
};

/**
 * 조직별 교역자 다중 선택 필터
 * selectedPastorIds === [] → 전체 (emptyMeansAll)
 */
export function PastorOrgFilterSelector({
  groups,
  selectedPastorIds,
  onChange,
  searchable = true,
  sectionTitle = '교역자 선택',
  className = '',
  emptyMeansAll = true,
}: PastorOrgFilterSelectorProps) {
  const [q, setQ] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const flat = useMemo(() => {
    const map = new Map<string, EligiblePastor>();
    for (const g of groups) {
      for (const p of g.pastors) map.set(p.id, p);
    }
    return [...map.values()];
  }, [groups]);

  useEffect(() => {
    setExpanded(new Set(groups.map(g => g.organizationId)));
  }, [groups]);

  const filteredGroups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return groups;
    return groups
      .map(g => ({
        ...g,
        pastors: g.pastors.filter(
          p =>
            p.name.toLowerCase().includes(needle) ||
            p.position.toLowerCase().includes(needle) ||
            g.organizationName.toLowerCase().includes(needle),
        ),
      }))
      .filter(g => g.pastors.length > 0);
  }, [groups, q]);

  const isAll = emptyMeansAll && selectedPastorIds.length === 0;

  const toggle = (id: string) => {
    const base = isAll ? [] : selectedPastorIds;
    if (base.includes(id)) {
      onChange(base.filter(x => x !== id));
    } else {
      onChange([...base, id]);
    }
  };

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (flat.length === 0) {
    return (
      <p className={`text-sm text-gray-500 px-1 py-2 ${className}`}>
        선택할 수 있는 교역자가 없습니다.
      </p>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2 gap-2">
        <p className="text-xs font-bold text-gray-500">{sectionTitle}</p>
        {!isAll && (
          <span className="text-[11px] font-semibold text-primary-600">
            {selectedPastorIds.length}명 선택
          </span>
        )}
      </div>

      {searchable && flat.length >= 6 && (
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="교역자·조직 검색"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:bg-white focus:border-primary-400 focus:outline-none"
          />
        </div>
      )}

      <div className="bg-white border border-gray-200 overflow-hidden rounded-card max-h-64 overflow-y-auto">
        {emptyMeansAll && (
          <label className="flex items-center gap-3 px-4 py-3 min-h-[48px] touch-target cursor-pointer hover:bg-gray-50 border-b border-gray-100">
            <input
              type="checkbox"
              checked={isAll}
              onChange={() => onChange([])}
              className="w-5 h-5 rounded border-gray-300 text-primary-600 shrink-0"
            />
            <span className="text-[14px] font-semibold text-gray-800">전체 교역자</span>
          </label>
        )}

        <div className="py-1">
          {filteredGroups.map(g => {
            const open = expanded.has(g.organizationId);
            return (
              <div key={g.organizationId}>
                <button
                  type="button"
                  onClick={() => toggleExpand(g.organizationId)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 min-h-[44px] touch-target hover:bg-gray-50 text-left"
                >
                  {open ? (
                    <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500 shrink-0" />
                  )}
                  <span className="text-[13px] font-bold text-gray-700 truncate">
                    {g.organizationName}
                  </span>
                  <span className="text-[11px] text-gray-400 shrink-0">
                    {g.pastors.length}
                  </span>
                </button>
                {open &&
                  g.pastors.map(p => {
                    const checked = !isAll && selectedPastorIds.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className="flex items-center gap-3 pl-10 pr-4 py-2.5 min-h-[48px] touch-target cursor-pointer hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggle(p.id)}
                          className="w-5 h-5 rounded border-gray-300 text-primary-600 shrink-0"
                        />
                        <span className="min-w-0">
                          <span className="block text-[14px] font-semibold text-gray-800">
                            {p.name} {p.position}
                          </span>
                        </span>
                      </label>
                    );
                  })}
              </div>
            );
          })}
          {filteredGroups.length === 0 && (
            <p className="px-4 py-3 text-sm text-gray-400">검색 결과가 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type {
  AvailablePastor,
  AvailablePastorForFilter,
  PastorFilterGroups,
} from '../../../services/graceShareFilterHelpers';

export type PastorFlatFilterSelectorProps = {
  /** @deprecated pastorGroups 사용 권장 */
  pastors?: AvailablePastor[];
  pastorGroups?: PastorFilterGroups;
  selectedPastorIds: string[];
  onChange: (pastorIds: string[]) => void;
  searchable?: boolean;
  sectionTitle?: string;
  className?: string;
};

function formatOrgSubtitle(names: string[]): string {
  if (names.length === 0) return '';
  if (names.length <= 3) return names.join(' · ');
  return `${names.slice(0, 2).join(' · ')} · 외 ${names.length - 2}개`;
}

function pastorDisplayName(p: AvailablePastor): string {
  return `${p.name}${p.position ? ` ${p.position}` : ''}`.trim();
}

function matchesPastorSearch(p: AvailablePastorForFilter, needle: string): boolean {
  const hay = [
    p.name,
    p.position,
    ...p.organizationNames,
    p.shareOrganizationName,
    p.statusLabel,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return hay.includes(needle);
}

function PastorCheckboxRow({
  pastor: p,
  checked,
  onToggle,
}: {
  pastor: AvailablePastorForFilter;
  checked: boolean;
  onToggle: () => void;
}) {
  const subtitle =
    p.group === 'historical'
      ? p.statusLabel ?? '이전 공유 대상'
      : formatOrgSubtitle(p.organizationNames);

  return (
    <label className="flex items-start gap-3 px-4 py-3 min-h-[52px] touch-target cursor-pointer hover:bg-gray-50 border-b border-gray-50 last:border-b-0">
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="w-5 h-5 mt-0.5 rounded border-gray-300 text-primary-600 shrink-0"
      />
      <span className="min-w-0">
        <span className="block text-[14px] font-semibold text-gray-800">
          {pastorDisplayName(p)}
        </span>
        {subtitle && (
          <span className="block text-[12px] text-gray-500 mt-0.5 leading-snug">
            {subtitle}
          </span>
        )}
      </span>
    </label>
  );
}

/**
 * 조직 트리 없이 교역자만 다중 선택 (내 기록 · 담당 교역자와 공유 필터)
 */
export function PastorFlatFilterSelector({
  pastors,
  pastorGroups,
  selectedPastorIds,
  onChange,
  searchable = true,
  sectionTitle = '교역자 선택',
  className = '',
}: PastorFlatFilterSelectorProps) {
  const [q, setQ] = useState('');

  const { current, historical, flat } = useMemo(() => {
    if (pastorGroups) {
      const cur = pastorGroups.current ?? [];
      const hist = pastorGroups.historical ?? [];
      return {
        current: cur,
        historical: hist,
        flat: [...cur, ...hist],
      };
    }
    const list = (Array.isArray(pastors) ? pastors : []).map(p => ({
      ...p,
      group: 'current' as const,
    }));
    return { current: list, historical: [] as AvailablePastorForFilter[], flat: list };
  }, [pastorGroups, pastors]);

  const filteredCurrent = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return current;
    return current.filter(p => matchesPastorSearch(p, needle));
  }, [current, q]);

  const filteredHistorical = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return historical;
    return historical.filter(p => matchesPastorSearch(p, needle));
  }, [historical, q]);

  const toggle = (id: string) => {
    if (selectedPastorIds.includes(id)) {
      onChange(selectedPastorIds.filter(x => x !== id));
    } else {
      onChange([...selectedPastorIds, id]);
    }
  };

  const hasResults = filteredCurrent.length > 0 || filteredHistorical.length > 0;

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
        <p className="text-sm font-bold text-gray-800">{sectionTitle}</p>
        {selectedPastorIds.length > 0 && (
          <span className="text-[11px] font-semibold text-primary-600">
            {selectedPastorIds.length}명 선택
          </span>
        )}
      </div>

      {searchable && flat.length >= 3 && (
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="교역자 이름을 검색하세요"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:bg-white focus:border-primary-400 focus:outline-none"
          />
        </div>
      )}

      <div className="bg-white border border-gray-200 overflow-hidden rounded-card max-h-72 overflow-y-auto">
        {filteredCurrent.length > 0 && (
          <div>
            {historical.length > 0 && (
              <p className="px-4 pt-3 pb-1 text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                현재 교역자
              </p>
            )}
            {filteredCurrent.map(p => (
              <PastorCheckboxRow
                key={p.id}
                pastor={p}
                checked={selectedPastorIds.includes(p.id)}
                onToggle={() => toggle(p.id)}
              />
            ))}
          </div>
        )}

        {filteredHistorical.length > 0 && (
          <div>
            <p className="px-4 pt-3 pb-1 text-[11px] font-bold text-gray-400 uppercase tracking-wide border-t border-gray-100">
              이전에 공유한 교역자
            </p>
            {filteredHistorical.map(p => (
              <PastorCheckboxRow
                key={p.id}
                pastor={p}
                checked={selectedPastorIds.includes(p.id)}
                onToggle={() => toggle(p.id)}
              />
            ))}
          </div>
        )}

        {!hasResults && (
          <p className="px-4 py-6 text-sm text-gray-400 text-center">검색 결과가 없습니다.</p>
        )}
      </div>
    </div>
  );
}

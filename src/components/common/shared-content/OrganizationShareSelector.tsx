import { useMemo, useState } from 'react';
import type { EligibleGroup } from '../../../services/graceNoteShareScope';
import type { ShareableOrganizations } from '../../../services/sharedContentAccess';
import { getDistrictDepartmentLabel } from '../../../services/orgTerminology';
import { useOrgSettings } from '../../../contexts/OrgSettingsContext';

export type OrganizationShareSelectorProps = {
  organizations: ShareableOrganizations;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  searchable?: boolean;
  className?: string;
};

function rowLabel(g: EligibleGroup): string {
  return g.name;
}

export function OrganizationShareSelector({
  organizations,
  selectedIds,
  onChange,
  searchable = false,
  className = '',
}: OrganizationShareSelectorProps) {
  const { districtDepartmentLabel } = useOrgSettings();
  const [q, setQ] = useState('');
  const all = organizations.all;

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return all;
    return all.filter(g => g.name.toLowerCase().includes(needle));
  }, [all, q]);

  if (all.length === 0) {
    return (
      <p className="text-sm text-gray-500 px-1 py-2">
        공유할 수 있는 {districtDepartmentLabel}가 없습니다.
      </p>
    );
  }

  const toggle = (id: string) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter(x => x !== id)
        : [...selectedIds, id],
    );
  };

  return (
    <div className={className}>
      <p className="text-xs font-bold text-gray-500 mb-2">공유할 {districtDepartmentLabel}</p>
      {searchable && (
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="조직 검색"
          className="w-full mb-2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:bg-white focus:border-primary-400 focus:outline-none"
        />
      )}
      <div className="bg-white border border-gray-200 overflow-hidden rounded-card divide-y divide-gray-100 max-h-64 overflow-y-auto">
        {filtered.map(g => {
          const checked = selectedIds.includes(g.id);
          return (
            <label
              key={g.id}
              className="flex items-center gap-3 px-4 py-3 min-h-[48px] touch-target cursor-pointer hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(g.id)}
                className="w-5 h-5 rounded border-gray-300 text-primary-600 shrink-0"
              />
              <span className="text-[14px] font-semibold text-gray-800">{rowLabel(g)}</span>
              <span className="ml-auto text-[11px] text-gray-400">
                {g.kind === 'district' ? '교구' : g.kind === 'zone' ? '구역' : '부서'}
              </span>
            </label>
          );
        })}
      </div>
      {selectedIds.length === 0 && (
        <p className="text-[12px] text-amber-600 mt-2">최소 1개 조직을 선택해야 저장할 수 있어요.</p>
      )}
    </div>
  );
}

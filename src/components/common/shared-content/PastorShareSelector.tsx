import { useMemo, useState } from 'react';
import type { EligiblePastor } from '../../../services/graceNoteShareScope';

export type PastorShareSelectorProps = {
  pastors: EligiblePastor[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  /** 기본 전체 선택 권장 */
  searchable?: boolean;
  className?: string;
};

export function PastorShareSelector({
  pastors,
  selectedIds,
  onChange,
  searchable = false,
  className = '',
}: PastorShareSelectorProps) {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return pastors;
    return pastors.filter(
      p =>
        p.name.toLowerCase().includes(needle) ||
        p.position.toLowerCase().includes(needle) ||
        p.orgLabels.some(l => l.toLowerCase().includes(needle)),
    );
  }, [pastors, q]);

  if (pastors.length === 0) {
    return (
      <p className="text-sm text-gray-500 px-1 py-2">공유할 수 있는 교역자가 없습니다.</p>
    );
  }

  if (pastors.length === 1) {
    const p = pastors[0]!;
    const checked = selectedIds.includes(p.id);
    return (
      <div className={className}>
        <p className="text-xs font-bold text-gray-500 mb-2">공유할 교역자</p>
        <label className="flex items-center gap-3 min-h-[48px] touch-target cursor-pointer">
          <input
            type="checkbox"
            checked={checked}
            onChange={() => onChange(checked ? [] : [p.id])}
            className="w-5 h-5 rounded border-gray-300 text-primary-600"
          />
          <span className="text-[14px] font-semibold text-gray-800">
            {p.name} {p.position}
            {p.orgLabels[0] ? ` · ${p.orgLabels[0]}` : ''}
          </span>
        </label>
      </div>
    );
  }

  const allSelected = pastors.every(p => selectedIds.includes(p.id));

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold text-gray-500">공유할 교역자</p>
        <button
          type="button"
          className="text-xs font-semibold text-primary-600 touch-target px-2"
          onClick={() =>
            onChange(allSelected ? [] : pastors.map(p => p.id))
          }
        >
          {allSelected ? '전체 해제' : '전체 선택'}
        </button>
      </div>
      {searchable && (
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="교역자 검색"
          className="w-full mb-2 px-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:bg-white focus:border-primary-400 focus:outline-none"
        />
      )}
      <div className="bg-white border border-gray-200 overflow-hidden rounded-card divide-y divide-gray-100">
        {filtered.map(p => {
          const checked = selectedIds.includes(p.id);
          return (
            <label
              key={p.id}
              className="flex items-start gap-3 px-4 py-3 min-h-[48px] touch-target cursor-pointer hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => {
                  onChange(
                    checked
                      ? selectedIds.filter(id => id !== p.id)
                      : [...selectedIds, p.id],
                  );
                }}
                className="mt-0.5 w-5 h-5 rounded border-gray-300 text-primary-600 shrink-0"
              />
              <span className="min-w-0">
                <span className="block text-[14px] font-semibold text-gray-800">
                  {p.name} {p.position}
                </span>
                {p.orgLabels.length > 0 && (
                  <span className="block text-[12px] text-gray-500 mt-0.5">
                    {p.orgLabels.join(' · ')}
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';

export type SharedContentAuthorOption = {
  id: string;
  name: string;
  role: 'member' | 'pastor' | 'admin';
  positionLabel?: string;
  orgLabel?: string;
};

function roleBadge(role: SharedContentAuthorOption['role']): string {
  if (role === 'pastor') return '교역자';
  if (role === 'admin') return '최고관리자';
  return '성도';
}

export function SharedContentAuthorSelector({
  authors,
  selectedIds,
  onChange,
  roleFilter = 'all',
}: {
  authors: SharedContentAuthorOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  roleFilter?: 'all' | 'member' | 'pastor' | 'super_admin';
}) {
  const [query, setQuery] = useState('');

  const filteredAuthors = useMemo(() => {
    let list = authors;
    if (roleFilter === 'member') {
      list = list.filter(a => a.role === 'member');
    } else if (roleFilter === 'pastor') {
      list = list.filter(a => a.role === 'pastor');
    } else if (roleFilter === 'super_admin') {
      list = list.filter(a => a.role === 'admin');
    }

    const needle = query.trim().toLowerCase();
    if (!needle) return list;
    return list.filter(
      a =>
        a.name.toLowerCase().includes(needle) ||
        (a.positionLabel?.toLowerCase().includes(needle) ?? false) ||
        (a.orgLabel?.toLowerCase().includes(needle) ?? false),
    );
  }, [authors, roleFilter, query]);

  const toggle = (id: string) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter(x => x !== id)
        : [...selectedIds, id],
    );
  };

  return (
    <div>
      <p className="text-sm font-bold text-gray-800 mb-2">작성자 선택</p>
      <div className="relative mb-2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="작성자 이름을 검색하세요."
          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50"
        />
      </div>
      {selectedIds.length === 0 && (
        <p className="text-xs text-gray-500 mb-2">전체 작성자</p>
      )}
      <div className="bg-white border border-gray-200 rounded-card divide-y divide-gray-100 max-h-64 overflow-y-auto">
        {filteredAuthors.length === 0 ? (
          <p className="text-sm text-gray-500 px-4 py-3">선택할 작성자가 없습니다.</p>
        ) : (
          filteredAuthors.map(author => {
            const checked = selectedIds.includes(author.id);
            return (
              <label
                key={author.id}
                className="flex items-start gap-3 px-4 py-3 min-h-[48px] touch-target cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(author.id)}
                  className="mt-0.5 w-5 h-5 rounded border-gray-300 text-primary-600 shrink-0"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 flex-wrap">
                    <span className="text-[14px] font-semibold text-gray-800">{author.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-semibold">
                      {roleBadge(author.role)}
                    </span>
                  </span>
                  {(author.positionLabel || author.orgLabel) && (
                    <span className="block text-[12px] text-gray-500 mt-0.5">
                      {[author.positionLabel, author.orgLabel].filter(Boolean).join(' · ')}
                    </span>
                  )}
                </span>
              </label>
            );
          })
        )}
      </div>
    </div>
  );
}

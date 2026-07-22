import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';
import type { AuthorOrgGroup } from '../../services/graceShareAuthorOrgGroups';
import type { SharedContentAuthorOption } from './SharedContentAuthorSelector';

export type AuthorOrgFilterSelectorProps = {
  groups: AuthorOrgGroup[];
  selectedOrganizationIds: string[];
  selectedAuthorIds: string[];
  onChangeOrganizations: (organizationIds: string[]) => void;
  onChangeAuthors: (authorIds: string[]) => void;
  searchable?: boolean;
  className?: string;
};

function collectOrgIds(nodes: AuthorOrgGroup[]): string[] {
  const ids: string[] = [];
  const walk = (list: AuthorOrgGroup[]) => {
    for (const n of list) {
      ids.push(n.organizationId);
      walk(n.children);
    }
  };
  walk(nodes);
  return ids;
}

function flattenAuthors(nodes: AuthorOrgGroup[]): SharedContentAuthorOption[] {
  const map = new Map<string, SharedContentAuthorOption>();
  const walk = (list: AuthorOrgGroup[]) => {
    for (const n of list) {
      for (const a of n.authors) map.set(a.id, a);
      walk(n.children);
    }
  };
  walk(nodes);
  return [...map.values()];
}

function filterGroupsByQuery(groups: AuthorOrgGroup[], needle: string): AuthorOrgGroup[] {
  if (!needle) return groups;

  const walk = (list: AuthorOrgGroup[]): AuthorOrgGroup[] => {
    const out: AuthorOrgGroup[] = [];
    for (const g of list) {
      const children = walk(g.children);
      const authors = g.authors.filter(
        a =>
          a.name.toLowerCase().includes(needle)
          || (a.positionLabel?.toLowerCase().includes(needle) ?? false)
          || (a.orgLabel?.toLowerCase().includes(needle) ?? false),
      );
      const nameHit = g.organizationName.toLowerCase().includes(needle);
      if (nameHit || authors.length > 0 || children.length > 0) {
        const authorMap = new Map<string, SharedContentAuthorOption>();
        for (const a of authors) authorMap.set(a.id, a);
        if (nameHit) {
          for (const a of g.authors) authorMap.set(a.id, a);
        }
        out.push({
          ...g,
          authors: [...authorMap.values()],
          children,
          authorCount: Math.max(
            g.authorCount,
            authorMap.size,
            children.reduce((s, c) => s + c.authorCount, 0),
          ),
        });
      }
    }
    return out;
  };

  return walk(groups);
}

function OrgGroupRow({
  group,
  depth,
  expanded,
  selectedOrganizationIds,
  selectedAuthorIds,
  onToggleExpand,
  onToggleOrg,
  onToggleAuthor,
  onClearAuthorsInGroup,
}: {
  group: AuthorOrgGroup;
  depth: number;
  expanded: Set<string>;
  selectedOrganizationIds: string[];
  selectedAuthorIds: string[];
  onToggleExpand: (id: string) => void;
  onToggleOrg: (id: string) => void;
  onToggleAuthor: (id: string) => void;
  onClearAuthorsInGroup: (authors: SharedContentAuthorOption[]) => void;
}) {
  const open = expanded.has(group.organizationId);
  const hasChildren = group.children.length > 0;
  const orgChecked = selectedOrganizationIds.includes(group.organizationId);
  const showAuthors = open && group.authors.length > 0;

  return (
    <div>
      <div
        className="flex items-center gap-1 min-h-[48px] touch-target hover:bg-gray-50"
        style={{ paddingLeft: 8 + depth * 14 }}
      >
        <button
          type="button"
          className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg"
          aria-label={open ? '접기' : '펼치기'}
          onClick={() => onToggleExpand(group.organizationId)}
        >
          {open ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
        </button>

        <label className="flex items-center gap-2.5 flex-1 min-w-0 py-2 pr-3 cursor-pointer">
          <input
            type="checkbox"
            checked={orgChecked}
            onChange={() => onToggleOrg(group.organizationId)}
            className="w-5 h-5 rounded border-gray-300 text-primary-600 shrink-0"
          />
          <span className="min-w-0 flex-1 flex items-center justify-between gap-2">
            <span className="text-[14px] font-semibold text-gray-800 truncate">
              {group.organizationName}
            </span>
            <span className="text-[12px] text-gray-400 shrink-0 font-semibold">
              {group.authorCount}
            </span>
          </span>
        </label>
      </div>

      {open && hasChildren && group.children.map(child => (
        <OrgGroupRow
          key={child.organizationId}
          group={child}
          depth={depth + 1}
          expanded={expanded}
          selectedOrganizationIds={selectedOrganizationIds}
          selectedAuthorIds={selectedAuthorIds}
          onToggleExpand={onToggleExpand}
          onToggleOrg={onToggleOrg}
          onToggleAuthor={onToggleAuthor}
          onClearAuthorsInGroup={onClearAuthorsInGroup}
        />
      ))}

      {showAuthors && (
        <div className="pb-1" style={{ paddingLeft: 20 + depth * 14 }}>
          <button
            type="button"
            onClick={() => onClearAuthorsInGroup(group.authors)}
            className="w-full text-left px-3 py-2 text-[13px] font-semibold text-primary-700 hover:bg-primary-50 rounded-lg touch-target"
          >
            전체 작성자
          </button>
          {group.authors.map(author => {
            const checked = selectedAuthorIds.includes(author.id);
            return (
              <label
                key={author.id}
                className="flex items-start gap-3 px-3 py-2.5 min-h-[48px] touch-target cursor-pointer hover:bg-gray-50 rounded-lg"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggleAuthor(author.id)}
                  className="mt-0.5 w-5 h-5 rounded border-gray-300 text-primary-600 shrink-0"
                />
                <span className="min-w-0">
                  <span className="block text-[14px] font-semibold text-gray-800">
                    {author.name}
                  </span>
                  {author.orgLabel ? (
                    <span className="block text-[12px] text-gray-500 mt-0.5 leading-snug">
                      {author.orgLabel}
                    </span>
                  ) : null}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * 교역자 직접 공유 — 작성자를 교회 조직별로 선택
 */
export function AuthorOrgFilterSelector({
  groups,
  selectedOrganizationIds,
  selectedAuthorIds,
  onChangeOrganizations,
  onChangeAuthors,
  searchable = true,
  className = '',
}: AuthorOrgFilterSelectorProps) {
  const [q, setQ] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const allAuthors = useMemo(() => flattenAuthors(groups), [groups]);

  useEffect(() => {
    setExpanded(new Set(collectOrgIds(groups).slice(0, 12)));
  }, [groups]);

  const filteredGroups = useMemo(
    () => filterGroupsByQuery(groups, q.trim().toLowerCase()),
    [groups, q],
  );

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleOrg = (id: string) => {
    if (selectedOrganizationIds.includes(id)) {
      onChangeOrganizations(selectedOrganizationIds.filter(x => x !== id));
    } else {
      onChangeOrganizations([...selectedOrganizationIds, id]);
    }
  };

  const toggleAuthor = (id: string) => {
    if (selectedAuthorIds.includes(id)) {
      onChangeAuthors(selectedAuthorIds.filter(x => x !== id));
    } else {
      onChangeAuthors([...selectedAuthorIds, id]);
    }
  };

  /** 해당 그룹 개별 작성자 선택 해제 → 조직 조건 내 전체 작성자 */
  const clearAuthorsInGroup = (authors: SharedContentAuthorOption[]) => {
    const ids = new Set(authors.map(a => a.id));
    onChangeAuthors(selectedAuthorIds.filter(id => !ids.has(id)));
  };

  if (allAuthors.length === 0) {
    return (
      <p className={`text-sm text-gray-500 px-1 py-2 ${className}`}>
        나에게 직접 공유한 작성자가 없습니다.
      </p>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div>
        <p className="text-sm font-bold text-gray-800 mb-1">작성자 검색</p>
        {searchable && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="작성자 이름 또는 조직을 검색하세요."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:bg-white focus:border-primary-400 focus:outline-none"
            />
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-1 gap-2">
          <p className="text-sm font-bold text-gray-800">교회 조직</p>
          {selectedOrganizationIds.length > 0 && (
            <span className="text-[11px] font-semibold text-primary-600">
              조직 {selectedOrganizationIds.length}개 선택
            </span>
          )}
        </div>
        <p className="text-[12px] text-gray-500 mb-2 leading-snug">
          교구·부서를 선택해 작성자를 확인합니다.
        </p>

        <div className="bg-white border border-gray-200 overflow-hidden rounded-card max-h-80 overflow-y-auto">
          {selectedAuthorIds.length === 0 ? (
            <div className="px-4 py-2.5 border-b border-gray-100 text-[13px] font-semibold text-gray-600">
              전체 작성자
            </div>
          ) : (
            <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between gap-2">
              <span className="text-[13px] font-semibold text-primary-700">
                작성자 {selectedAuthorIds.length}명 선택
              </span>
              <button
                type="button"
                onClick={() => onChangeAuthors([])}
                className="text-[12px] font-semibold text-gray-500 touch-target px-1"
              >
                전체 작성자
              </button>
            </div>
          )}

          <div className="py-1">
            {filteredGroups.map(g => (
              <OrgGroupRow
                key={g.organizationId}
                group={g}
                depth={0}
                expanded={expanded}
                selectedOrganizationIds={selectedOrganizationIds}
                selectedAuthorIds={selectedAuthorIds}
                onToggleExpand={toggleExpand}
                onToggleOrg={toggleOrg}
                onToggleAuthor={toggleAuthor}
                onClearAuthorsInGroup={clearAuthorsInGroup}
              />
            ))}
            {filteredGroups.length === 0 && (
              <p className="px-4 py-3 text-sm text-gray-400">검색 결과가 없습니다.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

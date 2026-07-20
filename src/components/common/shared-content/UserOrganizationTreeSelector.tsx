import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';
import type { AppUser } from '../../../services/permissions';
import {
  type OrgFilterTreeNode,
  type UserOrgTreeMode,
  type UserOrgTreeScope,
  countOrgFilterNodes,
  filterOrgTreeByQuery,
  flattenOrgFilterTree,
  getTreeNodeCheckState,
  getUserOrganizationTree,
  resolveOrgTreeMode,
  toggleOrganizationTreeSelection,
} from '../../../services/userOrganizationTree';

export type UserOrganizationTreeSelectorProps = {
  user: AppUser | null;
  selectedOrganizationIds: string[];
  onChange: (organizationIds: string[]) => void;
  mode?: UserOrgTreeMode;
  /** 교역자 전체 조직 확장 옵션 (기본 false) */
  allowFullOrgTree?: boolean;
  allowMultiple?: boolean;
  showOnlyActive?: boolean;
  className?: string;
  /** 빈 선택 = 전체 (필터용 true, 작성 화면 false) */
  emptyMeansAll?: boolean;
  /** 작성 화면 — 전체 조직 일괄 선택 (emptyMeansAll=false 일 때) */
  showSelectAll?: boolean;
  /** 조직 검색 placeholder */
  searchPlaceholder?: string;
  /** 트리 스크롤 영역 class (모바일 작성: max-h-none 등) */
  treeScrollClassName?: string;
  /** 기본 스코프 (관리자: 전체 조직 등) */
  defaultScope?: UserOrgTreeScope;
  /** 섹션 제목 */
  sectionTitle?: string;
};

function TreeCheckboxRow({
  node,
  depth,
  selectedIds,
  expanded,
  onToggleExpand,
  onToggleCheck,
}: {
  node: OrgFilterTreeNode;
  depth: number;
  selectedIds: string[];
  expanded: Set<string>;
  onToggleExpand: (id: string) => void;
  onToggleCheck: (id: string) => void;
}) {
  const hasChildren = node.children.length > 0;
  const isOpen = expanded.has(node.id);
  const state = getTreeNodeCheckState(node, selectedIds);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = state === 'indeterminate';
    }
  }, [state]);

  return (
    <div>
      <div
        className="flex items-center gap-1 min-h-[48px] touch-target hover:bg-gray-50 rounded-xl"
        style={{ paddingLeft: 4 + depth * 14 }}
      >
        <button
          type="button"
          className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg"
          aria-label={isOpen ? '접기' : '펼치기'}
          onClick={() => hasChildren && onToggleExpand(node.id)}
          disabled={!hasChildren}
        >
          {hasChildren ? (
            isOpen ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )
          ) : (
            <span className="w-4" />
          )}
        </button>

        <label
          className={`flex items-center gap-2.5 flex-1 min-w-0 py-2 pr-2 cursor-pointer ${
            !node.selectable ? 'opacity-60 cursor-default' : ''
          }`}
        >
          <input
            ref={inputRef}
            type="checkbox"
            disabled={!node.selectable}
            checked={state === 'checked'}
            onChange={() => node.selectable && onToggleCheck(node.id)}
            className="w-5 h-5 rounded border-gray-300 text-primary-600 shrink-0"
          />
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-semibold text-gray-800 truncate">
              {node.name}
            </span>
            <span className="block text-[11px] text-gray-400 truncate">{node.type}</span>
          </span>
        </label>
      </div>

      {hasChildren && isOpen && (
        <div>
          {node.children.map(child => (
            <TreeCheckboxRow
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedIds={selectedIds}
              expanded={expanded}
              onToggleExpand={onToggleExpand}
              onToggleCheck={onToggleCheck}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * 공유받은 기록 — 내 조직 트리 다중 선택 필터
 * selectedOrganizationIds === [] → 전체 (emptyMeansAll)
 */
export function UserOrganizationTreeSelector({
  user,
  selectedOrganizationIds,
  onChange,
  mode,
  allowFullOrgTree = false,
  className = '',
  emptyMeansAll = true,
  showSelectAll = false,
  searchPlaceholder = '내 조직에서 검색',
  treeScrollClassName = 'max-h-64',
  defaultScope = 'mine',
  sectionTitle = '공유 조직',
}: UserOrganizationTreeSelectorProps) {
  const resolvedMode = mode ?? resolveOrgTreeMode(user);
  const [scope, setScope] = useState<UserOrgTreeScope>(defaultScope);
  const [q, setQ] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    setScope(defaultScope);
  }, [defaultScope]);

  const tree = useMemo(
    () =>
      getUserOrganizationTree({
        user,
        mode: resolvedMode,
        scope,
        allowFullOrgTree,
      }),
    [user, resolvedMode, scope, allowFullOrgTree],
  );

  const filteredTree = useMemo(() => filterOrgTreeByQuery(tree, q), [tree, q]);
  const nodeCount = countOrgFilterNodes(tree);
  const showSearch = nodeCount >= 8;
  const isAll = emptyMeansAll && selectedOrganizationIds.length === 0;

  const allSelectableIds = useMemo(
    () => flattenOrgFilterTree(tree).filter(n => n.selectable).map(n => n.id),
    [tree],
  );

  const isAllExplicitSelected =
    allSelectableIds.length > 0 &&
    allSelectableIds.every(id => selectedOrganizationIds.includes(id));

  const isAllExplicitIndeterminate =
    !isAllExplicitSelected &&
    selectedOrganizationIds.length > 0 &&
    allSelectableIds.some(id => selectedOrganizationIds.includes(id));

  const selectAllRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (selectAllRef.current && !emptyMeansAll) {
      selectAllRef.current.indeterminate = isAllExplicitIndeterminate;
    }
  }, [emptyMeansAll, isAllExplicitIndeterminate]);

  // 기본 펼침: 루트 전부
  useEffect(() => {
    setExpanded(new Set(tree.map(n => n.id)));
  }, [tree]);

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggle = (id: string) => {
    const base = isAll ? [] : selectedOrganizationIds;
    onChange(toggleOrganizationTreeSelection(tree, id, base));
  };

  const selectAll = () => onChange([]);

  const toggleSelectAllExplicit = () => {
    if (isAllExplicitSelected) {
      onChange([]);
    } else {
      onChange([...allSelectableIds]);
    }
  };

  const showSelectAllRow = emptyMeansAll || showSelectAll;

  if (!user) {
    return (
      <p className={`text-sm text-gray-500 px-1 py-2 ${className}`}>
        로그인 후 소속 조직을 확인할 수 있습니다.
      </p>
    );
  }

  if (tree.length === 0) {
    return (
      <div className={`px-1 py-2 space-y-1 ${className}`}>
        <p className="text-sm font-semibold text-gray-700">소속된 교구·부서가 없습니다.</p>
        <p className="text-xs text-gray-500">
          내정보 또는 조직관리에서 소속 조직을 확인해 주세요.
        </p>
      </div>
    );
  }

  const showScopeToggle =
    resolvedMode === 'super_admin' || (resolvedMode === 'pastor' && allowFullOrgTree);

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2 gap-2">
        <p className="text-xs font-bold text-gray-500">{sectionTitle}</p>
        {!isAll && selectedOrganizationIds.length > 0 && (
          <span className="text-[11px] font-semibold text-primary-600">
            {selectedOrganizationIds.length}개 선택
          </span>
        )}
      </div>

      {showScopeToggle && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {(
            [
              { id: 'mine' as const, label: '내 조직' },
              { id: 'all' as const, label: '전체 조직' },
            ] as const
          ).map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setScope(t.id);
                onChange([]);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold touch-target ${
                scope === t.id ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {showSearch && (
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:bg-white focus:border-primary-400 focus:outline-none"
          />
        </div>
      )}

      <p className="text-[11px] font-semibold text-gray-400 mb-1.5 px-0.5">
        {scope === 'all' && showScopeToggle ? '전체 조직' : '내 조직'}
      </p>

      <div className={`bg-white border border-gray-200 overflow-hidden rounded-card overflow-y-auto ${treeScrollClassName}`}>
        {showSelectAllRow && (
          <label className="flex items-center gap-3 px-4 py-3 min-h-[48px] touch-target cursor-pointer hover:bg-gray-50 border-b border-gray-100">
            <input
              ref={emptyMeansAll ? undefined : selectAllRef}
              type="checkbox"
              checked={emptyMeansAll ? isAll : isAllExplicitSelected}
              onChange={emptyMeansAll ? selectAll : toggleSelectAllExplicit}
              className="w-5 h-5 rounded border-gray-300 text-primary-600 shrink-0"
            />
            <span className="text-[14px] font-semibold text-gray-800">전체 조직</span>
          </label>
        )}

        <div className="py-1 px-1">
          {filteredTree.map(node => (
            <TreeCheckboxRow
              key={node.id}
              node={node}
              depth={0}
              selectedIds={isAll ? [] : selectedOrganizationIds}
              expanded={expanded}
              onToggleExpand={toggleExpand}
              onToggleCheck={handleToggle}
            />
          ))}
          {filteredTree.length === 0 && (
            <p className="px-4 py-3 text-sm text-gray-400">검색 결과가 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}

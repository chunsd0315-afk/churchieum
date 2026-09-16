/**
 * OrganizationPicker — 앱 공통 조직트리 선택기
 *
 * 설정 > 조직관리 > 조직트리를 그대로 불러와 계층구조로 선택한다.
 * 선택 결과는 조직명이 아니라 organizationId 배열로 반환한다.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, ChevronDown, ChevronRight, FolderTree, X } from 'lucide-react';
import type { OrgTreeNode } from '../../../types/organization';
import { useBreakpoint } from '../../../hooks/useBreakpoint';
import { useOrganizationTree } from '../../../hooks/useOrganizationTree';
import { useAuth } from '../../../contexts/AuthContext';
import {
  computeOrganizationSearch,
  getSelectableOrganizationIds,
  resolveOrganizationChips,
} from '../../../services/organizationSelection';
import { ChurchSearchInput } from '../ui';

export type OrganizationPickerMode = 'single' | 'multiple';

export type OrganizationPickerProps = {
  open: boolean;
  onClose: () => void;
  /** 저장된 organizationId 목록 */
  value: string[];
  onConfirm: (organizationIds: string[]) => void;
  mode?: OrganizationPickerMode;
  title?: string;
  description?: string;
  /** 생략 시 로그인 사용자 권한으로 자동 결정 (최고관리자는 전체) */
  allowedOrganizationIds?: Set<string> | null;
  includeInactive?: boolean;
};

type RowProps = {
  node: OrgTreeNode;
  depth: number;
  expanded: Set<string>;
  selected: string[];
  matched: Set<string>;
  searching: boolean;
  visibleIds: Set<string> | null;
  selectableIds: Set<string> | null;
  mode: OrganizationPickerMode;
  onToggleExpand: (id: string) => void;
  onToggleSelect: (id: string) => void;
};

function OrganizationRow({
  node, depth, expanded, selected, matched, searching,
  visibleIds, selectableIds, mode, onToggleExpand, onToggleSelect,
}: RowProps) {
  if (visibleIds && !visibleIds.has(node.id)) return null;

  const isSelected = selected.includes(node.id);
  const isSelectable = !selectableIds || selectableIds.has(node.id);
  const children = node.children;
  const hasChildren = children.length > 0;
  const isOpen = searching ? true : expanded.has(node.id);
  const isHit = searching && matched.has(node.id);

  return (
    <li>
      <div
        className={[
          'flex items-center gap-1 rounded-[14px] transition-colors',
          isSelected ? 'bg-[#FFF7D6]' : 'hover:bg-[#FFFDF7]',
        ].join(' ')}
        style={{ paddingLeft: depth * 16 }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => onToggleExpand(node.id)}
            className="w-8 h-8 flex items-center justify-center text-gray-400 rounded-lg hover:bg-gray-100 shrink-0"
            aria-label={isOpen ? `${node.name} 접기` : `${node.name} 펼치기`}
          >
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        ) : (
          <span className="w-8 h-8 shrink-0" />
        )}

        <button
          type="button"
          disabled={!isSelectable}
          onClick={() => onToggleSelect(node.id)}
          className={[
            'flex-1 min-w-0 flex items-center gap-2.5 px-2 py-2.5 min-h-[48px] text-left rounded-[14px]',
            isSelectable ? '' : 'opacity-40 cursor-not-allowed',
          ].join(' ')}
        >
          <span
            className={[
              'w-5 h-5 shrink-0 flex items-center justify-center border-2 transition-colors',
              mode === 'single' ? 'rounded-full' : 'rounded-[6px]',
              isSelected ? 'border-[#FFCD00] bg-[#FFCD00]' : 'border-gray-300 bg-white',
            ].join(' ')}
          >
            {isSelected && (
              mode === 'single'
                ? <span className="w-2 h-2 rounded-full bg-white" />
                : <Check className="w-3.5 h-3.5 text-[#1A1A1A]" />
            )}
          </span>
          <span
            className={[
              'truncate text-[14px]',
              isSelected ? 'font-bold text-[#1A1A1A]' : 'font-medium text-gray-700',
              isHit ? 'underline decoration-[#FFCD00] decoration-2 underline-offset-4' : '',
            ].join(' ')}
          >
            {node.name}
          </span>
          {!node.isActive && (
            <span className="text-[11px] text-gray-400 shrink-0">비활성</span>
          )}
        </button>
      </div>

      {hasChildren && isOpen && (
        <ul>
          {children.map(child => (
            <OrganizationRow
              key={child.id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              selected={selected}
              matched={matched}
              searching={searching}
              visibleIds={visibleIds}
              selectableIds={selectableIds}
              mode={mode}
              onToggleExpand={onToggleExpand}
              onToggleSelect={onToggleSelect}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function OrganizationPicker({
  open,
  onClose,
  value,
  onConfirm,
  mode = 'multiple',
  title = '소속 선택',
  description = '조직관리에 등록된 조직에서 선택합니다.',
  allowedOrganizationIds,
  includeInactive = false,
}: OrganizationPickerProps) {
  const { isMobile } = useBreakpoint();
  const { user } = useAuth();
  const { tree, organizations, version } = useOrganizationTree(includeInactive);

  const [selected, setSelected] = useState<string[]>(value);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');

  const selectableIds = useMemo(
    () => (allowedOrganizationIds !== undefined
      ? allowedOrganizationIds
      : getSelectableOrganizationIds(user)),
    // 조직 변경 시 권한 범위도 다시 계산
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allowedOrganizationIds, user, version],
  );

  // 열릴 때마다 현재 저장값으로 초기화하고 선택 경로를 펼친다
  useEffect(() => {
    if (!open) return;
    setSelected(value);
    setQuery('');
    const next = new Set<string>();
    tree.forEach(root => {
      next.add(root.id);
      root.children.forEach(child => next.add(child.id));
    });
    setExpanded(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const { matched, expand: searchExpand } = useMemo(
    () => computeOrganizationSearch(query, organizations),
    [query, organizations],
  );

  const searching = query.trim().length > 0;

  /** 검색 중에는 일치 조직과 그 상위 경로만 표시 */
  const visibleIds = useMemo(() => {
    if (!searching) return null;
    const ids = new Set<string>([...matched, ...searchExpand]);
    const addDescendants = (node: OrgTreeNode, inside: boolean) => {
      const on = inside || matched.has(node.id);
      if (on) ids.add(node.id);
      node.children.forEach(child => addDescendants(child, on));
    };
    tree.forEach(root => addDescendants(root, false));
    return ids;
  }, [searching, matched, searchExpand, tree]);

  const toggleExpand = useCallback((id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelected(prev => {
      if (mode === 'single') return prev.includes(id) ? [] : [id];
      return prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id];
    });
  }, [mode]);

  const chips = useMemo(
    () => resolveOrganizationChips(selected, organizations),
    [selected, organizations],
  );

  if (!open) return null;

  const handleConfirm = () => {
    onConfirm(selected);
    onClose();
  };

  const searchBar = (
    <ChurchSearchInput
      value={query}
      onChange={setQuery}
      placeholder="교구, 구역, 부서 이름 검색"
    />
  );

  const treeBody = (
    <div className="px-2 py-2">
      {tree.length === 0 ? (
        <div className="py-14 text-center">
          <FolderTree className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-500">등록된 조직이 없습니다.</p>
          <p className="text-xs text-gray-400 mt-1">설정 &gt; 조직관리에서 조직을 먼저 만들어 주세요.</p>
        </div>
      ) : searching && matched.size === 0 ? (
        <div className="py-14 text-center">
          <p className="text-sm text-gray-500">‘{query}’ 검색 결과가 없습니다.</p>
        </div>
      ) : (
        <ul>
          {tree.map(root => (
            <OrganizationRow
              key={root.id}
              node={root}
              depth={0}
              expanded={expanded}
              selected={selected}
              matched={matched}
              searching={searching}
              visibleIds={visibleIds}
              selectableIds={selectableIds}
              mode={mode}
              onToggleExpand={toggleExpand}
              onToggleSelect={toggleSelect}
            />
          ))}
        </ul>
      )}
    </div>
  );

  const selectedBar = (
    <div className="space-y-2">
      <p className="text-[12px] font-bold text-gray-500">
        선택 {chips.length}개
      </p>
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5 max-h-[84px] overflow-y-auto">
          {chips.map(chip => (
            <span
              key={chip.organizationId}
              className={[
                'inline-flex items-center gap-1 pl-3 pr-1.5 py-1.5 rounded-full text-[12px] font-semibold border',
                chip.missing
                  ? 'bg-gray-50 text-gray-400 border-gray-200'
                  : 'bg-[#FFF7D6] text-[#1A1A1A] border-[#FFCD00]',
              ].join(' ')}
            >
              <span className="truncate max-w-[200px]">{chip.pathLabel}</span>
              <button
                type="button"
                onClick={() => toggleSelect(chip.organizationId)}
                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-black/5"
                aria-label={`${chip.pathLabel} 선택 해제`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-[400] bg-[#FFFDF7] flex flex-col">
        <header className="shrink-0 bg-white border-b border-[#ECECEC] px-3 py-3">
          <div className="flex items-center gap-2 mb-3">
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-600"
              aria-label="닫기"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
            <div className="min-w-0">
              <h2 className="text-[17px] font-bold text-[#1A1A1A] truncate">{title}</h2>
              <p className="text-[12px] text-gray-500 truncate">{description}</p>
            </div>
          </div>
          {searchBar}
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          {treeBody}
        </div>

        <footer className="shrink-0 bg-white border-t border-[#ECECEC] px-4 py-3 space-y-3">
          {selectedBar}
          <button
            type="button"
            onClick={handleConfirm}
            className="w-full min-h-[56px] rounded-[18px] bg-[#FFCD00] hover:bg-[#F5BE00] text-[#1A1A1A] font-bold text-[15px]"
          >
            선택 완료
          </button>
        </footer>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="닫기" onClick={onClose} />
      <div
        className="relative w-full max-w-[680px] bg-white rounded-[24px] border border-[#ECECEC] shadow-[0_20px_60px_rgba(0,0,0,0.18)] flex flex-col min-h-0"
        style={{ maxHeight: '82vh' }}
      >
        <div className="shrink-0 px-5 pt-5 pb-3 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-[18px] font-bold text-[#1A1A1A]">{title}</h2>
              <p className="text-[13px] text-gray-500 mt-0.5">{description}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-500 shrink-0"
              aria-label="닫기"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
          {searchBar}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto border-y border-[#ECECEC] bg-white">
          {treeBody}
        </div>

        <div className="shrink-0 px-5 py-4 space-y-3">
          {selectedBar}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[48px] px-5 rounded-[18px] border border-[#ECECEC] text-gray-600 font-semibold text-sm hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="min-h-[48px] px-6 rounded-[18px] bg-[#FFCD00] hover:bg-[#F5BE00] text-[#1A1A1A] font-bold text-sm"
            >
              선택 완료
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 담당 교역자와 공유 — 직계 조직 트리 + 조직별 담당 교역자 체크
 */

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Search, X } from 'lucide-react';
import type { AppUser } from '../../../services/permissions';
import { isSuperAdmin } from '../../../services/permissions';
import {
  buildDirectPastorShareModel,
  resolvePastorDisplay,
  type DirectPastorOrgNode,
  type DirectPastorOnOrg,
} from '../../../services/directPastorShare';
import { ORG_TREE_CHANGED_EVENT } from '../../../services/organizationStorage';
import { PastorShareSelector } from './PastorShareSelector';
import type { SharedPastorSnapshot } from '../../../data/graceNotes';
import { useBreakpoint } from '../../../hooks/useBreakpoint';

export type DirectPastorOrgShareSelectorProps = {
  user: AppUser | null;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  /** 수정 시 기존 스냅샷 (범위 외·퇴사 표시) */
  existingSnapshots?: SharedPastorSnapshot[];
  /** 성도면 관리자 안내 문구 숨김 */
  viewerIsMember?: boolean;
  className?: string;
};

function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids.filter(Boolean))];
}

function nodeMatchesQuery(node: DirectPastorOrgNode, needle: string): boolean {
  if (!needle) return true;
  const orgHit = node.organizationName.toLowerCase().includes(needle);
  const pastorHit = node.pastors.some(
    p =>
      p.name.toLowerCase().includes(needle)
      || p.position.toLowerCase().includes(needle)
      || p.organizationRole.toLowerCase().includes(needle),
  );
  if (orgHit || pastorHit) return true;
  return node.children.some(c => nodeMatchesQuery(c, needle));
}

function filterTree(nodes: DirectPastorOrgNode[], needle: string): DirectPastorOrgNode[] {
  if (!needle) return nodes;
  const out: DirectPastorOrgNode[] = [];
  for (const n of nodes) {
    if (!nodeMatchesQuery(n, needle)) continue;
    out.push({
      ...n,
      children: filterTree(n.children, needle),
    });
  }
  return out;
}

function PastorRow({
  pastor,
  checked,
  onToggle,
  indent,
  isMobile,
}: {
  pastor: DirectPastorOnOrg;
  checked: boolean;
  onToggle: () => void;
  indent: number;
  isMobile: boolean;
}) {
  const pad = Math.min(indent, 6) * (isMobile ? 12 : 16);
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center gap-3 min-h-[48px] touch-target text-left hover:bg-gray-50 border-t border-gray-100"
      style={{ paddingLeft: pad + 12, paddingRight: 12 }}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-semibold text-gray-900">
          {pastor.name} {pastor.position}
        </span>
        <span className="block text-[12px] text-gray-500 mt-0.5">
          {pastor.organizationRole}
        </span>
      </span>
      <span
        className={`shrink-0 w-6 h-6 min-w-[44px] min-h-[44px] flex items-center justify-center`}
        aria-hidden
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          onClick={e => e.stopPropagation()}
          className="w-5 h-5 rounded border-gray-300 text-primary-600 pointer-events-none"
          tabIndex={-1}
        />
      </span>
    </button>
  );
}

function OrgTreeNode({
  node,
  selectedIds,
  onTogglePastor,
  expanded,
  onToggleExpand,
  isMobile,
}: {
  node: DirectPastorOrgNode;
  selectedIds: string[];
  onTogglePastor: (id: string) => void;
  expanded: Set<string>;
  onToggleExpand: (id: string) => void;
  isMobile: boolean;
}) {
  const hasChildren = node.children.length > 0;
  const isOpen = expanded.has(node.organizationId);
  const pad = Math.min(node.depth, 6) * (isMobile ? 12 : 16);
  const firstPastor = node.pastors[0];

  return (
    <div>
      <div
        className="flex items-center gap-2 min-h-[48px] border-t border-gray-100 first:border-t-0"
        style={{ paddingLeft: pad + 8, paddingRight: 12 }}
      >
        <button
          type="button"
          className="shrink-0 w-9 h-9 touch-target flex items-center justify-center text-gray-500"
          onClick={() => hasChildren && onToggleExpand(node.organizationId)}
          aria-label={isOpen ? '접기' : '펼치기'}
          disabled={!hasChildren}
        >
          {hasChildren ? (
            isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />
          ) : (
            <span className="w-5 h-5" />
          )}
        </button>

        {isMobile || node.pastors.length !== 1 ? (
          <div className="min-w-0 flex-1 py-2">
            <p className="text-[14px] font-bold text-gray-900 truncate">{node.organizationName}</p>
            {node.pastors.length === 0 && (
              <p className="text-[12px] text-gray-400 mt-0.5">담당 교역자 없음</p>
            )}
          </div>
        ) : (
          <div className="min-w-0 flex-1 flex items-center gap-3 py-2">
            <p className="text-[14px] font-bold text-gray-900 shrink-0 max-w-[40%] truncate">
              {node.organizationName}
            </p>
            {firstPastor && (
              <button
                type="button"
                onClick={() => onTogglePastor(firstPastor.pastorId)}
                className="min-w-0 flex-1 flex items-center gap-2 text-left touch-target"
              >
                <span className="min-w-0 flex-1 truncate text-[13px] text-gray-700">
                  {firstPastor.name} {firstPastor.position}
                  <span className="text-gray-400"> · {firstPastor.organizationRole}</span>
                </span>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(firstPastor.pastorId)}
                  onChange={() => onTogglePastor(firstPastor.pastorId)}
                  onClick={e => e.stopPropagation()}
                  className="w-5 h-5 rounded border-gray-300 text-primary-600 shrink-0 pointer-events-none"
                  tabIndex={-1}
                />
              </button>
            )}
          </div>
        )}
      </div>

      {(isMobile || node.pastors.length !== 1) &&
        node.pastors.map(p => (
          <PastorRow
            key={`${node.organizationId}-${p.pastorId}`}
            pastor={p}
            checked={selectedIds.includes(p.pastorId)}
            onToggle={() => onTogglePastor(p.pastorId)}
            indent={node.depth + 1}
            isMobile={isMobile}
          />
        ))}

      {isOpen &&
        node.children.map(child => (
          <OrgTreeNode
            key={child.organizationId}
            node={child}
            selectedIds={selectedIds}
            onTogglePastor={onTogglePastor}
            expanded={expanded}
            onToggleExpand={onToggleExpand}
            isMobile={isMobile}
          />
        ))}
    </div>
  );
}

export function DirectPastorOrgShareSelector({
  user,
  selectedIds,
  onChange,
  existingSnapshots = [],
  viewerIsMember = true,
  className = '',
}: DirectPastorOrgShareSelectorProps) {
  const { isMobile } = useBreakpoint();
  const [orgTick, setOrgTick] = useState(0);
  const [q, setQ] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    const bump = () => setOrgTick(t => t + 1);
    window.addEventListener(ORG_TREE_CHANGED_EVENT, bump);
    window.addEventListener('storage', bump);
    return () => {
      window.removeEventListener(ORG_TREE_CHANGED_EVENT, bump);
      window.removeEventListener('storage', bump);
    };
  }, []);

  const model = useMemo(
    () => buildDirectPastorShareModel(user),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- orgTick forces rebuild on org changes
    [user, orgTick],
  );

  const needle = q.trim().toLowerCase();
  const filteredTree = useMemo(
    () => filterTree(model.tree, needle),
    [model.tree, needle],
  );

  // 기본 펼침: 검색 중이면 전부, 아니면 루트+직계
  useEffect(() => {
    if (needle) {
      const ids = new Set<string>();
      const walk = (nodes: DirectPastorOrgNode[]) => {
        for (const n of nodes) {
          ids.add(n.organizationId);
          walk(n.children);
        }
      };
      walk(filteredTree);
      setExpanded(ids);
      return;
    }
    const ids = new Set<string>();
    const walk = (nodes: DirectPastorOrgNode[]) => {
      for (const n of nodes) {
        ids.add(n.organizationId);
        walk(n.children);
      }
    };
    walk(model.tree);
    setExpanded(ids);
  }, [model.tree, filteredTree, needle]);

  const outOfScopeSelected = useMemo(() => {
    return uniqueIds(selectedIds).filter(id => !model.allowedPastorIds.has(id));
  }, [selectedIds, model.allowedPastorIds]);

  const selectedInScope = useMemo(() => {
    return uniqueIds(selectedIds).filter(id => model.allowedPastorIds.has(id));
  }, [selectedIds, model.allowedPastorIds]);

  const togglePastor = (id: string) => {
    if (!model.allowedPastorIds.has(id) && !outOfScopeSelected.includes(id)) return;
    const next = selectedIds.includes(id)
      ? selectedIds.filter(x => x !== id)
      : uniqueIds([...selectedIds, id]);
    onChange(next);
  };

  const removeSelected = (id: string) => {
    onChange(selectedIds.filter(x => x !== id));
  };

  if (isSuperAdmin(user) || model.isAdminFullList) {
    return (
      <div className={className}>
        <p className="text-sm font-bold text-gray-800 mb-1">담당 교역자 선택</p>
        <p className="text-[13px] text-gray-500 mb-3">
          전체 교역자 중에서 공유할 대상을 선택합니다.
        </p>
        <PastorShareSelector
          pastors={model.pastors}
          selectedIds={selectedIds}
          onChange={onChange}
          searchable
        />
      </div>
    );
  }

  if (model.pastors.length === 0 && outOfScopeSelected.length === 0) {
    return (
      <div className={className}>
        <p className="text-sm font-bold text-gray-800 mb-1">담당 교역자 선택</p>
        <p className="text-sm text-gray-600 mt-2">
          내 소속 조직에 등록된 담당 교역자가 없습니다.
        </p>
        <p className="text-[12px] text-gray-500 mt-1">
          {viewerIsMember
            ? '담당 교역자 정보를 확인해 주세요.'
            : '조직관리에서 담당 교역자를 먼저 지정해 주세요.'}
        </p>
      </div>
    );
  }

  const chipPastors = uniqueIds(selectedIds).map(id => {
    const fromModel = model.pastors.find(p => p.id === id);
    if (fromModel) {
      return { id, label: `${fromModel.name} ${fromModel.position}`.trim() };
    }
    const d = resolvePastorDisplay(id, existingSnapshots);
    return {
      id,
      label: `${d.name}${d.position ? ` ${d.position}` : ''}`.trim(),
    };
  });

  return (
    <div className={`space-y-3 ${className}`}>
      <div>
        <p className="text-sm font-bold text-gray-800 mb-1">담당 교역자 선택</p>
        <p className="text-[13px] text-gray-500">
          내 소속 조직의 담당 교역자를 선택해 공유합니다.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="교역자 이름 또는 조직을 검색하세요."
          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 focus:bg-white focus:border-primary-400 focus:outline-none min-h-[48px]"
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-card overflow-hidden divide-y-0">
        {filteredTree.length === 0 ? (
          <p className="text-sm text-gray-500 px-4 py-3">검색 결과가 없습니다.</p>
        ) : (
          filteredTree.map(node => (
            <OrgTreeNode
              key={node.organizationId}
              node={node}
              selectedIds={selectedIds}
              onTogglePastor={togglePastor}
              expanded={expanded}
              onToggleExpand={id => {
                setExpanded(prev => {
                  const next = new Set(prev);
                  if (next.has(id)) next.delete(id);
                  else next.add(id);
                  return next;
                });
              }}
              isMobile={isMobile}
            />
          ))
        )}
      </div>

      {outOfScopeSelected.length > 0 && (
        <div className="rounded-xl border border-amber-100 bg-amber-50/60 px-3 py-3 space-y-2">
          <p className="text-[12px] font-bold text-amber-800">이전 공유 대상</p>
          {outOfScopeSelected.map(id => {
            const d = resolvePastorDisplay(id, existingSnapshots);
            const checked = selectedIds.includes(id);
            return (
              <label
                key={id}
                className="flex items-center gap-3 min-h-[48px] touch-target cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => removeSelected(id)}
                  className="w-5 h-5 rounded border-gray-300 text-primary-600 shrink-0"
                />
                <span className="min-w-0">
                  <span className="block text-[14px] font-semibold text-gray-800">
                    {d.name}{d.position ? ` ${d.position}` : ''}
                  </span>
                  <span className="block text-[12px] text-amber-700 mt-0.5">
                    {d.inactive ? '현재 선택 불가 · 퇴사·비활성' : '현재 소속 범위 외'}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      )}

      {chipPastors.length > 0 && (
        <div className="pt-1 border-t border-gray-100">
          <p className="text-[12px] font-bold text-gray-500 mb-2">
            선택한 교역자 {chipPastors.length}명
          </p>
          <div className="flex flex-wrap gap-2">
            {chipPastors.map(c => (
              <span
                key={c.id}
                className="inline-flex items-center gap-1 max-w-full px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 text-[12px] font-semibold border border-primary-100"
              >
                <span className="truncate">{c.label}</span>
                <button
                  type="button"
                  onClick={() => removeSelected(c.id)}
                  className="shrink-0 p-0.5 rounded-full hover:bg-primary-100 touch-target"
                  aria-label={`${c.label} 선택 해제`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {selectedInScope.length === 0 && outOfScopeSelected.filter(id => selectedIds.includes(id)).length === 0 && (
        <p className="text-[12px] text-amber-700 bg-amber-50 rounded-xl px-3 py-2">
          공유할 교역자를 선택해 주세요.
        </p>
      )}
    </div>
  );
}

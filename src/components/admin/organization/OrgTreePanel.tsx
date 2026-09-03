import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  GripVertical, ChevronDown, ChevronRight, FolderTree, Plus,
  MoreVertical, Pencil, Trash2, X, Check,
} from 'lucide-react';
import type { OrgTreeNode } from '../../../types/organization';
import { useOrgSettings } from '../../../contexts/OrgSettingsContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useBreakpoint } from '../../../hooks/useBreakpoint';
import { getOrganizationTypeDisplay } from '../../../services/orgTerminology';
import {
  ORG_ROOT_DROP_ID,
  deleteOrganization,
  getOrganizationById,
  moveOrganization,
  resolveOrganizationDropTarget,
  updateOrganizationName,
  wouldCreateCycle,
  type OrgDropPosition,
} from '../../../services/organizationStorage';
import { ChurchButton } from '../../common/ui/ChurchButton';

type Props = {
  tree: OrgTreeNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddChild: (parentId: string | null) => void;
  onTreeMoved?: () => void;
  onRenamed?: () => void;
  /** 검색 매칭 조직(하이라이트) */
  matchedIds?: Set<string>;
  /** 검색 시 강제 펼칠 조상 포함 ID */
  forceExpandIds?: Set<string>;
};

type FlatRow = {
  id: string;
  node: OrgTreeNode;
  depth: number;
  parentId: string | null;
};

function flattenVisible(
  nodes: OrgTreeNode[],
  expanded: Set<string>,
  depth = 0,
  parentId: string | null = null,
): FlatRow[] {
  const out: FlatRow[] = [];
  for (const node of nodes) {
    out.push({ id: node.id, node, depth, parentId });
    if (node.children.length > 0 && expanded.has(node.id)) {
      out.push(...flattenVisible(node.children, expanded, depth + 1, node.id));
    }
  }
  return out;
}

function collectIds(nodes: OrgTreeNode[]): string[] {
  const ids: string[] = [];
  const walk = (list: OrgTreeNode[]) => {
    for (const n of list) {
      ids.push(n.id);
      walk(n.children);
    }
  };
  walk(nodes);
  return ids;
}

function resolveDropPosition(
  clientY: number,
  rect: DOMRect,
): OrgDropPosition {
  const ratio = (clientY - rect.top) / Math.max(rect.height, 1);
  if (ratio < 0.28) return 'before';
  if (ratio > 0.72) return 'after';
  return 'inside';
}

function RootDropZone({ active }: { active: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: ORG_ROOT_DROP_ID });
  if (!active) return null;
  return (
    <div
      ref={setNodeRef}
      className={[
        'mb-2 mx-1 rounded-[12px] border-2 border-dashed px-3 py-3 text-center text-[13px] font-semibold transition-colors',
        isOver
          ? 'border-primary-500 bg-primary-50 text-primary-700'
          : 'border-gray-300 bg-gray-50 text-gray-500',
      ].join(' ')}
    >
      최상위 조직으로 이동
    </div>
  );
}

function TreeRow({
  row,
  selectedId,
  onSelect,
  onAddChild,
  expanded,
  toggle,
  canDrag,
  canEdit,
  dropHint,
  isDragging,
  isMatch,
  editingId,
  editDraft,
  editError,
  onStartEdit,
  onEditDraftChange,
  onCommitEdit,
  onCancelEdit,
  onOpenMobileMenu,
}: {
  row: FlatRow;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddChild: (parentId: string | null) => void;
  expanded: Set<string>;
  toggle: (id: string) => void;
  canDrag: boolean;
  canEdit: boolean;
  dropHint: { id: string; position: OrgDropPosition; invalid?: boolean } | null;
  isDragging: boolean;
  isMatch?: boolean;
  editingId: string | null;
  editDraft: string;
  editError: string | null;
  onStartEdit: (id: string, currentName: string) => void;
  onEditDraftChange: (value: string) => void;
  onCommitEdit: () => void;
  onCancelEdit: () => void;
  onOpenMobileMenu: (id: string) => void;
}) {
  const { node, depth } = row;
  const hasChildren = node.children.length > 0;
  const isOpen = expanded.has(node.id);
  const active = selectedId === node.id;
  const typeLabel = getOrganizationTypeDisplay(node);
  const isEditing = editingId === node.id;
  const dragEnabled = canDrag && !isEditing;

  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    setActivatorNodeRef,
  } = useDraggable({
    id: node.id,
    disabled: !dragEnabled,
    data: { type: 'org', parentId: row.parentId },
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: node.id,
    data: { type: 'org', parentId: row.parentId },
    disabled: !dragEnabled,
  });

  const setRowRef = useCallback(
    (el: HTMLDivElement | null) => {
      setDragRef(el);
      setDropRef(el);
    },
    [setDragRef, setDropRef],
  );

  const hintHere = dropHint?.id === node.id ? dropHint : null;
  const showBefore = hintHere?.position === 'before' && !hintHere.invalid;
  const showAfter = hintHere?.position === 'after' && !hintHere.invalid;
  const showInside = hintHere?.position === 'inside' && !hintHere.invalid;
  const showInvalid = Boolean(hintHere?.invalid && isOver);

  return (
    <div className="relative" style={{ opacity: isDragging ? 0.35 : 1 }}>
      {showBefore && (
        <div
          className="absolute left-2 right-2 top-0 h-0.5 bg-primary-500 rounded-full z-10 pointer-events-none"
          style={{ marginLeft: depth * 14 }}
        />
      )}
      <div
        ref={setRowRef}
        className={[
          'group flex items-center gap-0.5 rounded-[12px] pr-1 transition-colors',
          active
            ? 'bg-[#FFF7D6] text-[#1A1A1A] ring-1 ring-primary-400/60 font-bold'
            : isMatch
              ? 'bg-primary-50/70 text-gray-900'
              : 'hover:bg-gray-50 text-gray-800',
          showInside ? 'ring-2 ring-primary-400 bg-primary-50/80' : '',
          showInvalid ? 'ring-2 ring-red-300 bg-red-50' : '',
        ].join(' ')}
        style={{ paddingLeft: 4 + depth * 14 }}
      >
        {dragEnabled ? (
          <button
            type="button"
            ref={setActivatorNodeRef}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-grab active:cursor-grabbing touch-none"
            aria-label={`${node.name} 이동`}
            {...listeners}
            {...attributes}
          >
            <GripVertical className="w-4 h-4" />
          </button>
        ) : (
          <span className="w-8 shrink-0" />
        )}

        <button
          type="button"
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg touch-target"
          aria-label={isOpen ? '접기' : '펼치기'}
          onClick={() => hasChildren && toggle(node.id)}
        >
          {hasChildren ? (
            isOpen
              ? <ChevronDown className="w-4 h-4 text-gray-500" />
              : <ChevronRight className="w-4 h-4 text-gray-500" />
          ) : (
            <span className="w-4" />
          )}
        </button>

        {isEditing ? (
          <div className="flex-1 min-w-0 py-1.5 pr-1">
            <input
              autoFocus
              value={editDraft}
              onChange={e => onEditDraftChange(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); onCommitEdit(); }
                if (e.key === 'Escape') { e.preventDefault(); onCancelEdit(); }
              }}
              className="w-full h-10 px-3 text-[14px] font-semibold bg-white border border-primary-400 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-primary-200"
              aria-label="조직명 수정"
            />
            {editError && (
              <p className="text-[11px] text-red-500 mt-1 px-1">{editError}</p>
            )}
            <div className="flex gap-1.5 mt-1.5">
              <button
                type="button"
                onClick={onCancelEdit}
                className="h-8 px-2.5 rounded-[10px] text-xs font-semibold text-gray-600 hover:bg-gray-100"
              >
                취소
              </button>
              <button
                type="button"
                onClick={onCommitEdit}
                className="h-8 px-2.5 rounded-[10px] text-xs font-bold bg-primary-500 text-[#1A1A1A] hover:bg-primary-600 inline-flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" /> 저장
              </button>
            </div>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => onSelect(node.id)}
              onDoubleClick={() => canEdit && onStartEdit(node.id, node.name)}
              className="flex-1 min-w-0 text-left py-2.5 touch-target"
            >
              <span className={`block text-[14px] truncate ${
                active ? 'font-bold text-[#1A1A1A]' : 'font-semibold'
              } ${!node.isActive ? 'text-gray-400 line-through' : ''}`}>
                {node.name}
              </span>
              <span className="block text-[11px] text-gray-400 truncate">{typeLabel}</span>
            </button>

            {canEdit && (
              <>
                <button
                  type="button"
                  aria-label="조직명 수정"
                  onClick={() => onStartEdit(node.id, node.name)}
                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0 w-8 h-8 hidden sm:flex items-center justify-center rounded-lg text-gray-500 hover:bg-primary-50 hover:text-primary-700"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="조직 메뉴"
                  onClick={() => onOpenMobileMenu(node.id)}
                  className="sm:hidden shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </>
            )}

            <button
              type="button"
              aria-label="하위 조직 추가"
              onClick={() => onAddChild(node.id)}
              className="opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-primary-600 hover:bg-primary-100"
            >
              <Plus className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
      {showAfter && (
        <div
          className="absolute left-2 right-2 bottom-0 h-0.5 bg-primary-500 rounded-full z-10 pointer-events-none"
          style={{ marginLeft: depth * 14 }}
        />
      )}
    </div>
  );
}

export function OrgTreePanel({
  tree,
  selectedId,
  onSelect,
  onAddChild,
  onTreeMoved,
  onRenamed,
  matchedIds,
  forceExpandIds,
}: Props) {
  const { terminologyVersion } = useOrgSettings();
  void terminologyVersion;
  const { isAdmin } = useAuth();
  const { isMobile } = useBreakpoint();
  const canDrag = isAdmin;
  const canEdit = isAdmin;

  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(collectIds(tree).slice(0, 40)));
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [mobileMenuId, setMobileMenuId] = useState<string | null>(null);
  const [mobileRenameOpen, setMobileRenameOpen] = useState(false);
  const [dropHint, setDropHint] = useState<{
    id: string;
    position: OrgDropPosition;
    invalid?: boolean;
  } | null>(null);
  const [moving, setMoving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const pointerYRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const flat = useMemo(
    () => flattenVisible(tree, expanded),
    [tree, expanded],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandId = useCallback((id: string | null) => {
    if (!id) return;
    setExpanded(prev => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!forceExpandIds || forceExpandIds.size === 0) return;
    setExpanded(prev => {
      let changed = false;
      const next = new Set(prev);
      forceExpandIds.forEach(id => {
        if (!next.has(id)) {
          next.add(id);
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [forceExpandIds]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const startEdit = useCallback((id: string, currentName: string) => {
    if (!canEdit) return;
    setEditingId(id);
    setEditDraft(currentName);
    setEditError(null);
    onSelect(id);
  }, [canEdit, onSelect]);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditDraft('');
    setEditError(null);
  }, []);

  const commitEdit = useCallback(() => {
    if (!editingId) return;
    const result = updateOrganizationName(editingId, editDraft, { actorIsAdmin: isAdmin });
    if (!result.ok) {
      setEditError(result.error);
      return;
    }
    cancelEdit();
    setMobileRenameOpen(false);
    setMobileMenuId(null);
    onRenamed?.();
    setToast('조직명이 저장되었습니다.');
  }, [editingId, editDraft, isAdmin, cancelEdit, onRenamed]);

  const handleDeleteOrg = useCallback((id: string) => {
    const org = getOrganizationById(id);
    if (!org) return;
    if (!window.confirm(`「${org.name}」과 하위 조직을 삭제할까요?`)) return;
    deleteOrganization(id, true);
    setMobileMenuId(null);
    onRenamed?.();
    setToast('조직이 삭제되었습니다.');
  }, [onRenamed]);

  const updateHintFromEvent = useCallback(
    (overId: string | null, clientY: number) => {
      if (!activeId || !overId) {
        setDropHint(null);
        return;
      }
      if (overId === ORG_ROOT_DROP_ID) {
        setDropHint({ id: ORG_ROOT_DROP_ID, position: 'inside' });
        return;
      }
      if (overId === activeId) {
        setDropHint(null);
        return;
      }

      const el = document.querySelector(`[data-org-row="${overId}"]`) as HTMLElement | null;
      // fallback: use droppable rect via element with id in data
      const rowEl = document.getElementById(`org-tree-row-${overId}`);
      const target = rowEl ?? el;
      if (!target) {
        setDropHint({ id: overId, position: 'inside' });
        return;
      }
      const rect = target.getBoundingClientRect();
      const position = resolveDropPosition(clientY, rect);

      let invalid = false;
      if (position === 'inside') {
        invalid = wouldCreateCycle(activeId, overId);
      } else {
        const overOrg = getOrganizationById(overId);
        invalid = wouldCreateCycle(activeId, overOrg?.parentId ?? null);
      }
      setDropHint({ id: overId, position, invalid });
    },
    [activeId],
  );

  const handleDragStart = (event: DragStartEvent) => {
    if (!canDrag || moving) return;
    setActiveId(String(event.active.id));
    setDropHint(null);
  };

  const handleDragMove = (event: DragMoveEvent) => {
    const y = event.activatorEvent && 'clientY' in (event.activatorEvent as PointerEvent)
      ? (event.activatorEvent as PointerEvent).clientY
      : pointerYRef.current;
    // prefer translated pointer from delta
    const translated = event.active.rect.current.translated;
    if (translated) {
      pointerYRef.current = translated.top + translated.height / 2;
    } else if (typeof y === 'number') {
      pointerYRef.current = y;
    }

    // auto-scroll near edges
    const box = scrollRef.current;
    if (box) {
      const rect = box.getBoundingClientRect();
      const py = pointerYRef.current;
      if (py < rect.top + 40) box.scrollTop -= 8;
      else if (py > rect.bottom - 40) box.scrollTop += 8;
    }

    const overId = event.over ? String(event.over.id) : null;
    updateHintFromEvent(overId, pointerYRef.current);
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setDropHint(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const draggingId = activeId;
    const over = event.over;
    setActiveId(null);
    setDropHint(null);

    if (!canDrag || moving || !draggingId || !over) return;

    const overId = String(over.id);
    let position: OrgDropPosition = 'inside';

    if (overId === ORG_ROOT_DROP_ID) {
      position = 'inside';
    } else {
      const rowEl = document.getElementById(`org-tree-row-${overId}`);
      if (rowEl) {
        position = resolveDropPosition(pointerYRef.current, rowEl.getBoundingClientRect());
      } else if (dropHint?.id === overId) {
        position = dropHint.position;
      }
    }

    if (position === 'inside' && overId !== ORG_ROOT_DROP_ID && wouldCreateCycle(draggingId, overId)) {
      setToast('하위 조직 아래로 이동할 수 없습니다.');
      return;
    }
    if (position !== 'inside' && overId !== ORG_ROOT_DROP_ID) {
      const overOrg = getOrganizationById(overId);
      if (wouldCreateCycle(draggingId, overOrg?.parentId ?? null)) {
        setToast('하위 조직 아래로 이동할 수 없습니다.');
        return;
      }
    }

    const resolved = resolveOrganizationDropTarget({
      movingId: draggingId,
      overId,
      position: overId === ORG_ROOT_DROP_ID ? 'inside' : position,
    });

    if ('error' in resolved) {
      setToast(resolved.error);
      return;
    }

    const movingOrg = getOrganizationById(draggingId);
    if (!movingOrg) return;

    const parentChanged = movingOrg.parentId !== resolved.newParentId;
    if (parentChanged) {
      const parentName =
        resolved.newParentId == null
          ? '최상위'
          : (getOrganizationById(resolved.newParentId)?.name ?? '선택한 조직');
      const msg =
        resolved.newParentId == null
          ? `「${movingOrg.name}」을(를) 최상위 조직으로 이동하시겠습니까?`
          : `「${movingOrg.name}」을(를) 「${parentName}」 아래로 이동하시겠습니까?`;
      if (!window.confirm(msg)) return;
    }

    setMoving(true);
    const result = moveOrganization({
      organizationId: draggingId,
      newParentId: resolved.newParentId,
      newIndex: resolved.newIndex,
      actorIsAdmin: canDrag,
    });
    setMoving(false);

    if (!result.ok) {
      setToast(result.error);
      return;
    }

    expandId(resolved.newParentId);
    onTreeMoved?.();
    if (result.parentChanged) {
      setToast('조직이 이동되었습니다.');
    }
  };

  const activeNode = activeId
    ? flat.find(r => r.id === activeId)?.node
    : null;

  return (
    <div className="flex flex-col h-full min-h-0 bg-white rounded-[20px] border border-[#ECECEC] shadow-[0_8px_30px_rgba(0,0,0,0.06)] overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2 min-w-0">
          <FolderTree className="w-4 h-4 text-primary-600 shrink-0" />
          <h3 className="text-[15px] font-bold text-gray-900 truncate">조직 트리</h3>
        </div>
        <button
          type="button"
          onClick={() => onAddChild(null)}
          className="inline-flex items-center gap-1 h-9 px-3 rounded-[12px] text-[13px] font-semibold bg-primary-50 text-primary-700 hover:bg-primary-100"
        >
          <Plus className="w-4 h-4" />
          최상위
        </button>
      </div>

      {toast && (
        <div className="mx-2 mt-2 px-3 py-2 rounded-xl text-[12px] font-semibold bg-gray-900 text-white">
          {toast}
        </div>
      )}

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-2"
        onPointerMove={e => {
          pointerYRef.current = e.clientY;
        }}
      >
        {tree.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-10">
            조직이 없습니다. 최상위 조직을 추가하세요.
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <RootDropZone active={Boolean(activeId)} />
            {flat.map(row => (
              <div key={row.id} id={`org-tree-row-${row.id}`} data-org-row={row.id}>
                <TreeRow
                  row={row}
                  selectedId={selectedId}
                  onSelect={onSelect}
                  onAddChild={onAddChild}
                  expanded={expanded}
                  toggle={toggle}
                  canDrag={canDrag && !moving}
                  canEdit={canEdit}
                  dropHint={dropHint}
                  isDragging={activeId === row.id}
                  isMatch={matchedIds?.has(row.id)}
                  editingId={editingId}
                  editDraft={editDraft}
                  editError={editError}
                  onStartEdit={startEdit}
                  onEditDraftChange={setEditDraft}
                  onCommitEdit={commitEdit}
                  onCancelEdit={cancelEdit}
                  onOpenMobileMenu={setMobileMenuId}
                />
              </div>
            ))}
            <DragOverlay dropAnimation={null}>
              {activeNode ? (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-[12px] bg-white shadow-lg border border-primary-200 opacity-95">
                  <GripVertical className="w-4 h-4 text-gray-400" />
                  <span className="text-[14px] font-semibold text-gray-800">
                    {activeNode.name}
                  </span>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {canDrag && (
        <p className="px-4 py-2 text-[11px] text-gray-400 border-t border-gray-100">
          왼쪽 ⠿ 핸들을 끌어 순서를 바꾸거나 다른 조직 아래로 이동할 수 있습니다.
          {canEdit && !isMobile && ' 조직명은 더블클릭 또는 ✎ 아이콘으로 수정합니다.'}
        </p>
      )}

      {/* 모바일 ⋮ 메뉴 */}
      {mobileMenuId && !mobileRenameOpen && (
        <div className="fixed inset-0 z-[350] sm:hidden">
          <button type="button" className="absolute inset-0 bg-black/40" onClick={() => setMobileMenuId(null)} aria-label="닫기" />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[24px] p-4 pb-8 shadow-xl">
            <p className="text-sm font-bold text-gray-900 mb-3 px-1">
              {getOrganizationById(mobileMenuId)?.name ?? '조직'}
            </p>
            <div className="space-y-1">
              <button
                type="button"
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-[14px] hover:bg-gray-50 min-h-[48px]"
                onClick={() => {
                  const org = getOrganizationById(mobileMenuId);
                  if (org) {
                    setEditDraft(org.name);
                    setEditingId(mobileMenuId);
                    setEditError(null);
                    setMobileRenameOpen(true);
                  }
                }}
              >
                <Pencil className="w-4 h-4 text-primary-600" />
                <span className="text-sm font-semibold">이름 수정</span>
              </button>
              <button
                type="button"
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-[14px] hover:bg-gray-50 min-h-[48px]"
                onClick={() => { onAddChild(mobileMenuId); setMobileMenuId(null); }}
              >
                <Plus className="w-4 h-4 text-primary-600" />
                <span className="text-sm font-semibold">하위 조직 추가</span>
              </button>
              <button
                type="button"
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-[14px] hover:bg-red-50 min-h-[48px] text-red-600"
                onClick={() => handleDeleteOrg(mobileMenuId)}
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-sm font-semibold">삭제</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 모바일 이름 수정 */}
      {mobileRenameOpen && editingId && (
        <div className="fixed inset-0 z-[360] sm:hidden flex items-end">
          <button type="button" className="absolute inset-0 bg-black/40" onClick={() => { setMobileRenameOpen(false); cancelEdit(); }} aria-label="닫기" />
          <div className="relative w-full bg-white rounded-t-[24px] p-5 pb-8 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#1A1A1A]">조직명 수정</h3>
              <button type="button" onClick={() => { setMobileRenameOpen(false); cancelEdit(); }} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">조직명</label>
            <input
              autoFocus
              value={editDraft}
              onChange={e => setEditDraft(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); commitEdit(); }
                if (e.key === 'Escape') { e.preventDefault(); setMobileRenameOpen(false); cancelEdit(); }
              }}
              className="w-full h-11 px-3.5 text-sm bg-white border border-[#ECECEC] rounded-[12px] focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 mb-1"
            />
            {editError && <p className="text-xs text-red-500 mb-3">{editError}</p>}
            <div className="flex gap-2 mt-4">
              <ChurchButton variant="outline" className="flex-1" onClick={() => { setMobileRenameOpen(false); cancelEdit(); }}>
                취소
              </ChurchButton>
              <ChurchButton className="flex-1" onClick={commitEdit}>
                저장
              </ChurchButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

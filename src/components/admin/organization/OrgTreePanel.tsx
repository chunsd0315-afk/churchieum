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
import { GripVertical, ChevronDown, ChevronRight, FolderTree, Plus } from 'lucide-react';
import type { OrgTreeNode } from '../../../types/organization';
import { useOrgSettings } from '../../../contexts/OrgSettingsContext';
import { useAuth } from '../../../contexts/AuthContext';
import { getOrganizationTypeDisplay } from '../../../services/orgTerminology';
import {
  ORG_ROOT_DROP_ID,
  getOrganizationById,
  moveOrganization,
  resolveOrganizationDropTarget,
  wouldCreateCycle,
  type OrgDropPosition,
} from '../../../services/organizationStorage';

type Props = {
  tree: OrgTreeNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddChild: (parentId: string | null) => void;
  onTreeMoved?: () => void;
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
  dropHint,
  isDragging,
}: {
  row: FlatRow;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddChild: (parentId: string | null) => void;
  expanded: Set<string>;
  toggle: (id: string) => void;
  canDrag: boolean;
  dropHint: { id: string; position: OrgDropPosition; invalid?: boolean } | null;
  isDragging: boolean;
}) {
  const { node, depth } = row;
  const hasChildren = node.children.length > 0;
  const isOpen = expanded.has(node.id);
  const active = selectedId === node.id;
  const typeLabel = getOrganizationTypeDisplay(node);

  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    setActivatorNodeRef,
  } = useDraggable({
    id: node.id,
    disabled: !canDrag,
    data: { type: 'org', parentId: row.parentId },
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: node.id,
    data: { type: 'org', parentId: row.parentId },
    disabled: !canDrag,
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
          active ? 'bg-primary-50 text-primary-700' : 'hover:bg-gray-50 text-gray-800',
          showInside ? 'ring-2 ring-primary-400 bg-primary-50/80' : '',
          showInvalid ? 'ring-2 ring-red-300 bg-red-50' : '',
        ].join(' ')}
        style={{ paddingLeft: 4 + depth * 14 }}
      >
        {canDrag ? (
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
          <span className="w-2 shrink-0" />
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

        <button
          type="button"
          onClick={() => onSelect(node.id)}
          className="flex-1 min-w-0 text-left py-2.5 touch-target"
        >
          <span className={`block text-[14px] font-semibold truncate ${!node.isActive ? 'text-gray-400 line-through' : ''}`}>
            {node.name}
          </span>
          <span className="block text-[11px] text-gray-400 truncate">{typeLabel}</span>
        </button>

        <button
          type="button"
          aria-label="하위 조직 추가"
          onClick={() => onAddChild(node.id)}
          className="opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-primary-600 hover:bg-primary-100"
        >
          <Plus className="w-4 h-4" />
        </button>
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
}: Props) {
  const { terminologyVersion } = useOrgSettings();
  void terminologyVersion;
  const { isAdmin } = useAuth();
  const canDrag = isAdmin;

  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(collectIds(tree).slice(0, 40)));
  const [activeId, setActiveId] = useState<string | null>(null);
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
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(t);
  }, [toast]);

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
    <div className="flex flex-col h-full min-h-0 bg-white rounded-[20px] border border-gray-200 shadow-sm overflow-hidden">
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
                  dropHint={dropHint}
                  isDragging={activeId === row.id}
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
        </p>
      )}
    </div>
  );
}

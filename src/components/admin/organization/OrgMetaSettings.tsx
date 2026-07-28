import { useEffect, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, GripVertical, Pencil, ChevronUp, ChevronDown } from 'lucide-react';
import type { ChurchRole, OrgTypeDef } from '../../../types/organization';
import {
  canMutateOrgMeta,
  deleteChurchRole,
  deleteOrgType,
  isChurchRoleInUse,
  isOrgTypeInUse,
  renameChurchRole,
  renameOrgType,
  reorderChurchRoles,
  reorderOrgTypes,
  upsertChurchRole,
  upsertOrgType,
} from '../../../services/organizationStorage';
import { useChurchRoles, useOrgTypes } from '../../../hooks/useOrgMeta';
import { useBreakpoint } from '../../../hooks/useBreakpoint';
import { useAuth } from '../../../contexts/AuthContext';
import { ChurchButton } from '../../common/ui/ChurchButton';
import { TabBar } from '../../common/ui/TabBar';
import { useToast } from '../../common/ui';

type MetaTab = 'types' | 'roles';

const IN_USE_MSG =
  '현재 사용 중인 항목입니다. 다른 종류 또는 직분으로 변경한 후 삭제할 수 있습니다.';

const inputClass =
  'w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:outline-none';

const listShellClass =
  'rounded-[20px] border border-gray-200 bg-white divide-y divide-gray-100 overflow-hidden shadow-sm';

type Props = {
  embedded?: boolean;
};

function confirmDelete(label: string, kind: '종류' | '직분'): boolean {
  return window.confirm(`'${label}' ${kind}을(를) 삭제하시겠습니까?`);
}

function MetaRowActions({
  canEdit,
  onEdit,
  onDelete,
}: {
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  if (!canEdit) return null;
  return (
    <div className="flex items-center gap-1 shrink-0">
      <ChurchButton variant="ghost" size="sm" icon={<Pencil size={16} />} onClick={onEdit}>
        수정
      </ChurchButton>
      <button
        type="button"
        onClick={onDelete}
        className="min-h-[44px] px-3 text-sm font-bold rounded-btn border-2 border-red-300 text-red-600 bg-white hover:bg-red-50 transition-colors"
      >
        삭제
      </button>
    </div>
  );
}

function MobileReorder({
  canEdit,
  onUp,
  onDown,
  disableUp,
  disableDown,
}: {
  canEdit: boolean;
  onUp: () => void;
  onDown: () => void;
  disableUp: boolean;
  disableDown: boolean;
}) {
  const { isMobile } = useBreakpoint();
  if (!canEdit || !isMobile) return null;
  return (
    <div className="flex flex-col shrink-0">
      <button type="button" aria-label="위로" disabled={disableUp} onClick={onUp} className="touch-target p-1 text-gray-500 disabled:opacity-30">
        <ChevronUp className="w-5 h-5" />
      </button>
      <button type="button" aria-label="아래로" disabled={disableDown} onClick={onDown} className="touch-target p-1 text-gray-500 disabled:opacity-30">
        <ChevronDown className="w-5 h-5" />
      </button>
    </div>
  );
}

function SortableTypeRow({
  item,
  index,
  total,
  canEdit,
  onRefresh,
  onMove,
}: {
  item: OrgTypeDef;
  index: number;
  total: number;
  canEdit: boolean;
  onRefresh: () => void;
  onMove: (id: string, dir: -1 | 1) => void;
}) {
  const toast = useToast();
  const { isMobile } = useBreakpoint();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.name);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: !canEdit || editing,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
  };

  const save = () => {
    const name = draft.trim();
    if (!name) return;
    if (renameOrgType(item.id, name)) {
      toast.success('수정되었습니다.');
      setEditing(false);
      onRefresh();
    } else toast.error('저장할 수 없습니다.');
  };

  const remove = () => {
    if (isOrgTypeInUse(item.name)) {
      toast.error(IN_USE_MSG);
      return;
    }
    if (!confirmDelete(item.name, '종류')) return;
    const res = deleteOrgType(item.id);
    if (res.ok) {
      toast.success('삭제되었습니다.');
      onRefresh();
    } else toast.error('삭제할 수 없습니다.');
  };

  return (
    <li ref={setNodeRef} style={style} className="px-3 py-2">
      {editing ? (
        <div className="space-y-2" onKeyDown={e => e.key === 'Escape' && setEditing(false)}>
          <input className={inputClass} value={draft} onChange={e => setDraft(e.target.value)} autoFocus onKeyDown={e => e.key === 'Enter' && save()} />
          <div className="flex gap-2">
            <ChurchButton size="sm" onClick={save}>저장</ChurchButton>
            <ChurchButton variant="outline" size="sm" onClick={() => { setEditing(false); setDraft(item.name); }}>취소</ChurchButton>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2 min-h-[48px]">
          <div className="flex items-center gap-1 min-w-0">
            {canEdit && !isMobile && (
              <button type="button" className="touch-target p-2 text-gray-400 hover:text-primary-600 cursor-grab active:cursor-grabbing" aria-label="순서 변경" {...attributes} {...listeners}>
                <GripVertical className="w-5 h-5" />
              </button>
            )}
            <span className="text-sm font-semibold text-gray-900 truncate">{item.name}</span>
          </div>
          <MobileReorder canEdit={canEdit} disableUp={index === 0} disableDown={index >= total - 1} onUp={() => onMove(item.id, -1)} onDown={() => onMove(item.id, 1)} />
          <MetaRowActions canEdit={canEdit} onEdit={() => setEditing(true)} onDelete={remove} />
        </div>
      )}
    </li>
  );
}

function SortableRoleRow({
  item,
  index,
  total,
  canEdit,
  onRefresh,
  onMove,
}: {
  item: ChurchRole;
  index: number;
  total: number;
  canEdit: boolean;
  onRefresh: () => void;
  onMove: (id: string, dir: -1 | 1) => void;
}) {
  const toast = useToast();
  const { isMobile } = useBreakpoint();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.name);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: !canEdit || editing,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
  };

  const save = () => {
    const name = draft.trim();
    if (!name) return;
    if (renameChurchRole(item.id, name)) {
      toast.success('수정되었습니다.');
      setEditing(false);
      onRefresh();
    } else toast.error('저장할 수 없습니다.');
  };

  const remove = () => {
    if (isChurchRoleInUse(item)) {
      toast.error(IN_USE_MSG);
      return;
    }
    if (!confirmDelete(item.name, '직분')) return;
    const res = deleteChurchRole(item.id);
    if (res.ok) {
      toast.success('삭제되었습니다.');
      onRefresh();
    } else toast.error('삭제할 수 없습니다.');
  };

  return (
    <li ref={setNodeRef} style={style} className="px-3 py-2">
      {editing ? (
        <div className="space-y-2">
          <input className={inputClass} value={draft} onChange={e => setDraft(e.target.value)} autoFocus onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setEditing(false); setDraft(item.name); } }} />
          <div className="flex gap-2">
            <ChurchButton size="sm" onClick={save}>저장</ChurchButton>
            <ChurchButton variant="outline" size="sm" onClick={() => { setEditing(false); setDraft(item.name); }}>취소</ChurchButton>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2 min-h-[48px]">
          <div className="flex items-center gap-1 min-w-0">
            {canEdit && !isMobile && (
              <button type="button" className="touch-target p-2 text-gray-400 hover:text-primary-600 cursor-grab active:cursor-grabbing" aria-label="순서 변경" {...attributes} {...listeners}>
                <GripVertical className="w-5 h-5" />
              </button>
            )}
            <span className="text-sm font-semibold text-gray-900 truncate">{item.name}</span>
          </div>
          <MobileReorder canEdit={canEdit} disableUp={index === 0} disableDown={index >= total - 1} onUp={() => onMove(item.id, -1)} onDown={() => onMove(item.id, 1)} />
          <MetaRowActions canEdit={canEdit} onEdit={() => setEditing(true)} onDelete={remove} />
        </div>
      )}
    </li>
  );
}

function AddInlineForm({
  open,
  label,
  placeholder,
  onClose,
  onSubmit,
}: {
  open: boolean;
  label: string;
  placeholder: string;
  onClose: () => void;
  onSubmit: (name: string) => void;
}) {
  const [value, setValue] = useState('');

  useEffect(() => {
    if (open) setValue('');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const submit = () => {
    const name = value.trim();
    if (!name) return;
    onSubmit(name);
    onClose();
  };

  return (
    <div className="p-3 rounded-[18px] border border-primary-200 bg-[#FFFDF7] space-y-2">
      <p className="text-xs font-semibold text-gray-600">{label}</p>
      <input
        className={inputClass}
        value={value}
        placeholder={placeholder}
        autoFocus
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && submit()}
      />
      <div className="flex gap-2">
        <ChurchButton variant="outline" size="sm" onClick={onClose}>취소</ChurchButton>
        <ChurchButton size="sm" icon={<Plus size={16} />} onClick={submit}>추가</ChurchButton>
      </div>
    </div>
  );
}

export function OrgMetaSettings({ embedded = false }: Props) {
  const toast = useToast();
  const { isAdmin } = useAuth();
  const canEdit = isAdmin && canMutateOrgMeta();
  const [tab, setTab] = useState<MetaTab>('types');
  const [tick, setTick] = useState(0);
  const refresh = () => setTick(t => t + 1);
  void tick;

  const types = useOrgTypes(false);
  const roles = useChurchRoles(false);
  const [addTypeOpen, setAddTypeOpen] = useState(false);
  const [addRoleOpen, setAddRoleOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 6 } }),
  );

  const moveType = (id: string, dir: -1 | 1) => {
    const ids = types.map(t => t.id);
    const i = ids.indexOf(id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= ids.length) return;
    reorderOrgTypes(arrayMove(ids, i, j));
    toast.success('조직 종류 순서가 저장되었습니다.');
    refresh();
  };

  const moveRole = (id: string, dir: -1 | 1) => {
    const ids = roles.map(r => r.id);
    const i = ids.indexOf(id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= ids.length) return;
    reorderChurchRoles(arrayMove(ids, i, j));
    toast.success('직분 순서가 저장되었습니다.');
    refresh();
  };

  const onTypeDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = types.map(t => t.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    reorderOrgTypes(arrayMove(ids, oldIndex, newIndex));
    toast.success('조직 종류 순서가 저장되었습니다.');
    refresh();
  };

  const onRoleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = roles.map(r => r.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    reorderChurchRoles(arrayMove(ids, oldIndex, newIndex));
    toast.success('직분 순서가 저장되었습니다.');
    refresh();
  };

  const shellClass = embedded
    ? 'space-y-4'
    : 'bg-white rounded-[24px] border border-gray-200 shadow-sm p-4 space-y-4';

  return (
    <div className={shellClass}>
      <TabBar
        tabs={[
          { id: 'types', label: '조직 종류' },
          { id: 'roles', label: '직분' },
        ]}
        activeTab={tab}
        onChange={id => setTab(id as MetaTab)}
        variant="segment"
      />

      {!canEdit && (
        <p className="text-[13px] text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
          조회만 가능합니다. 종류·직분 변경은 최고관리자만 할 수 있습니다.
        </p>
      )}

      {tab === 'types' && (
        <div className="space-y-3">
          <p className="text-[13px] text-gray-500">조직 생성·수정 화면의 종류 목록과 동일한 순서로 표시됩니다.</p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onTypeDragEnd}>
            <SortableContext items={types.map(t => t.id)} strategy={verticalListSortingStrategy}>
              <ul className={listShellClass}>
                {types.map((t, i) => (
                  <SortableTypeRow key={t.id} item={t} index={i} total={types.length} canEdit={canEdit} onRefresh={refresh} onMove={moveType} />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
          {canEdit && (
            <>
              <AddInlineForm
                open={addTypeOpen}
                label="조직 종류 추가"
                placeholder="조직 종류 이름"
                onClose={() => setAddTypeOpen(false)}
                onSubmit={name => {
                  upsertOrgType({
                    id: `t-${Date.now().toString(36)}`,
                    name,
                    sortOrder: types.length + 1,
                    isActive: true,
                    isSystem: false,
                  });
                  toast.success('조직 종류가 추가되었습니다.');
                  refresh();
                }}
              />
              {!addTypeOpen && (
                <ChurchButton icon={<Plus size={18} />} size="sm" onClick={() => setAddTypeOpen(true)} className="w-full sm:w-auto">
                  조직 종류 추가
                </ChurchButton>
              )}
            </>
          )}
        </div>
      )}

      {tab === 'roles' && (
        <div className="space-y-3">
          <p className="text-[13px] text-gray-500">교역자·성도 등록과 직분 선택 목록에 동일하게 반영됩니다.</p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onRoleDragEnd}>
            <SortableContext items={roles.map(r => r.id)} strategy={verticalListSortingStrategy}>
              <ul className={listShellClass}>
                {roles.map((r, i) => (
                  <SortableRoleRow key={r.id} item={r} index={i} total={roles.length} canEdit={canEdit} onRefresh={refresh} onMove={moveRole} />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
          {canEdit && (
            <>
              <AddInlineForm
                open={addRoleOpen}
                label="직분 추가"
                placeholder="직분 이름"
                onClose={() => setAddRoleOpen(false)}
                onSubmit={name => {
                  upsertChurchRole({
                    id: `r-${Date.now().toString(36)}`,
                    name,
                    sortOrder: roles.length + 1,
                    isActive: true,
                    isSystem: false,
                  });
                  toast.success('직분이 추가되었습니다.');
                  refresh();
                }}
              />
              {!addRoleOpen && (
                <ChurchButton icon={<Plus size={18} />} size="sm" onClick={() => setAddRoleOpen(true)} className="w-full sm:w-auto">
                  직분 추가
                </ChurchButton>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

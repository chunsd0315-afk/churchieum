import { useState } from 'react';
import {
  DndContext,
  PointerSensor,
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
import { Plus, GripVertical, Pencil } from 'lucide-react';
import type { ChurchRole, OrgTypeDef } from '../../../types/organization';
import {
  deleteChurchRole,
  deleteOrgType,
  renameChurchRole,
  renameOrgType,
  reorderChurchRoles,
  upsertChurchRole,
  upsertOrgType,
} from '../../../services/organizationStorage';
import { useChurchRoles, useOrgTypes } from '../../../hooks/useOrgMeta';
import { ChurchButton } from '../../common/ui/ChurchButton';
import { TabBar } from '../../common/ui/TabBar';
import { useToast } from '../../common/ui';
import { CHURCH_LIST_CLASS } from '../../common/ui/ChurchList';

type MetaTab = 'types' | 'roles';

const IN_USE_TYPE_MSG =
  '현재 사용 중인 데이터입니다. 다른 종류로 변경한 후 삭제할 수 있습니다.';
const IN_USE_ROLE_MSG =
  '현재 사용 중인 데이터입니다. 다른 직분으로 변경한 후 삭제할 수 있습니다.';

const inputClass =
  'w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:outline-none';

function MetaRowActions({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <ChurchButton variant="outline" size="sm" icon={<Pencil size={16} />} onClick={onEdit}>
        수정
      </ChurchButton>
      <button
        type="button"
        onClick={onDelete}
        className="min-h-[44px] px-4 text-sm font-bold rounded-btn border-2 border-red-300 text-red-600 bg-white hover:bg-red-50 transition-colors"
      >
        삭제
      </button>
    </div>
  );
}

function TypeRow({
  item,
  onRefresh,
}: {
  item: OrgTypeDef;
  onRefresh: () => void;
}) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.name);

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
    const res = deleteOrgType(item.id);
    if (res.ok) {
      toast.success('삭제되었습니다.');
      onRefresh();
    } else if (res.reason === 'in_use') toast.error(IN_USE_TYPE_MSG);
    else toast.error('삭제할 수 없습니다.');
  };

  return (
    <li className="rounded-[18px] border border-gray-200 bg-white px-3 py-2.5 shadow-sm hover:border-primary-300 hover:bg-[#FFFDF7] transition-colors">
      {editing ? (
        <div className="space-y-2">
          <input
            className={inputClass}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            autoFocus
          />
          <div className="flex gap-2">
            <ChurchButton size="sm" onClick={save}>저장</ChurchButton>
            <ChurchButton variant="outline" size="sm" onClick={() => { setEditing(false); setDraft(item.name); }}>
              취소
            </ChurchButton>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-gray-900">[{item.name}]</span>
          <MetaRowActions onEdit={() => setEditing(true)} onDelete={remove} />
        </div>
      )}
    </li>
  );
}

function SortableRoleRow({
  item,
  onRefresh,
}: {
  item: ChurchRole;
  onRefresh: () => void;
}) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.name);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
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
    const res = deleteChurchRole(item.id);
    if (res.ok) {
      toast.success('삭제되었습니다.');
      onRefresh();
    } else if (res.reason === 'in_use') toast.error(IN_USE_ROLE_MSG);
    else toast.error('삭제할 수 없습니다.');
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="rounded-[18px] border border-gray-200 bg-white px-3 py-2.5 shadow-sm hover:border-primary-300 hover:bg-[#FFFDF7] transition-colors"
    >
      {editing ? (
        <div className="space-y-2">
          <input
            className={inputClass}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            autoFocus
          />
          <div className="flex gap-2">
            <ChurchButton size="sm" onClick={save}>저장</ChurchButton>
            <ChurchButton variant="outline" size="sm" onClick={() => { setEditing(false); setDraft(item.name); }}>
              취소
            </ChurchButton>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              className="touch-target p-2 -ml-1 text-gray-400 hover:text-primary-600 rounded-lg cursor-grab active:cursor-grabbing"
              aria-label="순서 변경"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="w-5 h-5" />
            </button>
            <span className="text-sm font-semibold text-gray-900 truncate">{item.name}</span>
          </div>
          <MetaRowActions onEdit={() => setEditing(true)} onDelete={remove} />
        </div>
      )}
    </li>
  );
}

export function OrgMetaSettings() {
  const toast = useToast();
  const [tab, setTab] = useState<MetaTab>('types');
  const [tick, setTick] = useState(0);
  const refresh = () => setTick(t => t + 1);
  void tick;

  const types = useOrgTypes(false);
  const roles = useChurchRoles(false);
  const [typeName, setTypeName] = useState('');
  const [roleName, setRoleName] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const addType = () => {
    const name = typeName.trim();
    if (!name) return;
    const row: OrgTypeDef = {
      id: `t-${Date.now().toString(36)}`,
      name,
      sortOrder: types.length + 1,
      isActive: true,
      isSystem: false,
    };
    upsertOrgType(row);
    setTypeName('');
    toast.success('조직 종류가 추가되었습니다.');
    refresh();
  };

  const addRole = () => {
    const name = roleName.trim();
    if (!name) return;
    const row: ChurchRole = {
      id: `r-${Date.now().toString(36)}`,
      name,
      sortOrder: roles.length + 1,
      isActive: true,
      isSystem: false,
    };
    upsertChurchRole(row);
    setRoleName('');
    toast.success('직분이 추가되었습니다.');
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

  return (
    <div className="bg-white rounded-[24px] border border-gray-200 shadow-sm p-4 space-y-4">
      <TabBar
        tabs={[
          { id: 'types', label: '조직 종류' },
          { id: 'roles', label: '직분' },
        ]}
        activeTab={tab}
        onChange={id => setTab(id as MetaTab)}
        variant="segment"
      />

      {tab === 'types' && (
        <div className="space-y-3">
          <p className="text-[13px] text-gray-500">교구·부서·기관 등 조직 종류를 자유롭게 추가·수정·삭제합니다.</p>
          <ul className={`${CHURCH_LIST_CLASS} space-y-2`}>
            {types.map(t => (
              <TypeRow key={t.id} item={t} onRefresh={refresh} />
            ))}
          </ul>
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <input
              className={inputClass}
              value={typeName}
              onChange={e => setTypeName(e.target.value)}
              placeholder="새 조직 종류 이름"
              onKeyDown={e => e.key === 'Enter' && addType()}
            />
            <ChurchButton icon={<Plus size={18} />} size="sm" onClick={addType} className="sm:shrink-0">
              조직 종류 추가
            </ChurchButton>
          </div>
        </div>
      )}

      {tab === 'roles' && (
        <div className="space-y-3">
          <p className="text-[13px] text-gray-500">
            직분 순서는 드래그로 변경됩니다. 교역자·성도 등록과 선택 목록에 동일하게 반영됩니다.
          </p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onRoleDragEnd}>
            <SortableContext items={roles.map(r => r.id)} strategy={verticalListSortingStrategy}>
              <ul className={`${CHURCH_LIST_CLASS} space-y-2`}>
                {roles.map(r => (
                  <SortableRoleRow key={r.id} item={r} onRefresh={refresh} />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <input
              className={inputClass}
              value={roleName}
              onChange={e => setRoleName(e.target.value)}
              placeholder="새 직분 이름"
              onKeyDown={e => e.key === 'Enter' && addRole()}
            />
            <ChurchButton icon={<Plus size={18} />} size="sm" onClick={addRole} className="sm:shrink-0">
              직분 추가
            </ChurchButton>
          </div>
        </div>
      )}
    </div>
  );
}

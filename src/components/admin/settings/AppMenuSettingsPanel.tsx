import { useCallback, useEffect, useState } from 'react';
import { GripVertical } from 'lucide-react';
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
import { HOME_MENU_CATALOG } from '../../common/home/homeMenuCatalog';
import {
  getChurchAppSettings,
  updateChurchAppSettings,
  type AppMenuItemConfig,
  CHURCH_APP_SETTINGS_EVENT,
} from '../../../services/churchAppSettingsStorage';
import { ChurchButton } from '../../common/ui/ChurchButton';
import { Save } from 'lucide-react';

function SortRow({
  item,
  label,
  description,
  onToggle,
}: {
  item: AppMenuItemConfig;
  label: string;
  description: string;
  onToggle: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.catalogKey,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 px-3 py-3 bg-white border border-[#ECECEC] rounded-[16px] mb-2"
    >
      <button
        type="button"
        className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 cursor-grab active:cursor-grabbing touch-none"
        aria-label="순서 변경"
        {...listeners}
        {...attributes}
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-900 truncate">{label}</p>
        <p className="text-xs text-gray-400 truncate">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={item.enabled}
        onClick={onToggle}
        className={`shrink-0 w-12 h-7 rounded-full transition-colors relative touch-target ${
          item.enabled ? 'bg-primary-500' : 'bg-gray-200'
        }`}
      >
        <span
          className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
            item.enabled ? 'left-5' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  );
}

export function AppMenuSettingsPanel() {
  const [menus, setMenus] = useState<AppMenuItemConfig[]>(() => getChurchAppSettings().menus);
  const [saved, setSaved] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => {
    const sync = () => setMenus(getChurchAppSettings().menus);
    window.addEventListener(CHURCH_APP_SETTINGS_EVENT, sync);
    return () => window.removeEventListener(CHURCH_APP_SETTINGS_EVENT, sync);
  }, []);

  const persist = useCallback((next: AppMenuItemConfig[]) => {
    const ordered = next.map((m, i) => ({ ...m, sortOrder: i }));
    setMenus(ordered);
    updateChurchAppSettings({ menus: ordered });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  }, []);

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = menus.findIndex(m => m.catalogKey === active.id);
    const newIndex = menus.findIndex(m => m.catalogKey === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    persist(arrayMove(menus, oldIndex, newIndex));
  };

  return (
    <div className="p-4 md:p-6 max-w-[900px]">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-gray-900">메뉴 관리</h2>
        <p className="text-sm text-gray-500 mt-1">
          성도·교역자 홈/사이드바에 표시할 메뉴와 순서를 설정합니다. 설정·관리 메뉴는 역할 정책에 따라 유지됩니다.
        </p>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={menus.map(m => m.catalogKey)} strategy={verticalListSortingStrategy}>
          {menus.map(item => {
            const meta = HOME_MENU_CATALOG[item.catalogKey as keyof typeof HOME_MENU_CATALOG];
            return (
              <SortRow
                key={item.catalogKey}
                item={item}
                label={meta?.label ?? item.catalogKey}
                description={meta?.description ?? ''}
                onToggle={() => {
                  persist(
                    menus.map(m =>
                      m.catalogKey === item.catalogKey ? { ...m, enabled: !m.enabled } : m,
                    ),
                  );
                }}
              />
            );
          })}
        </SortableContext>
      </DndContext>

      <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
        <ChurchButton
          icon={<Save size={16} />}
          size="sm"
          onClick={() => persist(menus)}
        >
          {saved ? '저장됨' : '다시 저장'}
        </ChurchButton>
        <span>변경 시 즉시 저장됩니다.</span>
      </div>
    </div>
  );
}

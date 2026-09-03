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
import {
  getChurchAppSettings,
  updateChurchAppSettings,
  CHURCH_APP_SETTINGS_EVENT,
  type AppHomeWidgets,
} from '../../../services/churchAppSettingsStorage';

type WidgetKey = keyof AppHomeWidgets;

const WIDGET_META: { key: WidgetKey; label: string; description: string; ready: boolean }[] = [
  { key: 'todayWord', label: '오늘의 말씀', description: '홈 상단 말씀 영역', ready: true },
  { key: 'recentNotices', label: '최근 공지사항', description: '홈 요약 위젯', ready: true },
  { key: 'upcomingSchedules', label: '이번 주 일정', description: '홈 요약 위젯', ready: true },
  { key: 'recentAlbums', label: '최근 앨범', description: '준비 중 — 추후 홈에 연결', ready: false },
  { key: 'bulletin', label: '주보', description: '준비 중 — 추후 홈에 연결', ready: false },
];

function SortToggleRow({
  id,
  label,
  description,
  enabled,
  ready,
  onToggle,
}: {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  ready: boolean;
  onToggle: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.85 : 1 }}
      className="flex items-center gap-2 px-3 py-3 bg-white border border-[#ECECEC] rounded-[16px] mb-2"
    >
      <button
        type="button"
        className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 cursor-grab touch-none"
        aria-label="순서 변경"
        {...listeners}
        {...attributes}
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-[#1A1A1A]">{label}</p>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        disabled={!ready}
        onClick={onToggle}
        className={`shrink-0 w-12 h-7 rounded-full relative touch-target disabled:opacity-40 ${
          enabled ? 'bg-primary-500' : 'bg-gray-200'
        }`}
      >
        <span
          className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
            enabled ? 'left-5' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  );
}

export function AppHomeSettingsPanel() {
  const [home, setHome] = useState<AppHomeWidgets>(() => getChurchAppSettings().home);
  const [order, setOrder] = useState<WidgetKey[]>(() => WIDGET_META.map(w => w.key));
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  useEffect(() => {
    const sync = () => setHome(getChurchAppSettings().home);
    window.addEventListener(CHURCH_APP_SETTINGS_EVENT, sync);
    return () => window.removeEventListener(CHURCH_APP_SETTINGS_EVENT, sync);
  }, []);

  const persist = useCallback((next: AppHomeWidgets) => {
    setHome(next);
    updateChurchAppSettings({ home: next });
  }, []);

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = order.indexOf(active.id as WidgetKey);
    const newIndex = order.indexOf(over.id as WidgetKey);
    if (oldIndex < 0 || newIndex < 0) return;
    setOrder(arrayMove(order, oldIndex, newIndex));
  };

  return (
    <div className="p-4 md:p-6 max-w-[900px]">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-[#1A1A1A]">홈 화면 설정</h2>
        <p className="text-sm text-gray-500 mt-1">
          홈에 표시할 요약 영역을 설정합니다. 순서는 드래그로 변경할 수 있습니다.
        </p>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          {order.map(key => {
            const meta = WIDGET_META.find(w => w.key === key)!;
            return (
              <SortToggleRow
                key={key}
                id={key}
                label={meta.label}
                description={meta.description}
                enabled={home[key]}
                ready={meta.ready}
                onToggle={() => {
                  if (!meta.ready) return;
                  persist({ ...home, [key]: !home[key] });
                }}
              />
            );
          })}
        </SortableContext>
      </DndContext>
    </div>
  );
}

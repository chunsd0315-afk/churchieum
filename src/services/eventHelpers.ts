import type { AppUser } from './permissions';
import type { ChurchEvent } from './supabase';

export type ScheduleEvent = ChurchEvent & {
  visibility_type?: 'all' | 'district' | 'zone' | 'department';
  scope_id?: string;
  scope_name?: string;
};

export const EVENT_TYPE_LABELS: Record<string, string> = {
  worship: '예배',
  prayer: '기도',
  meeting: '회의',
  event: '행사',
  church: '교회',
  choir: '성가대',
  district: '교구',
  education: '교육부',
};

export const EVENT_TYPE_OPTIONS = [
  { value: 'worship', label: '예배' },
  { value: 'prayer', label: '기도' },
  { value: 'meeting', label: '회의' },
  { value: 'choir', label: '성가대' },
  { value: 'district', label: '교구' },
  { value: 'education', label: '교육부' },
  { value: 'event', label: '행사' },
  { value: 'church', label: '교회' },
];

export function eventTypeLabel(type: string): string {
  return EVENT_TYPE_LABELS[type] ?? type;
}

export function formatEventTime(time?: string): string {
  if (!time) return '';
  const [h, m] = time.split(':');
  const hour = parseInt(h ?? '0', 10);
  const min = m ?? '00';
  const period = hour < 12 ? '오전' : '오후';
  const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${period} ${h12}:${min}`;
}

export function formatEventDateLong(dateStr: string): string {
  const d = new Date(`${dateStr.slice(0, 10)}T12:00:00`);
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
}

export function formatEventDateShort(dateStr: string): string {
  const [y, m, day] = dateStr.slice(0, 10).split('-');
  if (!y || !m || !day) return dateStr;
  return `${y}.${m}.${day}`;
}

export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function sortEventsByDateTime(a: ScheduleEvent, b: ScheduleEvent): number {
  const byDate = a.event_date.localeCompare(b.event_date);
  if (byDate !== 0) return byDate;
  return (a.event_time ?? '').localeCompare(b.event_time ?? '');
}

/** DB에 공개범위 컬럼이 없을 때 localStorage 보조 */
const VIS_KEY = 'churchieum_event_visibility_v1';

type StoredVis = {
  visibility_type: ScheduleEvent['visibility_type'];
  scope_id?: string;
  scope_name?: string;
};

export function loadEventVisibilityMap(): Record<string, StoredVis> {
  try {
    const raw = localStorage.getItem(VIS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, StoredVis>;
  } catch {
    return {};
  }
}

export function saveEventVisibility(id: string, vis: StoredVis): void {
  try {
    const map = loadEventVisibilityMap();
    map[id] = vis;
    localStorage.setItem(VIS_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export function mergeEventVisibility(events: ChurchEvent[]): ScheduleEvent[] {
  const map = loadEventVisibilityMap();
  return events.map(e => {
    const v = map[e.id];
    if (!v) return { ...e, visibility_type: 'all' as const };
    return { ...e, ...v };
  });
}

export function isEventVisible(event: ScheduleEvent, user: AppUser | null): boolean {
  if (!user) return event.visibility_type === 'all' || !event.visibility_type;
  if (user.role === 'super_admin') return true;
  const vis = event.visibility_type ?? 'all';
  if (vis === 'all') return true;
  if (vis === 'district') {
    const id = event.scope_id;
    if (!id) return true;
    return (
      user.districtId === id
      || user.assignedDistrictIds?.includes(id)
    );
  }
  if (vis === 'zone') {
    const id = event.scope_id;
    if (!id) return true;
    return (
      user.zoneId === id
      || user.assignedZoneIds?.includes(id)
    );
  }
  if (vis === 'department') {
    const id = event.scope_id;
    if (!id) return true;
    return (
      user.departmentIds?.includes(id)
      || user.assignedDepartmentIds?.includes(id)
    );
  }
  return true;
}

export function eventScopeBadge(event: ScheduleEvent): string {
  if (!event.visibility_type || event.visibility_type === 'all') return '전체';
  return event.scope_name ?? eventTypeLabel(event.visibility_type);
}

/**
 * 작성일(createdAt) 기준 기간 조회 유틸
 * — 정렬이 아니라 날짜 범위 필터 전용
 */

export type PeriodPreset =
  | 'all'
  | 'today'
  | 'last7days'
  | 'last30days'
  | 'last3months'
  | 'last6months'
  | 'last1year'
  | 'custom';

export type PeriodFilter = {
  preset: PeriodPreset;
  /** YYYY-MM-DD (직접 선택) */
  startDate: string | null;
  /** YYYY-MM-DD (직접 선택) */
  endDate: string | null;
};

export const EMPTY_PERIOD_FILTER: PeriodFilter = {
  preset: 'all',
  startDate: null,
  endDate: null,
};

export const PERIOD_PRESET_OPTIONS: { id: PeriodPreset; label: string }[] = [
  { id: 'all', label: '전체 기간' },
  { id: 'today', label: '오늘' },
  { id: 'last7days', label: '최근 7일' },
  { id: 'last30days', label: '최근 30일' },
  { id: 'last3months', label: '최근 3개월' },
  { id: 'last6months', label: '최근 6개월' },
  { id: 'last1year', label: '최근 1년' },
  { id: 'custom', label: '직접 선택' },
];

const PERIOD_CHIP_LABELS: Record<Exclude<PeriodPreset, 'all' | 'custom'>, string> = {
  today: '오늘',
  last7days: '최근 7일',
  last30days: '최근 30일',
  last3months: '최근 3개월',
  last6months: '최근 6개월',
  last1year: '최근 1년',
};

/** 로컬 자정 */
function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

/** 로컬 하루 끝 */
function endOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

/** YYYY-MM-DD → 로컬 Date (유효하지 않으면 null) */
export function parseLocalDateOnly(isoDate: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const day = Number(m[3]);
  if (!y || mo < 1 || mo > 12 || day < 1 || day > 31) return null;
  const d = new Date(y, mo - 1, day);
  if (d.getFullYear() !== y || d.getMonth() !== mo - 1 || d.getDate() !== day) return null;
  return d;
}

function formatLocalDateOnly(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatChipDate(isoDate: string): string {
  const d = parseLocalDateOnly(isoDate);
  if (!d) return isoDate;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

/** createdAt 등 다양한 직렬화 값을 Date로 안전 변환 */
export function parseCreatedAt(value: unknown): Date | null {
  if (value == null || value === '') return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'number') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    // 날짜만 있으면 로컬 자정으로
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return parseLocalDateOnly(trimmed);
    }
    const d = new Date(trimmed);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export type PeriodDateRange = {
  start: Date | null;
  end: Date | null;
};

/**
 * preset / 직접 선택 → 실제 조회 구간 (로컬 시간)
 * custom이면서 날짜가 불완전하면 start/end null (검증은 validatePeriodFilter에서)
 */
export function resolvePeriodDateRange(
  period: PeriodFilter,
  now: Date = new Date(),
): PeriodDateRange {
  const todayStart = startOfLocalDay(now);
  const todayEnd = endOfLocalDay(now);

  switch (period.preset) {
    case 'all':
      return { start: null, end: null };
    case 'today':
      return { start: todayStart, end: todayEnd };
    case 'last7days': {
      const start = startOfLocalDay(new Date(now));
      start.setDate(start.getDate() - 6);
      return { start, end: todayEnd };
    }
    case 'last30days': {
      const start = startOfLocalDay(new Date(now));
      start.setDate(start.getDate() - 29);
      return { start, end: todayEnd };
    }
    case 'last3months': {
      const start = startOfLocalDay(new Date(now));
      start.setMonth(start.getMonth() - 3);
      return { start, end: todayEnd };
    }
    case 'last6months': {
      const start = startOfLocalDay(new Date(now));
      start.setMonth(start.getMonth() - 6);
      return { start, end: todayEnd };
    }
    case 'last1year': {
      const start = startOfLocalDay(new Date(now));
      start.setFullYear(start.getFullYear() - 1);
      return { start, end: todayEnd };
    }
    case 'custom': {
      const start = period.startDate ? parseLocalDateOnly(period.startDate) : null;
      const end = period.endDate ? parseLocalDateOnly(period.endDate) : null;
      return {
        start: start ? startOfLocalDay(start) : null,
        end: end ? endOfLocalDay(end) : null,
      };
    }
    default:
      return { start: null, end: null };
  }
}

export function isPeriodActive(period: PeriodFilter): boolean {
  return period.preset !== 'all';
}

export function isRecordWithinPeriod(
  createdAt: unknown,
  period: PeriodFilter,
): boolean {
  if (period.preset === 'all') return true;
  const createdDate = parseCreatedAt(createdAt);
  if (!createdDate) return false;

  const range = resolvePeriodDateRange(period);
  if (period.preset === 'custom') {
    if (!range.start || !range.end) return false;
  }
  if (range.start && createdDate.getTime() < range.start.getTime()) return false;
  if (range.end && createdDate.getTime() > range.end.getTime()) return false;
  return true;
}

/** 적용 전 검증 — 통과 시 null, 실패 시 한글 오류 문구 */
export function validatePeriodFilter(period: PeriodFilter): string | null {
  if (period.preset !== 'custom') return null;
  if (!period.startDate?.trim()) return '시작일을 선택해 주세요.';
  if (!period.endDate?.trim()) return '종료일을 선택해 주세요.';
  const start = parseLocalDateOnly(period.startDate);
  const end = parseLocalDateOnly(period.endDate);
  if (!start || !end) return '유효한 날짜를 선택해 주세요.';
  if (start.getTime() > end.getTime()) {
    return '시작일은 종료일보다 늦을 수 없습니다.';
  }
  return null;
}

export function periodFilterChipLabel(period: PeriodFilter): string | null {
  if (period.preset === 'all') return null;
  if (period.preset === 'custom') {
    if (period.startDate && period.endDate) {
      return `${formatChipDate(period.startDate)} ~ ${formatChipDate(period.endDate)}`;
    }
    return '직접 선택';
  }
  return PERIOD_CHIP_LABELS[period.preset];
}

export function periodPresetWithClearedDates(preset: PeriodPreset): PeriodFilter {
  if (preset === 'custom') {
    return { preset: 'custom', startDate: null, endDate: null };
  }
  return { preset, startDate: null, endDate: null };
}

export function todayDateInputValue(now: Date = new Date()): string {
  return formatLocalDateOnly(now);
}

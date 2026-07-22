import type { GraceNote } from '../data/graceNotes';
import { getTodayReading, getProgressById, type PlanId } from '../data/readingPlans';
import { getAllSermons } from './sermonStorage';
import { WORSHIP_TYPE_LABELS, type WorshipType } from '../types/sermon';

export type GraceRelatedReadingDisplay = {
  planName: string;
  day?: number;
  reference: string;
  readingContent: string;
};

export type GraceRelatedSermonDisplay = {
  /** 설교 저장소 ID (표시·수정 복원용, 상세 클릭 이동에는 사용하지 않음) */
  sermonId?: string;
  title: string;
  preacher: string;
  scripture: string;
  /** 2026.07.19 형식, 없으면 null */
  dateLabel: string | null;
  /** 예배 구분·폴더명 */
  worshipLabel: string | null;
  /** sourceId는 있으나 설교·스냅샷을 찾을 수 없음 */
  notFound: boolean;
};

function verseExcerpt(verses: { text: string }[], max = 4): string {
  if (verses.length === 0) return '';
  return verses
    .slice(0, max)
    .map(v => v.text.trim())
    .filter(Boolean)
    .join(' ');
}

/**
 * 설교 날짜 표시 — YYYY-MM-DD는 타임존 밀림 없이 로컬 표기.
 * 우선순위: sermonDate → worshipDate → preachedAt → date → createdAt → note.sermonDate
 */
export function formatGraceSermonDisplayDate(source?: string | null): string | null {
  if (!source) return null;
  const raw = String(source).trim();
  if (!raw) return null;

  const ymd = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd) return `${ymd[1]}.${ymd[2]}.${ymd[3]}`;

  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

function pickSermonDateSource(
  sermon: {
    sermonDate?: string;
    worshipDate?: string;
    preachedAt?: string;
    date?: string;
    createdAt?: string;
  } | undefined,
  noteDate?: string,
): string | null {
  const candidates = [
    sermon?.sermonDate,
    (sermon as { worshipDate?: string } | undefined)?.worshipDate,
    (sermon as { preachedAt?: string } | undefined)?.preachedAt,
    (sermon as { date?: string } | undefined)?.date,
    sermon?.createdAt,
    noteDate,
  ];
  for (const c of candidates) {
    if (c && String(c).trim()) return String(c).trim();
  }
  return null;
}

function resolveWorshipLabel(
  sermon: { folderName?: string; worshipType?: WorshipType } | undefined,
  noteWorship?: string,
): string | null {
  if (sermon?.folderName?.trim()) return sermon.folderName.trim();
  if (sermon?.worshipType && WORSHIP_TYPE_LABELS[sermon.worshipType]) {
    return WORSHIP_TYPE_LABELS[sermon.worshipType];
  }
  const raw = noteWorship?.trim();
  if (!raw) return null;
  if (raw in WORSHIP_TYPE_LABELS) {
    return WORSHIP_TYPE_LABELS[raw as WorshipType];
  }
  return raw;
}

/** 연결된 성경통독 — plan·본문·통독 내용 자동 조회 */
export function resolveGraceRelatedReading(
  note: GraceNote,
): GraceRelatedReadingDisplay | null {
  if (note.type !== 'reading') return null;

  const progress = note.sourceId ? getProgressById(note.sourceId) : null;
  const planId = (note.planId ?? progress?.planId) as PlanId | undefined;
  const planName = note.planName ?? progress?.planName ?? '';
  const day = note.day ?? progress?.currentDay;

  if (!planId && !planName && !note.bibleReference?.trim()) return null;

  let reference = note.bibleReference?.trim() ?? '';
  let readingContent = '';

  if (planId && day) {
    try {
      const daily = getTodayReading(planId, day);
      if (!reference) reference = daily.fullLabel;
      readingContent = verseExcerpt(daily.verses, 5) || daily.fullLabel;
    } catch {
      readingContent = reference;
    }
  } else {
    readingContent = reference;
  }

  return {
    planName: planName || '성경통독',
    day,
    reference: reference || '연결된 본문',
    readingContent: readingContent || reference || '통독 내용을 불러올 수 없습니다.',
  };
}

/** 연결된 설교 — 설교 저장소에서 자동 조회 (fallback: note snapshot). 썸네일은 반환하지 않음 */
export function resolveGraceRelatedSermon(
  note: GraceNote,
): GraceRelatedSermonDisplay | null {
  if (note.type !== 'sermon') return null;

  const fromStore = note.sourceId
    ? getAllSermons().find(s => s.id === note.sourceId)
    : undefined;

  const title = fromStore?.title ?? note.sermonTitle?.trim() ?? '';
  const preacher = fromStore?.preacher ?? note.sermonPreacher?.trim() ?? '';
  const scripture = fromStore?.scripture ?? note.bibleReference?.trim() ?? '';
  const dateLabel = formatGraceSermonDisplayDate(
    pickSermonDateSource(fromStore, note.sermonDate),
  );
  const worshipLabel = resolveWorshipLabel(fromStore, note.worshipType);

  if (note.sourceId && !fromStore && !title && !scripture && !preacher) {
    return {
      title: '',
      preacher: '',
      scripture: '',
      dateLabel: null,
      worshipLabel: null,
      notFound: true,
    };
  }

  if (!title && !scripture && !note.sourceId) return null;

  return {
    sermonId: fromStore?.id,
    title: title || '연결된 설교',
    preacher,
    scripture,
    dateLabel,
    worshipLabel,
    notFound: false,
  };
}

/** seed 마이그레이션 — 설교 연결 필드를 저장소 기준으로 동기화 (ID·날짜 유지) */
export function syncSeedSermonLinkFields(note: GraceNote): Partial<GraceNote> {
  if (note.type !== 'sermon' || !note.sourceId) return {};
  const sermon = getAllSermons().find(s => s.id === note.sourceId);
  if (!sermon) return {};
  return {
    sermonTitle: sermon.title,
    sermonPreacher: sermon.preacher,
    sermonDate: sermon.sermonDate,
    bibleReference: sermon.scripture,
    worshipType: sermon.worshipType,
    thumbnailUrl: sermon.thumbnailUrl,
    videoUrl: sermon.videoUrl,
    sourceTitle: sermon.title,
  };
}

/** seed 마이그레이션 — 통독 연결 필드 보강 */
export function syncSeedReadingLinkFields(note: GraceNote): Partial<GraceNote> {
  if (note.type !== 'reading') return {};
  const progress = note.sourceId ? getProgressById(note.sourceId) : null;
  const updates: Partial<GraceNote> = {};
  if (progress) {
    if (!note.planId) updates.planId = progress.planId;
    if (!note.planName) updates.planName = progress.planName;
    if (!note.day) updates.day = progress.currentDay;
  }
  const related = resolveGraceRelatedReading({ ...note, ...updates });
  if (related && !note.bibleReference?.trim()) {
    updates.bibleReference = related.reference;
  }
  return updates;
}

/** 새 작성 형식 — 레거시 필드 제거 */
export const EMPTY_GRACE_LEGACY_FIELDS = {
  memorableVerse: '',
  application: '',
  prayer: '',
} as const;

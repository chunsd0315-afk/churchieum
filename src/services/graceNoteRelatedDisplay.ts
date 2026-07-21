import type { GraceNote } from '../data/graceNotes';
import { getTodayReading, getProgressById, type PlanId } from '../data/readingPlans';
import { getAllSermons } from './sermonStorage';

export type GraceRelatedReadingDisplay = {
  planName: string;
  day?: number;
  reference: string;
  readingContent: string;
};

export type GraceRelatedSermonDisplay = {
  title: string;
  preacher: string;
  scripture: string;
  summary: string;
  thumbnailUrl?: string;
};

function verseExcerpt(verses: { text: string }[], max = 4): string {
  if (verses.length === 0) return '';
  return verses
    .slice(0, max)
    .map(v => v.text.trim())
    .filter(Boolean)
    .join(' ');
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

/** 연결된 설교 — 설교 저장소에서 자동 조회 (fallback: note snapshot) */
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
  const summary = fromStore?.summary?.trim() ?? '';

  if (!title && !scripture && !note.sourceId) return null;

  return {
    title: title || '연결된 설교',
    preacher,
    scripture,
    summary: summary || '설교 요약이 등록되지 않았습니다.',
    thumbnailUrl: fromStore?.thumbnailUrl ?? note.thumbnailUrl,
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

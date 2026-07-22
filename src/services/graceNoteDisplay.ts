import type { GraceNote, GraceNoteType } from '../data/graceNotes';

export const GRACE_CONTENT_MAX_LENGTH = 2000;
export const GRACE_MENU_LABEL = '은혜와 기도';
export const GRACE_LIST_TITLE_FALLBACK = '제목 없는 기록';

export function graceRecordTypeLabel(type: GraceNoteType): string {
  return type === 'reading' ? '성경통독' : type === 'sermon' ? '설교' : '기도';
}

/** 기도 유형 본문 필드 라벨 */
export function graceContentFieldLabel(type: GraceNoteType): string {
  return type === 'prayer' ? '기도 내용' : '은혜 내용';
}

/** 기록유형·공개범위 배지 공통 크기 */
export const GRACE_BADGE_BASE =
  'inline-flex items-center h-5 px-2 rounded-full text-[11px] font-semibold leading-none';

export function graceTypeBadgeClass(type: GraceNoteType): string {
  return type === 'reading'
    ? 'bg-emerald-50 text-emerald-700'
    : type === 'sermon'
      ? 'bg-blue-50 text-blue-700'
      : 'bg-violet-50 text-violet-700';
}

export function graceShareBadgeClass(label: string): string {
  if (label.includes('나만')) return 'bg-gray-100 text-gray-600';
  if (label.includes('전체 공개')) return 'bg-violet-50 text-violet-700';
  if (label.includes('교역자')) return 'bg-blue-50 text-blue-700';
  return 'bg-emerald-50 text-emerald-700';
}

/** 목록·상세 공통 제목 */
export function getGraceNoteListTitle(note: GraceNote): string {
  const title = note.graceTitle?.trim();
  if (title) return title;
  if (note.type === 'sermon' && note.sermonTitle?.trim()) return note.sermonTitle.trim();
  if (note.type === 'reading' && note.bibleReference?.trim()) return note.bibleReference.trim();
  if (note.graceContent?.trim()) return note.graceContent.trim().slice(0, 28);
  return GRACE_LIST_TITLE_FALLBACK;
}

/** 목록 마지막 메타 줄 — 관련 기록 */
export function getGraceNoteRelatedLine(note: GraceNote): string {
  if (note.type === 'reading') {
    const ref = note.bibleReference?.trim();
    if (ref) return ref;
    if (note.planName && note.day) return `${note.planName} ${note.day}일차`;
    if (note.planName) return note.planName;
    return '관련 기록 없음';
  }
  if (note.type === 'sermon') {
    const title = note.sermonTitle?.trim();
    const ref = note.bibleReference?.trim();
    if (title && ref) return `${title} · ${ref}`;
    if (title) return title;
    if (ref) return ref;
    return '관련 기록 없음';
  }
  return '기도 기록';
}

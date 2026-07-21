/**
 * seed 은혜기록 — 제목·내용만 갱신 (ID·작성자·날짜·공개범위 등 유지)
 */

import type { GraceNote, GraceNoteType, GraceNoteVisibility } from '../data/graceNotes';
import {
  getAllGraceNotes,
  getGraceSeedCopyVersion,
  isSeedGraceNote,
  partitionGraceNotes,
  replaceSeedGraceNotes,
  setGraceSeedCopyVersion,
  GRACE_SEED_COPY_VERSION,
} from '../data/graceNotes';
import {
  buildGraceCopyForSeedNote,
  countUniqueTitles,
  countUniqueContentPairs,
} from '../data/graceNoteSeedCopyPools';
import {
  EMPTY_GRACE_LEGACY_FIELDS,
  syncSeedReadingLinkFields,
  syncSeedSermonLinkFields,
} from './graceNoteRelatedDisplay';

export type GraceSeedCopyRefreshReport = {
  updatedCount: number;
  skippedUserCount: number;
  byType: Record<string, number>;
  uniqueTitles: number;
  uniqueContents: number;
};

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** 단일 seed 기록 — 제목·내용 갱신 + 레거시 필드 제거 + 연결 정보 동기화 */
export function refreshSeedGraceNoteFields(note: GraceNote): Partial<GraceNote> {
  const copy = buildGraceCopyForSeedNote(note.type, note.id, hashString(note.id));
  return {
    graceTitle: copy.graceTitle,
    graceContent: copy.graceContent,
    ...EMPTY_GRACE_LEGACY_FIELDS,
    ...syncSeedSermonLinkFields(note),
    ...syncSeedReadingLinkFields(note),
  };
}

/** @deprecated refreshSeedGraceNoteFields 사용 */
export function refreshSeedGraceNoteCopy(
  note: GraceNote,
): Pick<GraceNote, 'graceTitle' | 'graceContent'> {
  const copy = refreshSeedGraceNoteFields(note);
  return {
    graceTitle: copy.graceTitle!,
    graceContent: copy.graceContent!,
  };
}

/** localStorage seed 기록 제목·내용 일괄 갱신 */
export function refreshSeedGraceNoteCopyInPlace(): GraceSeedCopyRefreshReport {
  const all = getAllGraceNotes();
  const { seed, user } = partitionGraceNotes(all);
  const byType: Record<string, number> = {};
  const titles = new Set<string>();
  const contents = new Set<string>();

  const refreshed = seed.map(note => {
    const updates = refreshSeedGraceNoteFields(note);
    byType[note.type] = (byType[note.type] ?? 0) + 1;
    titles.add(updates.graceTitle!);
    contents.add(updates.graceContent!);
    return { ...note, ...updates };
  });

  replaceSeedGraceNotes(refreshed);

  return {
    updatedCount: refreshed.length,
    skippedUserCount: user.length,
    byType,
    uniqueTitles: titles.size,
    uniqueContents: contents.size,
  };
}

export function isGraceSeedCopyCurrent(): boolean {
  return getGraceSeedCopyVersion() === GRACE_SEED_COPY_VERSION;
}

/** v5 seed 존재 + copy 버전 미적용 시 1회 실행 */
export function ensureSeedGraceNoteCopyRefreshed(): GraceSeedCopyRefreshReport | null {
  if (isGraceSeedCopyCurrent()) return null;
  const report = refreshSeedGraceNoteCopyInPlace();
  setGraceSeedCopyVersion(GRACE_SEED_COPY_VERSION);
  return report;
}

export function formatGraceSeedCopyRefreshReport(r: GraceSeedCopyRefreshReport): string {
  const types = Object.entries(r.byType).map(([k, v]) => `${k}: ${v}`).join(', ');
  return [
    `갱신 ${r.updatedCount}건 (사용자 기록 ${r.skippedUserCount}건 유지)`,
    `유형 — ${types}`,
    `고유 제목 ${r.uniqueTitles}종 · 고유 내용 ${r.uniqueContents}종`,
    `풀 규모 — 제목 ${countUniqueTitles()}종+ · 내용 조합 ${countUniqueContentPairs()}+`,
  ].join('\n');
}

/** seed 여부 + 복사 갱신 대상 확인 */
export function isCopyRefreshTarget(note: GraceNote): boolean {
  return isSeedGraceNote(note);
}

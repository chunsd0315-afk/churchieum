/**
 * 기존 은혜와 기도 댓글 — 테스트/시드 authorId 안전 매핑
 * (표시는 authorId 조회 우선, 데이터는 누락 id만 채움)
 */

import {
  getAllGraceNotes,
  replaceAllGraceNotes,
  type GraceNote,
  type GraceNoteComment,
} from '../data/graceNotes';
import { resolveCommentAuthorId } from './graceCommentAuthorMeta';

const LS_VERSION = 'graceNotes_comment_author_map_v2';
export const GRACE_COMMENT_AUTHOR_MAP_VERSION = '2';

export type GraceCommentAuthorMigrationReport = {
  totalComments: number;
  withAuthorIdBefore: number;
  mapped: number;
  displayReady: number;
  byType: { prayer: number; sermon: number; reading: number };
};

function shouldAllowSeedNameLookup(note: GraceNote, comment: GraceNoteComment): boolean {
  if (comment.id.startsWith('gnc-seed-')) return true;
  if (note.isSeed || note.isDemo || note.source === 'seed') return true;
  return false;
}

export function collectGraceCommentAuthorCoverage(
  notes: GraceNote[] = getAllGraceNotes(),
): GraceCommentAuthorMigrationReport {
  let totalComments = 0;
  let withAuthorIdBefore = 0;
  let displayReady = 0;
  const byType = { prayer: 0, sermon: 0, reading: 0 };

  for (const note of notes) {
    for (const c of note.comments ?? []) {
      if (c.type !== 'comment') continue;
      totalComments += 1;
      if (note.type === 'prayer') byType.prayer += 1;
      else if (note.type === 'sermon') byType.sermon += 1;
      else byType.reading += 1;

      if (c.authorId) withAuthorIdBefore += 1;

      const resolved = resolveCommentAuthorId(c, {
        allowSeedNameLookup: shouldAllowSeedNameLookup(note, c),
      });
      if (resolved) displayReady += 1;
    }
  }

  return {
    totalComments,
    withAuthorIdBefore,
    mapped: 0,
    displayReady,
    byType,
  };
}

/**
 * authorId 없는 테스트·시드 댓글만 매핑. 운영 댓글은 이름만으로 매핑하지 않음.
 * 호출 전 prepareDemoSeedAuthors() 로 시드 작성자 동기화를 권장한다.
 */
export function migrateGraceCommentAuthorIds(force = false): GraceCommentAuthorMigrationReport {
  try {
    if (!force && localStorage.getItem(LS_VERSION) === GRACE_COMMENT_AUTHOR_MAP_VERSION) {
      const coverage = collectGraceCommentAuthorCoverage();
      return { ...coverage, mapped: 0 };
    }
  } catch {
    /* continue */
  }

  const notes = getAllGraceNotes();
  let totalComments = 0;
  let withAuthorIdBefore = 0;
  let mapped = 0;
  let displayReady = 0;
  const byType = { prayer: 0, sermon: 0, reading: 0 };
  let changed = false;

  const next = notes.map(note => {
    const comments = (note.comments ?? []).map(c => {
      if (c.type === 'comment') {
        totalComments += 1;
        if (note.type === 'prayer') byType.prayer += 1;
        else if (note.type === 'sermon') byType.sermon += 1;
        else byType.reading += 1;
      }

      if (c.authorId) {
        if (c.type === 'comment') {
          withAuthorIdBefore += 1;
          displayReady += 1;
        }
        return c;
      }

      const resolved = resolveCommentAuthorId(c, {
        allowSeedNameLookup: shouldAllowSeedNameLookup(note, c),
      });
      if (!resolved) return c;

      if (c.type === 'comment') {
        mapped += 1;
        displayReady += 1;
      }
      changed = true;
      return { ...c, authorId: resolved };
    });
    return { ...note, comments };
  });

  if (changed) {
    replaceAllGraceNotes(next);
  }

  try {
    localStorage.setItem(LS_VERSION, GRACE_COMMENT_AUTHOR_MAP_VERSION);
  } catch {
    /* ignore */
  }

  return {
    totalComments,
    withAuthorIdBefore,
    mapped,
    displayReady,
    byType,
  };
}

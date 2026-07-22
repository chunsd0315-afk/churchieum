/**
 * 은혜와 기도 댓글 작성자 메타 — authorId 기준 최신 조회
 */

import { PRIMARY_DEMO_ACCOUNTS, DEMO_ACCOUNT_IDS } from '../config/demoAccounts';
import type { GraceNoteComment } from '../data/graceNotes';
import {
  combineNameAndPosition,
  formatGraceNoteListDate,
  resolveGraceNoteAuthorDisplay,
} from './graceNoteAuthorDisplay';
import {
  formatOrgMetaSecondaryLine,
  getUserDepartmentLabelOutsidePath,
  getUserPrimaryOrganizationPath,
} from './userOrganizationPath';
import { getAllOrganizations } from './organizationStorage';
import { getDemoData } from './demoData';

/** 대표 테스트 계정 — 이름(또는 레거시 이름) → userId */
const TEST_AUTHOR_NAME_TO_ID: Record<string, string> = {
  정재명: DEMO_ACCOUNT_IDS.admin,
  김영수: DEMO_ACCOUNT_IDS.admin,
  김담임: DEMO_ACCOUNT_IDS.admin,
  이변우: DEMO_ACCOUNT_IDS.pastor,
  강수아: DEMO_ACCOUNT_IDS.pastor,
  천성대: DEMO_ACCOUNT_IDS.member,
};

const POSITION_SUFFIXES = [
  '담임목사', '부목사', '교육전도사', '전도사', '목사',
  '장로', '권사', '안수집사', '서리집사', '집사',
  '성도', '청년', '학생', '새가족',
];

export type CommentAuthorSnapshot = {
  name?: string;
  position?: string;
  organizationPath?: string;
  departmentName?: string;
};

export type GraceCommentAuthorLike = Pick<GraceNoteComment, 'authorId' | 'authorName' | 'createdAt'> & {
  id?: string;
  authorPosition?: string;
  authorSnapshot?: CommentAuthorSnapshot;
};

export type CommentAuthorOrganizationMeta = {
  authorId?: string;
  name: string;
  position: string;
  label: string;
  organizationPath: string;
  departmentName: string;
  dateLabel: string;
  secondaryLine: string;
  imageSrc: string;
  isUnknown: boolean;
};

/** "정재명 목사" → "정재명" */
export function stripTrailingPosition(raw: string): string {
  let name = raw.trim().replace(/\s+/g, ' ');
  if (!name) return '';
  for (const pos of POSITION_SUFFIXES) {
    if (name.endsWith(` ${pos}`)) {
      name = name.slice(0, -(pos.length + 1)).trim();
      break;
    }
    if (name.endsWith(pos) && name.length > pos.length) {
      name = name.slice(0, -pos.length).trim();
      break;
    }
  }
  return name;
}

function lookupSeedMemberIdByName(name: string): string | undefined {
  const key = stripTrailingPosition(name);
  if (!key) return undefined;
  try {
    const members = getDemoData().members ?? [];
    const hits = members.filter(m => m.name === key || m.name === name);
    if (hits.length === 1) return hits[0].id;
    // seed 작성자 id 우선
    const seedHit = hits.find(m => String(m.id).startsWith('gn-author-'));
    if (seedHit) return seedHit.id;
    if (hits.length > 0) return hits[0].id;
  } catch {
    /* ignore */
  }
  return undefined;
}

/**
 * 표시·마이그레이션용 authorId 해석.
 * 운영 댓글은 이름만으로 임의 매핑하지 않음.
 * 테스트/시드만 이름 매핑 허용.
 */
export function resolveCommentAuthorId(
  comment: GraceCommentAuthorLike,
  options?: { allowSeedNameLookup?: boolean },
): string | undefined {
  if (comment.authorId?.trim()) return comment.authorId.trim();

  const rawName = comment.authorSnapshot?.name?.trim()
    || comment.authorName?.trim()
    || '';
  if (!rawName) return undefined;

  const base = stripTrailingPosition(rawName);
  const demoId = TEST_AUTHOR_NAME_TO_ID[base] ?? TEST_AUTHOR_NAME_TO_ID[rawName];
  if (demoId) return demoId;

  const allowSeed = options?.allowSeedNameLookup
    ?? Boolean(comment.id?.startsWith('gnc-seed-'));
  if (allowSeed) {
    return lookupSeedMemberIdByName(rawName);
  }

  return undefined;
}

export function getCommentAuthorOrganizationMeta(
  comment: GraceCommentAuthorLike,
  relatedOrganizationIds?: string[],
): CommentAuthorOrganizationMeta {
  const authorId = resolveCommentAuthorId(comment, {
    allowSeedNameLookup: Boolean(comment.id?.startsWith('gnc-seed-')),
  });

  const snapshot = comment.authorSnapshot;
  const display = resolveGraceNoteAuthorDisplay({
    userId: authorId,
    authorName: snapshot?.name || comment.authorName,
    authorRole: snapshot?.position || comment.authorPosition,
  });

  // snapshot-only fallback when user store miss
  let name = display.name;
  let position = display.position;
  let label = display.label;
  let isUnknown = display.isUnknown;

  if (display.isUnknown && (snapshot?.name || comment.authorName)) {
    name = stripTrailingPosition(snapshot?.name || comment.authorName || '') || '알 수 없는 작성자';
    position = (snapshot?.position || comment.authorPosition || '').trim();
    label = combineNameAndPosition(name, position);
    isUnknown = name === '알 수 없는 작성자';
  }

  const dateLabel = formatGraceNoteListDate(comment.createdAt);

  let organizationPath = '';
  let departmentName = '';

  if (authorId) {
    const pathNames = getUserPrimaryOrganizationPath(
      authorId,
      getAllOrganizations(),
      undefined,
      relatedOrganizationIds,
    );
    organizationPath = pathNames.join(' > ');
    departmentName = getUserDepartmentLabelOutsidePath(
      authorId,
      pathNames,
      relatedOrganizationIds,
    ) ?? '';
  } else if (snapshot?.organizationPath) {
    organizationPath = snapshot.organizationPath.trim();
    const dept = snapshot.departmentName?.trim() ?? '';
    if (dept && !organizationPath.includes(dept)) departmentName = dept;
  }

  const secondaryLine = formatOrgMetaSecondaryLine({
    pathNames: organizationPath ? organizationPath.split(' > ').filter(Boolean) : [],
    departmentLabel: departmentName || null,
    dateLabel,
  });

  return {
    authorId,
    name,
    position,
    label,
    organizationPath,
    departmentName,
    dateLabel,
    secondaryLine,
    imageSrc: display.imageSrc,
    isUnknown,
  };
}

/** 대표 데모 계정 이름 목록 (리포트·테스트용) */
export function getPrimaryDemoAuthorNames(): string[] {
  return PRIMARY_DEMO_ACCOUNTS.map(a => a.name);
}

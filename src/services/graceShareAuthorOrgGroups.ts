/**
 * 교역자 공유 기록 — 작성자·댓글 작성자를 교회 조직별로 그룹화
 */

import type { GraceNote, GraceNoteComment } from '../data/graceNotes';
import {
  getAllOrganizations,
  getAncestorIds,
  getDescendantIds,
  getOrganizationById,
} from './organizationStorage';
import {
  UNASSIGNED_AUTHOR_ORG_ID,
  getAuthorOrganizationIds,
} from './graceNoteShareScope';
import {
  buildGraceSharedAuthorPool,
  classifyGraceNoteAuthorRole,
  isPastoralGraceAuthorRole,
  type GraceAuthorPoolFilter,
  type GraceSharedAuthorOption,
} from './graceShareAuthorPool';
import { resolveGraceNoteAuthorDisplay } from './graceNoteAuthorDisplay';
import {
  formatOrgMetaSecondaryLine,
  getOrganizationIdsForUserId,
  getUserDepartmentLabelOutsidePath,
  getUserPrimaryOrganizationPath,
} from './userOrganizationPath';
import {
  getOrganizationPathLabel,
  getPastorAccessibleOrganizationIds,
} from './userOrganizationTree';
import { matchesShareTypeFilter } from './sharedContentAccess';
import type { AppUser } from './permissions';

const HIDDEN_ROOT_IDS = new Set(['org-church-root']);

export type AuthorOrgGroup = {
  organizationId: string;
  organizationName: string;
  /** 이 조직·하위 조직에 속한 고유 작성자 수 */
  authorCount: number;
  authors: GraceSharedAuthorOption[];
  children: AuthorOrgGroup[];
};

export type AuthorWithOrgIds = GraceSharedAuthorOption & {
  organizationIds: string[];
};

export type RelatedAuthorBuildOptions = {
  /** 기록 원 작성자 포함 (기본 true) */
  includeRecordAuthors?: boolean;
  /** 댓글 작성자 포함 (기본 true) */
  includeCommentAuthors?: boolean;
  /** 교역자 조회 가능 조직으로 트리·작성자 제한 */
  allowedOrganizationIds?: string[] | null;
  /** 표시 경로 우선 조직 (선택 조직·공유 조직) */
  preferredOrganizationIds?: string[];
};

function uniqueIds(ids: Iterable<string>): string[] {
  return [...new Set([...ids].filter(Boolean))];
}

function orgDisplayName(orgId: string): string {
  if (orgId === UNASSIGNED_AUTHOR_ORG_ID) return '소속 미지정';
  const node = getOrganizationById(orgId);
  if (node?.name?.trim()) return node.name.trim();
  const path = getOrganizationPathLabel(orgId);
  return path || orgId;
}

function authorOrgLabelForUser(
  userId: string,
  role: GraceSharedAuthorOption['role'],
  relatedOrganizationIds?: string[],
): string {
  const orgs = getAllOrganizations();
  const path = getUserPrimaryOrganizationPath(
    userId,
    orgs,
    undefined,
    relatedOrganizationIds,
  );
  if (role === 'pastor' || role === 'admin') {
    if (path.length > 0) return `${path.join(' > ')} · 담당교역자`;
    return '담당교역자';
  }
  const dept = getUserDepartmentLabelOutsidePath(userId, path, relatedOrganizationIds);
  return formatOrgMetaSecondaryLine({
    pathNames: path,
    departmentLabel: dept,
    dateLabel: '',
  });
}

function classifyUserIdRole(userId: string, fallbackRole?: string): GraceSharedAuthorOption['role'] {
  return classifyGraceNoteAuthorRole({ userId, authorRole: fallbackRole });
}

function notePassesPoolFilter(note: GraceNote, filter: GraceAuthorPoolFilter): boolean {
  if (filter.typeFilter && note.type !== filter.typeFilter) return false;
  if (!matchesShareTypeFilter(note, filter.shareType)) return false;
  return true;
}

function relatedOrgIdsFromNote(note: GraceNote): string[] {
  return uniqueIds([
    ...(note.sharedOrganizationIds ?? note.sharedGroupIds ?? []),
    ...(note.sharedUpperOrganizationIds ?? []),
    ...(note.sharedLowerOrganizationIds ?? []),
    ...(note.sharedDepartmentIds ?? []),
  ]);
}

/** 기록·댓글에서 관련된 사용자 ID 추출 */
export function getRelatedUserIdsForNote(note: Pick<GraceNote, 'userId' | 'comments'>): string[] {
  const ids = new Set<string>();
  const authorId = note.userId?.trim();
  if (authorId) ids.add(authorId);
  for (const c of note.comments ?? []) {
    const cid = c.authorId?.trim();
    if (cid) ids.add(cid);
  }
  return [...ids];
}

/**
 * 선택한 작성자(기록 작성자 또는 댓글 작성자) 매칭
 * selectedAuthorIds 비어 있으면 통과
 */
export function matchesSelectedAuthors(
  note: Pick<GraceNote, 'userId' | 'comments'>,
  selectedAuthorIds: string[] | undefined | null,
): boolean {
  const selected = (selectedAuthorIds ?? []).filter(Boolean);
  if (selected.length === 0) return true;
  const related = getRelatedUserIdsForNote(note);
  return selected.some(id => related.includes(id));
}

function resolveCommentDisplay(comment: GraceNoteComment): { label: string; role: GraceSharedAuthorOption['role'] } {
  const userId = comment.authorId?.trim() ?? '';
  if (userId) {
    const role = classifyUserIdRole(userId, comment.authorPosition);
    const display = resolveGraceNoteAuthorDisplay({
      userId,
      authorName: comment.authorName,
      authorRole: comment.authorPosition ?? comment.authorSnapshot?.position,
    });
    return { label: display.label, role };
  }
  const snapPos = comment.authorSnapshot?.position?.trim()
    || comment.authorPosition?.trim()
    || '';
  const name = comment.authorName?.trim() || '알 수 없는 작성자';
  const label = snapPos && !name.includes(snapPos) ? `${name} ${snapPos}` : name;
  const role = isPastoralGraceAuthorRole(snapPos) ? 'pastor' : 'member';
  return { label, role };
}

/** 공유 기록에서 작성자 + 댓글 작성자 + 소속 조직 ID 추출 */
export function buildAuthorsWithOrganizationIds(
  sharedNotes: GraceNote[],
  filter: GraceAuthorPoolFilter,
  authorRole: 'all' | 'member' | 'pastor' = 'all',
  options?: RelatedAuthorBuildOptions,
): AuthorWithOrgIds[] {
  const includeRecordAuthors = options?.includeRecordAuthors !== false;
  const includeCommentAuthors = options?.includeCommentAuthors !== false;
  const allowed = options?.allowedOrganizationIds
    ? new Set(options.allowedOrganizationIds.filter(Boolean))
    : null;
  const preferred = options?.preferredOrganizationIds ?? [];

  const map = new Map<string, AuthorWithOrgIds>();
  const orgHints = new Map<string, string[]>();

  const upsert = (
    userId: string,
    label: string,
    role: GraceSharedAuthorOption['role'],
    hintOrgs: string[],
  ) => {
    if (!userId) return;
    const prevHints = orgHints.get(userId) ?? [];
    orgHints.set(userId, uniqueIds([...prevHints, ...hintOrgs]));

    if (map.has(userId)) return;

    const organizationIds = getOrganizationIdsForUserId(userId);
    const relatedForLabel = uniqueIds([
      ...preferred,
      ...hintOrgs,
      ...organizationIds,
    ]);

    map.set(userId, {
      id: userId,
      name: label,
      role,
      positionLabel: undefined,
      orgLabel: authorOrgLabelForUser(userId, role, relatedForLabel) || undefined,
      organizationIds,
    });
  };

  for (const n of sharedNotes) {
    if (!notePassesPoolFilter(n, filter)) continue;
    const relatedOrgs = relatedOrgIdsFromNote(n);

    if (includeRecordAuthors) {
      const authorId = n.userId?.trim();
      if (authorId) {
        const role = classifyGraceNoteAuthorRole(n);
        const display = resolveGraceNoteAuthorDisplay(n);
        upsert(authorId, display.label, role, [
          ...relatedOrgs,
          ...getAuthorOrganizationIds(n),
        ]);
      }
    }

    if (includeCommentAuthors) {
      for (const c of n.comments ?? []) {
        const cid = c.authorId?.trim();
        if (!cid) continue;
        const { label, role } = resolveCommentDisplay(c);
        upsert(cid, label, role, relatedOrgs);
      }
    }
  }

  // 레거시 호환: 옵션 없이 기록 작성자만 쓰던 경우도 pool과 동일하게 보강
  if (includeRecordAuthors && !includeCommentAuthors) {
    for (const a of buildGraceSharedAuthorPool(sharedNotes, filter)) {
      if (!map.has(a.id)) {
        upsert(a.id, a.name, a.role, []);
      }
    }
  }

  let list = [...map.values()].map(a => {
    const hints = orgHints.get(a.id) ?? [];
    const relatedForLabel = uniqueIds([...preferred, ...hints, ...a.organizationIds]);
    return {
      ...a,
      orgLabel: authorOrgLabelForUser(a.id, a.role, relatedForLabel) || undefined,
    };
  });

  if (authorRole === 'member') {
    list = list.filter(a => a.role === 'member');
  } else if (authorRole === 'pastor') {
    list = list.filter(a => a.role === 'pastor' || a.role === 'admin');
  }

  if (allowed) {
    list = list.filter(a => {
      if (a.organizationIds.length === 0) return true; // 소속 미지정으로 유지
      return a.organizationIds.some(
        id => allowed.has(id)
          || getAncestorIds(id).some(anc => allowed.has(anc))
          || getDescendantIds(id).some(d => allowed.has(d)),
      );
    });
    // 표시용 organizationIds 는 허용 범위와 교차
    list = list.map(a => ({
      ...a,
      organizationIds: a.organizationIds.filter(
        id => allowed.has(id)
          || getAncestorIds(id).some(anc => allowed.has(anc)),
      ),
    }));
  }

  return list.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
}

function authorBelongsToOrgSubtree(
  authorOrgIds: string[],
  orgId: string,
): boolean {
  if (orgId === UNASSIGNED_AUTHOR_ORG_ID) {
    return authorOrgIds.length === 0;
  }
  const subtree = new Set<string>([orgId, ...getDescendantIds(orgId)]);
  return authorOrgIds.some(id => subtree.has(id) || getAncestorIds(id).includes(orgId));
}

/**
 * 교회 조직 트리에 작성자를 배치.
 * 작성자 수가 0인 가지는 제거. 소속 없는 작성자는 「소속 미지정」.
 * allowedOrganizationIds 가 있으면 해당 범위만 표시.
 */
export function buildAuthorOrganizationGroups(
  authors: AuthorWithOrgIds[],
  allowedOrganizationIds?: string[] | null,
): AuthorOrgGroup[] {
  const allowed = allowedOrganizationIds
    ? new Set(allowedOrganizationIds.filter(id => id && !HIDDEN_ROOT_IDS.has(id)))
    : null;

  const allOrgs = getAllOrganizations().filter(o => {
    if (!o.isActive || HIDDEN_ROOT_IDS.has(o.id)) return false;
    if (allowed && !allowed.has(o.id)) return false;
    return true;
  });
  const byId = new Map(allOrgs.map(o => [o.id, o]));
  const childrenOf = new Map<string | null, string[]>();

  for (const o of allOrgs) {
    const parent =
      o.parentId && !HIDDEN_ROOT_IDS.has(o.parentId) && byId.has(o.parentId)
        ? o.parentId
        : null;
    const list = childrenOf.get(parent) ?? [];
    list.push(o.id);
    childrenOf.set(parent, list);
  }

  const buildNode = (orgId: string): AuthorOrgGroup | null => {
    const childIds = (childrenOf.get(orgId) ?? [])
      .slice()
      .sort((a, b) => {
        const oa = byId.get(a)!;
        const ob = byId.get(b)!;
        return oa.sortOrder - ob.sortOrder || oa.name.localeCompare(ob.name, 'ko');
      });

    const children = childIds
      .map(buildNode)
      .filter((n): n is AuthorOrgGroup => n !== null);

    const authorMap = new Map<string, GraceSharedAuthorOption>();
    for (const a of authors) {
      if (authorBelongsToOrgSubtree(a.organizationIds, orgId)) {
        authorMap.set(a.id, a);
      }
    }

    const authorsInSubtree = [...authorMap.values()].sort((a, b) =>
      a.name.localeCompare(b.name, 'ko'),
    );

    if (authorsInSubtree.length === 0) return null;

    return {
      organizationId: orgId,
      organizationName: orgDisplayName(orgId),
      authorCount: authorsInSubtree.length,
      authors: authorsInSubtree,
      children,
    };
  };

  const rootIds = (childrenOf.get(null) ?? [])
    .slice()
    .sort((a, b) => {
      const oa = byId.get(a)!;
      const ob = byId.get(b)!;
      return oa.sortOrder - ob.sortOrder || oa.name.localeCompare(ob.name, 'ko');
    });

  const roots = rootIds
    .map(buildNode)
    .filter((n): n is AuthorOrgGroup => n !== null);

  const unassigned = authors.filter(a => a.organizationIds.length === 0);
  if (unassigned.length > 0) {
    roots.push({
      organizationId: UNASSIGNED_AUTHOR_ORG_ID,
      organizationName: '소속 미지정',
      authorCount: unassigned.length,
      authors: unassigned,
      children: [],
    });
  }

  return roots;
}

/** 선택한 조직(하위 포함)에 속한 작성자 — 중복 제거 */
export function filterAuthorsBySelectedOrganizations(
  authors: AuthorWithOrgIds[],
  selectedOrganizationIds: string[],
): AuthorWithOrgIds[] {
  if (selectedOrganizationIds.length === 0) return authors;
  return authors.filter(a => {
    if (selectedOrganizationIds.includes(UNASSIGNED_AUTHOR_ORG_ID) && a.organizationIds.length === 0) {
      return true;
    }
    return selectedOrganizationIds.some(orgId =>
      orgId !== UNASSIGNED_AUTHOR_ORG_ID
      && authorBelongsToOrgSubtree(a.organizationIds, orgId),
    );
  });
}

/** 조직/역할 변경 후 유효하지 않은 작성자 선택 제거 */
export function pruneSelectedAuthorIds(
  selectedAuthorIds: string[],
  validAuthors: { id: string }[],
): string[] {
  if (selectedAuthorIds.length === 0) return [];
  const valid = new Set(validAuthors.map(a => a.id));
  return uniqueIds(selectedAuthorIds.filter(id => valid.has(id)));
}

export function authorMatchesRoleFilter(
  note: Pick<GraceNote, 'userId' | 'authorRole'>,
  authorRole: 'all' | 'member' | 'pastor',
): boolean {
  if (authorRole === 'all') return true;
  const role = classifyGraceNoteAuthorRole(note);
  const isPastoral = role === 'pastor' || role === 'admin';
  if (authorRole === 'member') return !isPastoral;
  return isPastoral;
}

/** AuthorOrgGroup 트리에서 노드+하위 ID 수집 */
export function collectAuthorOrgGroupIds(group: AuthorOrgGroup): string[] {
  const ids: string[] = [group.organizationId];
  for (const child of group.children) {
    ids.push(...collectAuthorOrgGroupIds(child));
  }
  return ids;
}

export function findAuthorOrgGroup(
  groups: AuthorOrgGroup[],
  organizationId: string,
): AuthorOrgGroup | null {
  for (const g of groups) {
    if (g.organizationId === organizationId) return g;
    const found = findAuthorOrgGroup(g.children, organizationId);
    if (found) return found;
  }
  return null;
}

/**
 * 상위 조직 선택 시 표시된 하위까지 함께 반영 (공통 트리 로직)
 */
export function toggleAuthorOrgGroupSelection(
  groups: AuthorOrgGroup[],
  organizationId: string,
  selectedIds: string[],
): string[] {
  const node = findAuthorOrgGroup(groups, organizationId);
  if (!node) {
    if (selectedIds.includes(organizationId)) {
      return selectedIds.filter(id => id !== organizationId);
    }
    return [...selectedIds, organizationId];
  }

  const related = collectAuthorOrgGroupIds(node);
  const selected = new Set(selectedIds);
  const allSelected = related.every(id => selected.has(id));

  if (allSelected) {
    related.forEach(id => selected.delete(id));
  } else {
    related.forEach(id => selected.add(id));
  }
  return [...selected];
}

export function getAuthorOrgGroupCheckState(
  group: AuthorOrgGroup,
  selectedIds: string[],
): 'checked' | 'unchecked' | 'indeterminate' {
  const related = collectAuthorOrgGroupIds(group);
  const count = related.filter(id => selectedIds.includes(id)).length;
  if (count === 0) return 'unchecked';
  if (count === related.length) return 'checked';
  return 'indeterminate';
}

/** 교역자 모드 작성자 풀 빌드 헬퍼 */
export function buildPastorAuthorOrgGroups(params: {
  sharedNotes: GraceNote[];
  filter: GraceAuthorPoolFilter;
  authorRole: 'all' | 'member' | 'pastor';
  pastor: AppUser | null;
  preferredOrganizationIds?: string[];
}): AuthorOrgGroup[] {
  const allowed = getPastorAccessibleOrganizationIds(params.pastor);
  const authors = buildAuthorsWithOrganizationIds(
    params.sharedNotes,
    params.filter,
    params.authorRole,
    {
      includeRecordAuthors: true,
      includeCommentAuthors: true,
      allowedOrganizationIds: allowed,
      preferredOrganizationIds: params.preferredOrganizationIds,
    },
  );
  return buildAuthorOrganizationGroups(authors, allowed);
}

export { getPastorAccessibleOrganizationIds };

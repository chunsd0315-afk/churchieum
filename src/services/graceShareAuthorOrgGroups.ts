/**
 * 교역자 직접 공유 — 작성자를 교회 조직별로 그룹화
 */

import type { GraceNote } from '../data/graceNotes';
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
  type GraceAuthorPoolFilter,
  type GraceSharedAuthorOption,
} from './graceShareAuthorPool';
import { getOrganizationPathLabel } from './userOrganizationTree';

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

/** 공유 기록에서 작성자 + 소속 조직 ID 추출 */
export function buildAuthorsWithOrganizationIds(
  sharedNotes: GraceNote[],
  filter: GraceAuthorPoolFilter,
  authorRole: 'all' | 'member' | 'pastor' = 'all',
): AuthorWithOrgIds[] {
  const pool = buildGraceSharedAuthorPool(sharedNotes, filter);
  const orgByAuthor = new Map<string, string[]>();

  for (const n of sharedNotes) {
    const authorId = n.userId?.trim();
    if (!authorId || orgByAuthor.has(authorId)) continue;
    if (filter.typeFilter && n.type !== filter.typeFilter) continue;
    orgByAuthor.set(authorId, getAuthorOrganizationIds(n));
  }

  let list: AuthorWithOrgIds[] = pool.map(a => ({
    ...a,
    organizationIds: orgByAuthor.get(a.id) ?? [],
  }));

  if (authorRole === 'member') {
    list = list.filter(a => a.role === 'member');
  } else if (authorRole === 'pastor') {
    list = list.filter(a => a.role === 'pastor' || a.role === 'admin');
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
 */
export function buildAuthorOrganizationGroups(
  authors: AuthorWithOrgIds[],
): AuthorOrgGroup[] {
  const allOrgs = getAllOrganizations().filter(
    o => o.isActive && !HIDDEN_ROOT_IDS.has(o.id),
  );
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

    const directAuthors = authors.filter(a =>
      a.organizationIds.includes(orgId),
    );
    void directAuthors;

    // 하위만 있고 직속이 없어도 하위 작성자는 상위 count에 포함
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

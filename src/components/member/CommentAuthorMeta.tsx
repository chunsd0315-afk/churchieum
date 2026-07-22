import {
  formatGraceNoteListDate,
  resolveGraceNoteAuthorDisplay,
} from '../../services/graceNoteAuthorDisplay';
import {
  formatOrgMetaSecondaryLine,
  getUserDepartmentLabelOutsidePath,
  getUserPrimaryOrganizationPath,
} from '../../services/userOrganizationPath';
import { getAllOrganizations } from '../../services/organizationStorage';

export type CommentAuthorMetaProps = {
  authorId?: string;
  /** authorId 조회 실패 시 스냅샷 */
  authorName?: string;
  createdAt: string;
  /** 기록이 공유된 조직 — 대표 소속 선정에 사용 */
  relatedOrganizationIds?: string[];
};

/**
 * 댓글 작성자 메타
 * 1줄: 이름 직분
 * 2줄: 조직 경로 · 부서 · 작성일
 */
export function CommentAuthorMeta({
  authorId,
  authorName,
  createdAt,
  relatedOrganizationIds,
}: CommentAuthorMetaProps) {
  const author = resolveGraceNoteAuthorDisplay({
    userId: authorId,
    authorName,
  });
  const dateLabel = formatGraceNoteListDate(createdAt);
  const pathNames = authorId
    ? getUserPrimaryOrganizationPath(
        authorId,
        getAllOrganizations(),
        undefined,
        relatedOrganizationIds,
      )
    : [];
  const departmentLabel = authorId
    ? getUserDepartmentLabelOutsidePath(authorId, pathNames, relatedOrganizationIds)
    : null;
  const secondary = formatOrgMetaSecondaryLine({
    pathNames,
    departmentLabel,
    dateLabel,
  });

  return (
    <div className="min-w-0">
      <p className="text-sm font-semibold text-gray-800 leading-snug">{author.label}</p>
      {secondary ? (
        <p className="text-[12px] md:text-[13px] text-gray-500 mt-0.5 leading-snug break-words line-clamp-2">
          {secondary}
        </p>
      ) : null}
    </div>
  );
}

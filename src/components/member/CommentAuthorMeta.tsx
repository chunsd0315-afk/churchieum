import type { ReactNode } from 'react';
import { getCommentAuthorOrganizationMeta } from '../../services/graceCommentAuthorMeta';
import type { GraceNoteComment } from '../../data/graceNotes';

export type CommentAuthorMetaProps = {
  authorId?: string;
  /** authorId 조회 실패 시 스냅샷 */
  authorName?: string;
  authorPosition?: string;
  createdAt: string;
  commentId?: string;
  /** 기록이 공유된 조직 — 대표 소속 선정에 사용 */
  relatedOrganizationIds?: string[];
  /** 프로필 이미지 표시 (기본 true) */
  showAvatar?: boolean;
};

/**
 * 댓글 작성자 메타 (기존·신규 댓글 공통)
 * 1줄: 이름 직분
 * 2줄: 조직 경로 · 부서 · 작성일
 */
export function CommentAuthorMeta({
  authorId,
  authorName,
  authorPosition,
  createdAt,
  commentId,
  relatedOrganizationIds,
  showAvatar = true,
}: CommentAuthorMetaProps) {
  const meta = getCommentAuthorOrganizationMeta(
    {
      id: commentId,
      authorId,
      authorName: authorName ?? '',
      authorPosition,
      createdAt,
    },
    relatedOrganizationIds,
  );

  return (
    <div className="flex items-start gap-2.5 min-w-0 flex-1">
      {showAvatar && (
        <img
          src={meta.imageSrc}
          alt=""
          className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-gray-100"
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-800 leading-snug">{meta.label}</p>
        {meta.secondaryLine ? (
          <p className="text-[12px] md:text-[13px] text-gray-500 mt-0.5 leading-snug break-words line-clamp-2">
            {meta.secondaryLine}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export type GracePrayerCommentItemProps = {
  comment: GraceNoteComment & { authorPosition?: string };
  relatedOrganizationIds?: string[];
  canManage?: boolean;
  onDelete?: () => void;
  deleteButton?: ReactNode;
};

/** 기도·설교·성경통독 공통 댓글 행 */
export function GracePrayerCommentItem({
  comment,
  relatedOrganizationIds,
  deleteButton,
}: GracePrayerCommentItemProps) {
  return (
    <div className="py-2.5 first:pt-0">
      <div className="flex items-start justify-between gap-2 mb-1">
        <CommentAuthorMeta
          commentId={comment.id}
          authorId={comment.authorId}
          authorName={comment.authorName}
          authorPosition={comment.authorPosition}
          createdAt={comment.createdAt}
          relatedOrganizationIds={relatedOrganizationIds}
        />
        {deleteButton}
      </div>
      <p className="text-sm text-gray-600 whitespace-pre-wrap break-words pl-[46px]">
        {comment.content}
      </p>
    </div>
  );
}

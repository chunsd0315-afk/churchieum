/**
 * 공지사항 상세 — 은혜와 기도 GraceNoteDetailView 와 동일한 UX
 * - MobileFullScreenPage + ← 뒤로
 * - 우측 수정/삭제 (권한 사용자)
 * - 하단 댓글 (GracePrayerCommentItem 재사용)
 */

import { useEffect, useMemo, useState } from 'react';
import {
  Download, ImageIcon, Paperclip, Pin, Star, Trash2, Edit3, X, MessageCircle,
} from 'lucide-react';
import {
  deleteAnnouncement,
  getAnnouncementById,
  addAnnouncementComment,
  updateAnnouncementComment,
  deleteAnnouncementComment,
  resolveAnnouncementAllowComments,
  ANNOUNCEMENT_COMMENT_MAX_LENGTH,
  type Announcement,
  type AnnouncementComment,
} from '../../services/announcementStorage';
import { buildNoticeScopeBadges } from '../../services/announcementHelpers';
import { MobileFullScreenPage } from '../layout/ContentEditorLayout';
import { GracePrayerCommentItem } from '../member/CommentAuthorMeta';
import { resolveGraceNoteAuthorDisplay } from '../../services/graceNoteAuthorDisplay';
import { resolveCommentAuthorId } from '../../services/graceCommentAuthorMeta';
import { useAuth } from '../../contexts/AuthContext';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import type { GraceNoteComment } from '../../data/graceNotes';

function formatDisplayDate(date: string): string {
  if (!date) return '';
  // ISO → 2026.08.20 / already YYYY-MM-DD
  const d = date.includes('T') ? date.slice(0, 10) : date;
  return d.replace(/-/g, '.');
}

function toGraceComment(c: AnnouncementComment): GraceNoteComment {
  return {
    id: c.id,
    authorName: c.authorName,
    authorId: c.authorId,
    authorPosition: c.authorPosition,
    content: c.content,
    type: 'comment',
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

type Props = {
  announcementId: string;
  canManage: boolean;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function AnnouncementDetailView({
  announcementId,
  canManage,
  onBack,
  onEdit,
  onDelete,
}: Props) {
  const { user, isAdmin } = useAuth();
  const { isMobile } = useBreakpoint();

  const [ann, setAnn] = useState<Announcement | null>(() =>
    getAnnouncementById(announcementId),
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);

  const refresh = () => setAnn(getAnnouncementById(announcementId));

  useEffect(() => {
    setAnn(getAnnouncementById(announcementId));
  }, [announcementId]);

  const scopeBadges = useMemo(
    () => (ann ? buildNoticeScopeBadges(ann) : []),
    [ann],
  );

  const relatedOrganizationIds = useMemo(() => {
    if (!ann?.scopeId) return [];
    return [ann.scopeId];
  }, [ann]);

  if (!ann) {
    return (
      <MobileFullScreenPage
        title="공지사항"
        description="공지 내용을 확인합니다."
        onBack={onBack}
      >
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-gray-400 text-sm">공지를 찾을 수 없습니다.</p>
          <button
            type="button"
            onClick={onBack}
            className="mt-3 text-primary-500 text-sm font-medium"
          >
            ← 돌아가기
          </button>
        </div>
      </MobileFullScreenPage>
    );
  }

  const allowComments = resolveAnnouncementAllowComments(ann);
  const comments = (ann.comments ?? []).filter(c => c.type === 'comment');
  const commentCount = comments.length;

  const handleDelete = () => {
    deleteAnnouncement(ann.id);
    setConfirmDelete(false);
    onDelete();
  };

  const handleComment = () => {
    if (!allowComments || commentSubmitting || !commentText.trim()) return;
    setCommentSubmitting(true);
    try {
      const display = resolveGraceNoteAuthorDisplay({
        userId: user?.id,
        authorName: user?.name,
        authorRole: user?.position,
      });
      addAnnouncementComment(announcementId, display.label, commentText, {
        authorId: user?.id,
        authorPosition: user?.position,
      });
      setCommentText('');
      refresh();
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleSaveEditComment = (commentId: string) => {
    if (!editCommentText.trim()) return;
    updateAnnouncementComment(announcementId, commentId, editCommentText, {
      userId: user?.id,
      isAdmin,
    });
    setEditingCommentId(null);
    setEditCommentText('');
    refresh();
  };

  const handleDeleteComment = (commentId: string) => {
    deleteAnnouncementComment(announcementId, commentId, {
      userId: user?.id,
      isAdmin,
    });
    setDeleteCommentId(null);
    refresh();
  };

  /** 은혜와 기도와 동일한 수정·삭제 버튼 */
  const headerActions = canManage ? (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={onEdit}
        className="px-2.5 py-1.5 bg-primary-50 text-primary-600 rounded-xl text-xs font-semibold touch-target"
        aria-label="공지 수정"
      >
        <Edit3 className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={() => setConfirmDelete(true)}
        className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 touch-target"
        aria-label="공지 삭제"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  ) : undefined;

  const commentFooter = isMobile && allowComments ? (
    <div className="flex gap-2">
      <input
        value={commentText}
        onChange={e => setCommentText(e.target.value.slice(0, ANNOUNCEMENT_COMMENT_MAX_LENGTH))}
        placeholder="댓글을 입력하세요."
        className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary-400 bg-gray-50 min-h-[48px]"
        onKeyDown={e => { if (e.key === 'Enter') handleComment(); }}
        disabled={commentSubmitting}
      />
      <button
        type="button"
        onClick={handleComment}
        disabled={!commentText.trim() || commentSubmitting}
        className="px-4 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl disabled:opacity-40 touch-target min-h-[48px]"
      >
        등록
      </button>
    </div>
  ) : undefined;

  return (
    <>
      {confirmDelete && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="font-bold text-gray-900 mb-2">이 공지사항을 삭제하시겠습니까?</h3>
            <p className="text-sm text-gray-500 mb-5">삭제한 공지는 복구할 수 없습니다.</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-2xl text-sm font-bold hover:bg-gray-200"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 py-3 bg-red-500 text-white rounded-2xl text-sm font-bold hover:bg-red-600"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteCommentId && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="font-bold text-gray-900 mb-2">댓글을 삭제하시겠습니까?</h3>
            <p className="text-sm text-gray-500 mb-5">삭제한 댓글은 복구할 수 없습니다.</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteCommentId(null)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-2xl text-sm font-bold"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => handleDeleteComment(deleteCommentId)}
                className="flex-1 py-3 bg-red-500 text-white rounded-2xl text-sm font-bold"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {lightboxImg && (
        <div
          className="fixed inset-0 z-[450] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxImg(null)}
        >
          <img
            src={lightboxImg}
            alt=""
            className="max-w-full max-h-full rounded-2xl object-contain"
          />
          <button
            type="button"
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center"
            onClick={() => setLightboxImg(null)}
            aria-label="닫기"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      )}

      <MobileFullScreenPage
        title="공지사항"
        description="교회 소식과 안내를 확인합니다."
        onBack={onBack}
        saveButton={headerActions}
        footer={commentFooter}
      >
        <article className="bg-white rounded-[20px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 md:p-6 space-y-5">
            {/* 배지 */}
            <div className="flex items-center gap-2 flex-wrap">
              {(ann.isImportant || ann.isPinned) && (
                <span className="inline-flex items-center gap-0.5 text-[11px] px-2.5 py-1 rounded-full font-semibold bg-amber-50 text-amber-700">
                  {ann.isPinned ? <Pin className="w-3 h-3" /> : <Star className="w-3 h-3" />}
                  중요
                </span>
              )}
              {scopeBadges.map((b, i) => (
                <span
                  key={i}
                  className="text-[11px] px-2.5 py-1 rounded-full font-semibold bg-gray-50 text-gray-600 border border-gray-100"
                >
                  {b.label}
                </span>
              ))}
            </div>

            <h2 className="text-xl font-bold text-gray-900 leading-snug">{ann.title}</h2>

            <p className="text-[13px] font-medium text-gray-500">
              작성자 {ann.author} · {formatDisplayDate(ann.date)}
            </p>

            {ann.images.length > 0 && (
              <button
                type="button"
                className="w-full overflow-hidden rounded-[16px] bg-gray-100 cursor-pointer"
                style={{ aspectRatio: '16/7' }}
                onClick={() => setLightboxImg(ann.images[0])}
              >
                <img src={ann.images[0]} alt="" className="w-full h-full object-cover" />
              </button>
            )}

            <section>
              <p className="text-[15px] text-gray-800 leading-relaxed whitespace-pre-wrap">
                {ann.content}
              </p>
            </section>

            {ann.images.length > 1 && (
              <section className="pt-2 border-t border-gray-100 space-y-2">
                <p className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" /> 첨부 이미지 {ann.images.length}장
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {ann.images.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setLightboxImg(img)}
                      className="aspect-video rounded-xl overflow-hidden border border-gray-200 hover:opacity-90 transition-opacity"
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </section>
            )}

            {ann.files.length > 0 && (
              <section className="pt-2 border-t border-gray-100 space-y-2">
                <p className="text-xs font-bold text-gray-500 flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5" /> 첨부파일 {ann.files.length}개
                </p>
                {ann.files.map((f, i) => (
                  <a
                    key={i}
                    href={f.data}
                    download={f.name}
                    className="flex items-center gap-3 px-3.5 py-2.5 bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <Paperclip className="w-4 h-4 text-gray-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">{f.name}</p>
                      <p className="text-[10px] text-gray-400">{f.size}</p>
                    </div>
                    <Download className="w-4 h-4 text-primary-500 shrink-0" />
                  </a>
                ))}
              </section>
            )}

            {/* 댓글 — 허용된 경우만 */}
            {allowComments && (
              <section className="pt-2 border-t border-gray-100 space-y-4">
                <h3 className="text-xs font-bold text-gray-500 flex items-center gap-1">
                  <MessageCircle className="w-3.5 h-3.5" /> 댓글 {commentCount.toLocaleString('ko-KR')}
                </h3>

                <div className="space-y-0 max-h-72 overflow-y-auto divide-y divide-gray-100">
                  {comments.length === 0 ? (
                    <p className="text-xs text-gray-400 py-2">아직 댓글이 없습니다.</p>
                  ) : (
                    comments.map(c => {
                      const graceC = toGraceComment(c);
                      const resolvedAuthorId = resolveCommentAuthorId(graceC, {
                        allowSeedNameLookup: true,
                      });
                      const canManageComment = Boolean(
                        isAdmin || (user?.id && resolvedAuthorId && resolvedAuthorId === user.id),
                      );
                      const isEditing = editingCommentId === c.id;

                      return (
                        <div key={c.id}>
                          {isEditing ? (
                            <div className="py-2.5 space-y-2">
                              <textarea
                                value={editCommentText}
                                onChange={e => setEditCommentText(e.target.value.slice(0, ANNOUNCEMENT_COMMENT_MAX_LENGTH))}
                                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary-400 bg-gray-50 min-h-[72px] resize-y"
                              />
                              <div className="flex gap-2 justify-end">
                                <button
                                  type="button"
                                  onClick={() => { setEditingCommentId(null); setEditCommentText(''); }}
                                  className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 rounded-xl"
                                >
                                  취소
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditComment(c.id)}
                                  disabled={!editCommentText.trim()}
                                  className="px-3 py-1.5 text-xs font-semibold text-white bg-primary-600 rounded-xl disabled:opacity-40"
                                >
                                  저장
                                </button>
                              </div>
                            </div>
                          ) : (
                            <GracePrayerCommentItem
                              comment={graceC}
                              relatedOrganizationIds={relatedOrganizationIds}
                              deleteButton={canManageComment ? (
                                <div className="flex items-center gap-0.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingCommentId(c.id);
                                      setEditCommentText(c.content);
                                    }}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 touch-target"
                                    aria-label="댓글 수정"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeleteCommentId(c.id)}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 touch-target"
                                    aria-label="댓글 삭제"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : undefined}
                            />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* PC 댓글 입력 — 모바일은 footer */}
                {!isMobile && (
                  <div className="flex gap-2">
                    <input
                      value={commentText}
                      onChange={e => setCommentText(e.target.value.slice(0, ANNOUNCEMENT_COMMENT_MAX_LENGTH))}
                      placeholder="댓글을 입력하세요."
                      className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary-400 bg-gray-50 min-h-[48px]"
                      onKeyDown={e => { if (e.key === 'Enter') handleComment(); }}
                      disabled={commentSubmitting}
                    />
                    <button
                      type="button"
                      onClick={handleComment}
                      disabled={!commentText.trim() || commentSubmitting}
                      className="px-4 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl disabled:opacity-40 touch-target min-h-[48px]"
                    >
                      등록
                    </button>
                  </div>
                )}
              </section>
            )}
          </div>
        </article>
      </MobileFullScreenPage>
    </>
  );
}

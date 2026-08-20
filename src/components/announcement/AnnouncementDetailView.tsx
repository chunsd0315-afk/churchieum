/**
 * 공지사항 상세 — 은혜와 기도 GraceNoteDetailView 와 동일한
 * MobileFullScreenPage + 카드 레이아웃 UX
 */

import { useEffect, useMemo, useState } from 'react';
import {
  Download, ImageIcon, Paperclip, Pin, Star, Trash2, Edit3, X,
} from 'lucide-react';
import {
  deleteAnnouncement,
  getAllAnnouncements,
  type Announcement,
} from '../../services/announcementStorage';
import { buildNoticeScopeBadges } from '../../services/announcementHelpers';
import { MobileFullScreenPage } from '../layout/ContentEditorLayout';
import { ChurchDropdownMenu } from '../common/ui';

function formatDisplayDate(date: string): string {
  if (!date) return '';
  return date.replace(/-/g, '.');
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
  const [ann, setAnn] = useState<Announcement | null>(() =>
    getAllAnnouncements().find(a => a.id === announcementId) ?? null,
  );
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  useEffect(() => {
    setAnn(getAllAnnouncements().find(a => a.id === announcementId) ?? null);
  }, [announcementId]);

  const scopeBadges = useMemo(
    () => (ann ? buildNoticeScopeBadges(ann) : []),
    [ann],
  );

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

  const handleDelete = () => {
    deleteAnnouncement(ann.id);
    setConfirmDelete(false);
    onDelete();
  };

  const headerActions = canManage ? (
    <ChurchDropdownMenu
      ariaLabel="공지 메뉴"
      items={[
        {
          label: '수정',
          icon: <Edit3 className="w-4 h-4" />,
          onClick: onEdit,
        },
        {
          label: '삭제',
          icon: <Trash2 className="w-4 h-4" />,
          danger: true,
          onClick: () => setConfirmDelete(true),
        },
      ]}
    />
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

            {/* 제목 */}
            <h2 className="text-xl font-bold text-gray-900 leading-snug">{ann.title}</h2>

            {/* 작성자 · 날짜 */}
            <p className="text-[13px] font-medium text-gray-500">
              작성자 {ann.author} · {formatDisplayDate(ann.date)}
            </p>

            {/* 대표 이미지 */}
            {ann.images.length > 0 && (
              <button
                type="button"
                className="w-full overflow-hidden rounded-[16px] bg-gray-100 cursor-pointer"
                style={{ aspectRatio: '16/7' }}
                onClick={() => setLightboxImg(ann.images[0])}
              >
                <img
                  src={ann.images[0]}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
            )}

            {/* 본문 */}
            <section>
              <p className="text-[15px] text-gray-800 leading-relaxed whitespace-pre-wrap">
                {ann.content}
              </p>
            </section>

            {/* 추가 이미지 */}
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

            {/* 첨부파일 */}
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
          </div>
        </article>
      </MobileFullScreenPage>
    </>
  );
}

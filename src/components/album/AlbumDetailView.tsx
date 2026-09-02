/**
 * 앨범 상세 — 공지·주보와 동일한 전체 페이지 UX + 사진 Grid + Lightbox
 */

import { useCallback, useEffect, useState } from 'react';
import {
  Calendar, ChevronLeft, ChevronRight, Download, Edit3, Image, Loader2,
  Play, Trash2, X, ZoomIn,
} from 'lucide-react';
import { MobileFullScreenPage } from '../layout/ContentEditorLayout';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import type { AlbumItem, AlbumPhoto } from '../../services/albumHelpers';
import {
  formatAlbumDate,
  formatAuthorLine,
  getAlbumScopeBadge,
  isVideoUrl,
} from '../../services/albumHelpers';

type Props = {
  album: AlbumItem;
  photos: AlbumPhoto[];
  photosLoading: boolean;
  canManage: boolean;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function AlbumDetailView({
  album,
  photos,
  photosLoading,
  canManage,
  onBack,
  onEdit,
  onDelete,
}: Props) {
  const { isMobile } = useBreakpoint();
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const imagePhotos = photos.filter(p => !isVideoUrl(p.url));
  const videoPhotos = photos.filter(p => isVideoUrl(p.url));

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (lightboxIdx === null) return;
      if (e.key === 'ArrowRight') {
        setLightboxIdx(i => (i !== null ? Math.min(i + 1, imagePhotos.length - 1) : 0));
      }
      if (e.key === 'ArrowLeft') {
        setLightboxIdx(i => (i !== null ? Math.max(i - 1, 0) : 0));
      }
      if (e.key === 'Escape') setLightboxIdx(null);
    },
    [lightboxIdx, imagePhotos.length],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const downloadPhoto = (url: string, idx: number) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `photo-${idx + 1}.jpg`;
    a.target = '_blank';
    a.click();
  };

  const actions = canManage ? (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={onEdit}
        className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 touch-target"
      >
        <Edit3 className="w-4 h-4" />
        {!isMobile && '수정'}
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 touch-target"
      >
        <Trash2 className="w-4 h-4" />
        {!isMobile && '삭제'}
      </button>
    </div>
  ) : undefined;

  if (lightboxIdx !== null && imagePhotos[lightboxIdx]) {
    const photo = imagePhotos[lightboxIdx];
    const hasPrev = lightboxIdx > 0;
    const hasNext = lightboxIdx < imagePhotos.length - 1;

    return (
      <div className="fixed inset-0 bg-black z-[200] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 bg-black/60 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setLightboxIdx(null)}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors touch-target"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
          <p className="text-white/60 text-sm">
            {lightboxIdx + 1} / {imagePhotos.length}
          </p>
          <button
            type="button"
            onClick={() => downloadPhoto(photo.url, lightboxIdx)}
            className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors touch-target"
            aria-label="다운로드"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center relative px-12 py-4">
          <button
            type="button"
            onClick={() => hasPrev && setLightboxIdx(lightboxIdx - 1)}
            className={`absolute left-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all touch-target ${
              !hasPrev ? 'opacity-0 pointer-events-none' : ''
            }`}
            aria-label="이전"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <img
            src={photo.url}
            alt={photo.caption || ''}
            className="max-w-full max-h-full object-contain rounded-xl select-none"
            style={{ maxHeight: 'calc(100vh - 140px)' }}
          />
          <button
            type="button"
            onClick={() => hasNext && setLightboxIdx(lightboxIdx + 1)}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all touch-target ${
              !hasNext ? 'opacity-0 pointer-events-none' : ''
            }`}
            aria-label="다음"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {photo.caption && (
          <div className="bg-black/60 backdrop-blur-sm px-4 py-3 text-center">
            <p className="text-white/80 text-sm">{photo.caption}</p>
          </div>
        )}
      </div>
    );
  }

  const dateLabel = formatAlbumDate(album.event_date || album.created_at);

  return (
    <MobileFullScreenPage
      title={album.title}
      description={`${formatAuthorLine(album)} · ${dateLabel}`}
      onBack={onBack}
      saveButton={actions}
    >
      <div className="space-y-5 max-w-[900px] mx-auto pb-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary-50 text-primary-800 border border-primary-100">
            {getAlbumScopeBadge(album)}
          </span>
          {album.category && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
              {album.category}
            </span>
          )}
        </div>

        {album.description && (
          <p className="text-sm text-gray-600 leading-relaxed">{album.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {dateLabel}
          </span>
          <span className="flex items-center gap-1">
            <Image className="w-3.5 h-3.5" />
            사진 {album.photo_count ?? photos.length}장
          </span>
          {(album.video_count ?? videoPhotos.length) > 0 && (
            <span className="flex items-center gap-1">
              <Play className="w-3.5 h-3.5" />
              동영상 {album.video_count ?? videoPhotos.length}개
            </span>
          )}
        </div>

        {photosLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-7 h-7 animate-spin text-primary-400" />
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-[24px] border border-gray-100">
            <Image className="w-14 h-14 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">사진이 없습니다</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {photos.map((photo, idx) => {
              const isVideo = isVideoUrl(photo.url);
              const imageIdx = isVideo ? -1 : imagePhotos.findIndex(p => p.id === photo.id);

              return (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => {
                    if (!isVideo && imageIdx >= 0) setLightboxIdx(imageIdx);
                  }}
                  className="relative aspect-square rounded-xl overflow-hidden group bg-gray-100"
                >
                  {isVideo ? (
                    <>
                      <video
                        src={photo.url}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <Play className="w-10 h-10 text-white fill-white" />
                      </div>
                    </>
                  ) : (
                    <>
                      <img
                        src={photo.url}
                        alt={photo.caption || ''}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors flex items-center justify-center">
                        <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-80 transition-opacity" />
                      </div>
                    </>
                  )}
                  {photo.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5">
                      <p className="text-[10px] text-white truncate">{photo.caption}</p>
                    </div>
                  )}
                  {!isVideo && (
                    <span className="sr-only">{idx + 1}번째 사진</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </MobileFullScreenPage>
  );
}

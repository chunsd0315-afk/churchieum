/**
 * 앨범 카드 Grid / 목록보기
 */

import { Camera, Edit3, Play, Trash2 } from 'lucide-react';
import {
  ChurchDropdownMenu,
  CONTENT_CARD_CLASS,
  type ChurchDropdownItem,
} from '../common/ui';
import type { AlbumItem } from '../../services/albumHelpers';
import {
  formatAlbumDate,
  formatAuthorLine,
  getAlbumScopeBadge,
} from '../../services/albumHelpers';

type CardProps = {
  album: AlbumItem;
  canManage: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

function MediaBadges({ album }: { album: AlbumItem }) {
  const photoCount = album.photo_count ?? 0;
  const videoCount = album.video_count ?? 0;
  if (photoCount === 0 && videoCount === 0) return null;

  return (
    <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
      {videoCount > 0 && (
        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-black/55 text-white text-[11px] font-semibold backdrop-blur-sm">
          <Play className="w-3 h-3 fill-white" />
          {videoCount}
        </span>
      )}
      {photoCount > 0 && (
        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-black/55 text-white text-[11px] font-semibold backdrop-blur-sm">
          <Camera className="w-3 h-3" />
          {photoCount}
        </span>
      )}
    </div>
  );
}

function AlbumMenu({
  canManage,
  onEdit,
  onDelete,
}: {
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  if (!canManage) return null;

  const items: ChurchDropdownItem[] = [
    { label: '수정', icon: <Edit3 className="w-4 h-4" />, onClick: onEdit },
    { label: '삭제', icon: <Trash2 className="w-4 h-4" />, danger: true, onClick: onDelete },
  ];

  return (
    <div onClick={e => e.stopPropagation()}>
      <ChurchDropdownMenu items={items} layer="belowPlayer" ariaLabel="앨범 메뉴" />
    </div>
  );
}

export function AlbumGridCard({ album, canManage, onOpen, onEdit, onDelete }: CardProps) {
  const badge = getAlbumScopeBadge(album);
  const dateLabel = formatAlbumDate(album.event_date || album.created_at);

  return (
    <article className={CONTENT_CARD_CLASS}>
      <button
        type="button"
        onClick={onOpen}
        className="w-full text-left"
      >
        <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
          {album.cover_image ? (
            <img
              src={album.cover_image}
              alt={album.title}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200 ease-out"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-primary-50 to-primary-100">
              <Camera className="w-10 h-10 text-primary-200" />
            </div>
          )}
          <MediaBadges album={album} />
        </div>
      </button>

      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 shrink-0">
            {badge}
          </span>
          <AlbumMenu canManage={canManage} onEdit={onEdit} onDelete={onDelete} />
        </div>

        <button type="button" onClick={onOpen} className="w-full text-left">
          <h3 className="font-bold text-gray-900 text-sm line-clamp-2 group-hover:text-primary-800 transition-colors">
            {album.title}
          </h3>
          <p className="text-xs text-gray-500 mt-1.5">{formatAuthorLine(album)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{dateLabel}</p>
        </button>
      </div>
    </article>
  );
}

export function AlbumListRow({ album, canManage, onOpen, onEdit, onDelete }: CardProps) {
  const badge = getAlbumScopeBadge(album);
  const dateLabel = formatAlbumDate(album.event_date || album.created_at);
  const photoCount = album.photo_count ?? 0;

  return (
    <div className="flex items-center gap-3 py-3 group">
      <button
        type="button"
        onClick={onOpen}
        className="relative w-[72px] h-[72px] shrink-0 rounded-xl overflow-hidden bg-gray-100 touch-target"
      >
        {album.cover_image ? (
          <img src={album.cover_image} alt={album.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
            <Camera className="w-7 h-7 text-primary-200" />
          </div>
        )}
        {(album.video_count ?? 0) > 0 && (
          <span className="absolute bottom-1 right-1 p-0.5 rounded bg-black/55">
            <Play className="w-3 h-3 text-white fill-white" />
          </span>
        )}
      </button>

      <button type="button" onClick={onOpen} className="flex-1 min-w-0 text-left touch-target">
        <h4 className="font-semibold text-gray-900 text-sm truncate">{album.title}</h4>
        <p className="text-xs text-gray-500 mt-0.5">{badge}</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {formatAuthorLine(album)} · {dateLabel}
        </p>
        {photoCount > 0 && (
          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
            <Camera className="w-3 h-3" />
            사진 {photoCount}
          </p>
        )}
      </button>

      <AlbumMenu canManage={canManage} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}

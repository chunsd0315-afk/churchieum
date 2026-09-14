/**
 * 교회나눔 카드 / 목록 아이템
 */

import {
  MessageSquare, Users,
} from 'lucide-react';
import { ChurchDropdownMenu, type ChurchDropdownItem } from '../common/ui/ChurchDropdownMenu';
import { CONTENT_CARD_CLASS } from '../common/ui/ContentListToolbar';
import type { SharingPost } from '../../services/sharingStorage';
import { TYPE_LABELS, STATUS_LABELS } from '../../services/sharingStorage';
import {
  TYPE_COLORS,
  STATUS_COLORS,
  formatSharingDate,
} from '../../services/sharingHelpers';

type ItemProps = {
  post: SharingPost;
  requestCount: number;
  messageCount: number;
  canManage: boolean;
  onOpen: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

function PostMenu({ canManage, onEdit, onDelete }: {
  canManage: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  if (!canManage || !onEdit) return null;
  const items: ChurchDropdownItem[] = [
    { label: '수정', onClick: onEdit },
    ...(onDelete ? [{ label: '삭제', danger: true, onClick: onDelete }] : []),
  ];
  return (
    <div onClick={e => e.stopPropagation()}>
      <ChurchDropdownMenu items={items} layer="belowPlayer" ariaLabel="나눔 메뉴" />
    </div>
  );
}

function SharingImagePlaceholder({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const iconClass = size === 'lg' ? 'w-16 h-16' : size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{ background: '#FFF9F2' }}
    >
      <img
        src="/icons/3d/sharing.webp"
        alt=""
        className={`${iconClass} object-contain opacity-90`}
        draggable={false}
      />
    </div>
  );
}

function Thumbnail({ post, className = 'w-full h-full' }: { post: SharingPost; className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background: '#FFF9F2' }}>
      {post.images[0] ? (
        <img
          src={post.images[0]}
          alt={post.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <SharingImagePlaceholder size="md" />
      )}
      <span className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${STATUS_COLORS[post.status]}`}>
        {STATUS_LABELS[post.status]}
      </span>
    </div>
  );
}

function MetaLine({ post, requestCount, messageCount }: {
  post: SharingPost;
  requestCount: number;
  messageCount: number;
}) {
  return (
    <>
      <p className="text-xs text-gray-500 font-medium mt-1">{post.churchName}</p>
      <div className="flex items-center gap-1 text-[11px] text-gray-400 flex-wrap mt-0.5">
        <span>{post.location}</span>
        <span>·</span>
        <span>{post.category}</span>
        <span>·</span>
        <span>{formatSharingDate(post.createdAt)}</span>
      </div>
      <div className="flex items-center gap-2.5 mt-1.5 text-[11px] text-gray-400">
        <span className="flex items-center gap-1"><Users className="w-3 h-3" />신청 {requestCount}</span>
        <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />문의 {messageCount}</span>
      </div>
    </>
  );
}

export function SharingListRow({
  post, requestCount, messageCount, canManage, onOpen, onEdit, onDelete,
}: ItemProps) {
  return (
    <div className="flex items-stretch gap-3 py-3 group">
      <button
        type="button"
        onClick={onOpen}
        className="relative w-[72px] h-[72px] rounded-xl overflow-hidden shrink-0 touch-target"
      >
        <Thumbnail post={post} />
      </button>
      <button type="button" onClick={onOpen} className="flex-1 min-w-0 text-left touch-target">
        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${STATUS_COLORS[post.status]}`}>
            {STATUS_LABELS[post.status]}
          </span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${TYPE_COLORS[post.type]}`}>
            {TYPE_LABELS[post.type]}
          </span>
        </div>
        <p className="font-bold text-sm text-gray-900 leading-tight line-clamp-2">{post.title}</p>
        <MetaLine post={post} requestCount={requestCount} messageCount={messageCount} />
      </button>
      <PostMenu canManage={canManage} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}

export function SharingGridCard({
  post, requestCount, messageCount, canManage, onOpen, onEdit, onDelete,
}: ItemProps) {
  return (
    <article className={CONTENT_CARD_CLASS}>
      <button type="button" onClick={onOpen} className="w-full text-left">
        <div className="relative aspect-[4/3]">
          <Thumbnail post={post} />
        </div>
      </button>
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${STATUS_COLORS[post.status]}`}>
              {STATUS_LABELS[post.status]}
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${TYPE_COLORS[post.type]}`}>
              {TYPE_LABELS[post.type]}
            </span>
          </div>
          <PostMenu canManage={canManage} onEdit={onEdit} onDelete={onDelete} />
        </div>
        <button type="button" onClick={onOpen} className="w-full text-left">
          <h3 className="font-bold text-sm text-gray-900 line-clamp-2">{post.title}</h3>
          <MetaLine post={post} requestCount={requestCount} messageCount={messageCount} />
        </button>
      </div>
    </article>
  );
}

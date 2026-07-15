import { useState, useEffect } from 'react';
import {
  BookOpen, Calendar, Play, Youtube, Heart, Share2, Bookmark,
  MessageCircle, Send, Pencil, Trash2, Eye,
} from 'lucide-react';
import type { Sermon } from '../../../types/sermon';
import { WORSHIP_TYPE_LABELS } from '../../../types/sermon';
import type { AppUser } from '../../../services/permissions';
import { incrementSermonView } from '../../../services/sermonStorage';
import { getCommentsForSermon, addSermonComment } from '../../../services/sermonCommentStorage';
import { isSermonLiked, toggleSermonLike, getLikeCountForSermon } from '../../../services/sermonEngagementStorage';
import { saveScriptureFromSermon } from '../../../services/sermonHelpers';
import { ChurchDropdownMenu } from '../ui';
import { SermonYoutubeThumb, formatSermonDate } from './sermonUiUtils';
import { SermonCard, SermonSectionCard, sermonInputClass, sermonPrimaryBtnClass } from './sermonDesign';

type Props = {
  sermon: Sermon;
  user: AppUser | null;
  canManage: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  renderExtraActions?: (sermon: Sermon) => React.ReactNode;
};

export default function SermonDetail({
  sermon, user, canManage, onEdit, onDelete, renderExtraActions,
}: Props) {
  const [playing, setPlaying] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(sermon.likeCount);
  const [comments, setComments] = useState(() => getCommentsForSermon(sermon.id));
  const [draft, setDraft] = useState('');
  const [savedScripture, setSavedScripture] = useState(false);
  const [shareMsg, setShareMsg] = useState('');
  const ytId = sermon.youtubeVideoId;

  useEffect(() => {
    incrementSermonView(sermon.id);
    setPlaying(false);
    setComments(getCommentsForSermon(sermon.id));
    setLikeCount(Math.max(sermon.likeCount, getLikeCountForSermon(sermon.id)));
    setLiked(user ? isSermonLiked(sermon.id, user.id) : false);
    setSavedScripture(false);
    setShareMsg('');
  }, [sermon.id, user?.id]);

  const handleLike = () => {
    if (!user) return;
    setLiked(toggleSermonLike(sermon.id, user.id));
    setLikeCount(getLikeCountForSermon(sermon.id));
  };

  const handleShare = async () => {
    const text = `${sermon.title} — ${sermon.scripture}\n${sermon.preacher} · ${sermon.sermonDate}`;
    try {
      if (navigator.share) await navigator.share({ title: sermon.title, text });
      else {
        await navigator.clipboard.writeText(text);
        setShareMsg('복사되었습니다');
        setTimeout(() => setShareMsg(''), 2000);
      }
    } catch { /* ignore */ }
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !user) return;
    addSermonComment({ sermonId: sermon.id, authorId: user.id, authorName: user.name, content: text });
    setComments(getCommentsForSermon(sermon.id));
    setDraft('');
  };

  return (
    <div className="space-y-5">
      {/* 영상 + 메타 */}
      <SermonCard className="overflow-hidden">
        <div className="relative w-full aspect-video bg-gray-900">
          {playing && ytId ? (
            <iframe
              src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`}
              className="w-full h-full"
              title={sermon.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : ytId ? (
            <>
              <SermonYoutubeThumb videoId={ytId} title={sermon.title} className="w-full h-full" />
              <button type="button" onClick={() => setPlaying(true)}
                className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <div className="w-[72px] h-[72px] rounded-full bg-red-600/95 flex items-center justify-center shadow-xl">
                  <Play className="w-9 h-9 text-white fill-white ml-1" />
                </div>
              </button>
              <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 bg-black/60 rounded-xl">
                <Youtube className="w-4 h-4 text-red-400" />
                <span className="text-xs text-white font-bold">YouTube</span>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-600">
              <BookOpen className="w-20 h-20 text-white/30" />
            </div>
          )}
        </div>

        <div className="p-5 md:p-7 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-3">
              <h2 className="text-2xl font-extrabold text-gray-900 leading-snug">{sermon.title}</h2>
              {sermon.scripture && (
                <span className="inline-flex items-center gap-2 px-3 py-2 bg-primary-50 text-primary-700 rounded-xl text-[15px] font-bold">
                  <BookOpen className="w-4 h-4 shrink-0" />
                  {sermon.scripture}
                </span>
              )}
              <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-4 text-[15px] text-[#6B7280]">
                <span className="font-bold text-gray-800">{sermon.preacher}</span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {formatSermonDate(sermon.sermonDate)}
                </span>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold w-fit">
                  {WORSHIP_TYPE_LABELS[sermon.worshipType]}
                </span>
                <span className="flex items-center gap-1 text-sm">
                  <Eye className="w-4 h-4" />조회 {sermon.viewCount + 1}
                </span>
              </div>
            </div>
            {canManage && onEdit && onDelete && (
              <ChurchDropdownMenu
                ariaLabel="설교 관리 메뉴"
                items={[
                  {
                    label: '수정하기',
                    icon: <Pencil style={{ width: '15px', height: '15px' }} />,
                    onClick: onEdit,
                  },
                  {
                    label: '삭제하기',
                    icon: <Trash2 style={{ width: '15px', height: '15px' }} />,
                    danger: true,
                    onClick: onDelete,
                  },
                ]}
              />
            )}
          </div>

          {sermon.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {sermon.tags.map(tag => (
                <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <button type="button" onClick={handleLike} disabled={!user}
              className={`flex items-center justify-center gap-2 h-12 rounded-[14px] text-[15px] font-bold transition-colors ${
                liked ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-[#F7F9FB] text-gray-700 border border-[#E5E7EB] hover:bg-gray-100'
              }`}>
              <Heart className={`w-5 h-5 ${liked ? 'fill-red-500' : ''}`} />
              좋아요 {likeCount}
            </button>
            <button type="button" onClick={() => { saveScriptureFromSermon(sermon.scripture, sermon.title); setSavedScripture(true); }}
              disabled={!sermon.scripture}
              className={`flex items-center justify-center gap-2 h-12 rounded-[14px] text-[15px] font-bold transition-colors ${
                savedScripture ? 'bg-amber-50 text-amber-800 border border-amber-100' : 'bg-[#F7F9FB] text-gray-700 border border-[#E5E7EB] hover:bg-gray-100'
              }`}>
              <Bookmark className="w-5 h-5" />
              {savedScripture ? '저장됨' : '말씀 저장'}
            </button>
            <button type="button" onClick={handleShare}
              className="flex items-center justify-center gap-2 h-12 rounded-[14px] bg-[#F7F9FB] text-gray-700 border border-[#E5E7EB] hover:bg-gray-100 text-[15px] font-bold">
              <Share2 className="w-5 h-5" />
              공유
            </button>
          </div>
          {shareMsg && <p className="text-sm text-center text-primary-600 font-medium">{shareMsg}</p>}
          {renderExtraActions && <div className="pt-2">{renderExtraActions(sermon)}</div>}
        </div>
      </SermonCard>

      <SermonSectionCard title={`댓글 (${comments.length})`} icon={<MessageCircle className="w-5 h-5 text-primary-600" />}>
        {comments.length === 0 ? (
          <p className="text-[15px] text-[#6B7280] text-center py-8 bg-[#F7F9FB] rounded-[14px]">
            첫 댓글을 남겨 보세요.
          </p>
        ) : (
          <ul className="space-y-3 mb-5">
            {comments.map(c => (
              <li key={c.id} className="bg-[#F7F9FB] border border-[#E5E7EB] rounded-[14px] px-4 py-4">
                <p className="text-sm font-bold text-gray-900">{c.authorName}</p>
                <p className="text-[15px] text-gray-700 mt-1.5 leading-relaxed">{c.content}</p>
              </li>
            ))}
          </ul>
        )}
        {user && (
          <form onSubmit={handleComment} className="flex flex-col sm:flex-row gap-3">
            <input
              value={draft}
              onChange={e => setDraft(e.target.value)}
              placeholder="은혜 나눔을 남겨 주세요"
              className={`${sermonInputClass} flex-1`}
            />
            <button type="submit" disabled={!draft.trim()} className={`${sermonPrimaryBtnClass} sm:shrink-0`}>
              <Send className="w-5 h-5" />
              등록
            </button>
          </form>
        )}
      </SermonSectionCard>
    </div>
  );
}

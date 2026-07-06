import { useState, useEffect } from 'react';
import {
  BookOpen, Calendar, Play, Youtube, Heart, Share2, Bookmark,
  MessageCircle, Send, Paperclip, Edit3, Trash2, Eye,
} from 'lucide-react';
import type { Sermon } from '../../types/sermon';
import { WORSHIP_TYPE_LABELS } from '../../types/sermon';
import type { AppUser } from '../../lib/permissions';
import { incrementSermonView } from '../../lib/sermonStorage';
import {
  getCommentsForSermon, addSermonComment,
} from '../../lib/sermonCommentStorage';
import {
  isSermonLiked, toggleSermonLike, getLikeCountForSermon,
} from '../../lib/sermonEngagementStorage';
import { saveScriptureFromSermon } from '../../lib/sermonHelpers';
import { SermonYoutubeThumb, formatSermonDate } from './sermonUiUtils';

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
    const nowLiked = toggleSermonLike(sermon.id, user.id);
    setLiked(nowLiked);
    setLikeCount(getLikeCountForSermon(sermon.id));
  };

  const handleShare = async () => {
    const text = `${sermon.title} — ${sermon.scripture}\n${sermon.preacher} · ${sermon.sermonDate}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: sermon.title, text });
      } else {
        await navigator.clipboard.writeText(text);
        setShareMsg('링크가 복사되었습니다');
        setTimeout(() => setShareMsg(''), 2000);
      }
    } catch { /* ignore */ }
  };

  const handleSaveScripture = () => {
    saveScriptureFromSermon(sermon.scripture, sermon.title);
    setSavedScripture(true);
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !user) return;
    addSermonComment({
      sermonId: sermon.id,
      authorId: user.id,
      authorName: user.name,
      content: text,
    });
    setComments(getCommentsForSermon(sermon.id));
    setDraft('');
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm">
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
              <button
                type="button"
                onClick={() => setPlaying(true)}
                className="absolute inset-0 bg-black/30 flex items-center justify-center"
              >
                <div className="w-16 h-16 rounded-full bg-red-600/90 flex items-center justify-center shadow-xl">
                  <Play className="w-8 h-8 text-white fill-white ml-1" />
                </div>
              </button>
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-black/60 rounded-lg">
                <Youtube className="w-4 h-4 text-red-400" />
                <span className="text-xs text-white font-semibold">YouTube</span>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-500 to-secondary-500">
              <BookOpen className="w-16 h-16 text-white opacity-30" />
            </div>
          )}
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold text-gray-900 leading-snug">{sermon.title}</h2>
              {sermon.scripture && (
                <p className="text-base text-primary-600 mt-2 flex items-center gap-2 font-medium">
                  <BookOpen className="w-4 h-4 shrink-0" />
                  {sermon.scripture}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-3 text-sm text-gray-500">
                <span className="font-semibold text-gray-700">{sermon.preacher}</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatSermonDate(sermon.sermonDate)}
                </span>
                <span className="px-2.5 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-semibold">
                  {WORSHIP_TYPE_LABELS[sermon.worshipType]}
                </span>
                <span className="flex items-center gap-1 text-gray-400">
                  <Eye className="w-4 h-4" />{sermon.viewCount + 1}
                </span>
              </div>
            </div>
            {canManage && (
              <div className="flex gap-1 shrink-0">
                <button type="button" onClick={onEdit}
                  className="p-2.5 hover:bg-primary-50 text-primary-600 rounded-xl">
                  <Edit3 className="w-5 h-5" />
                </button>
                <button type="button" onClick={onDelete}
                  className="p-2.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {sermon.summary && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl">
              <p className="text-xs font-bold text-gray-500 mb-2">설교 요약</p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{sermon.summary}</p>
            </div>
          )}

          {sermon.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {sermon.tags.map(tag => (
                <span key={tag} className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 mt-4">
            <button type="button" onClick={handleLike} disabled={!user}
              className={`flex flex-col items-center gap-1 py-3 rounded-xl text-sm font-semibold transition-colors ${
                liked ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}>
              <Heart className={`w-5 h-5 ${liked ? 'fill-red-500' : ''}`} />
              좋아요 {likeCount}
            </button>
            <button type="button" onClick={handleSaveScripture} disabled={!sermon.scripture}
              className={`flex flex-col items-center gap-1 py-3 rounded-xl text-sm font-semibold transition-colors ${
                savedScripture ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}>
              <Bookmark className="w-5 h-5" />
              {savedScripture ? '저장됨' : '말씀 저장'}
            </button>
            <button type="button" onClick={handleShare}
              className="flex flex-col items-center gap-1 py-3 rounded-xl bg-gray-50 text-gray-600 hover:bg-gray-100 text-sm font-semibold">
              <Share2 className="w-5 h-5" />
              공유
            </button>
          </div>
          {shareMsg && <p className="text-xs text-center text-primary-600 mt-2">{shareMsg}</p>}

          {renderExtraActions && <div className="mt-4">{renderExtraActions(sermon)}</div>}
        </div>
      </div>

      {sermon.attachments.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-3">
            <Paperclip className="w-4 h-4" /> 설교 자료
          </p>
          <ul className="space-y-2">
            {sermon.attachments.map(att => (
              <li key={att.id}>
                <a href={att.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-700 hover:bg-gray-100">
                  <Paperclip className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="truncate font-medium">{att.name}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <p className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-3">
          <MessageCircle className="w-4 h-4" /> 댓글 ({comments.length})
        </p>
        {comments.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6 bg-gray-50 rounded-xl">
            첫 댓글을 남겨 보세요.
          </p>
        ) : (
          <ul className="space-y-3 mb-4">
            {comments.map(c => (
              <li key={c.id} className="bg-primary-50/50 rounded-xl px-4 py-3">
                <p className="text-sm font-semibold text-primary-800">{c.authorName}</p>
                <p className="text-sm text-gray-700 mt-1 leading-relaxed">{c.content}</p>
              </li>
            ))}
          </ul>
        )}
        {user && (
          <form onSubmit={handleComment} className="flex gap-2">
            <input
              value={draft}
              onChange={e => setDraft(e.target.value)}
              placeholder="은혜 나눔을 남겨 주세요"
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-primary-500 focus:outline-none"
            />
            <button type="submit" disabled={!draft.trim()}
              className="px-4 py-3 bg-primary-500 text-white rounded-xl disabled:opacity-50">
              <Send className="w-5 h-5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

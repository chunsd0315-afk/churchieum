import {
  BookOpen, Calendar, Eye, Heart, MessageCircle, Play, ChevronRight, Check,
} from 'lucide-react';
import type { Sermon } from '../../types/sermon';
import { WORSHIP_TYPE_LABELS } from '../../types/sermon';
import { getCommentCount } from '../../lib/sermonCommentStorage';
import { SermonYoutubeThumb } from './sermonUiUtils';

type Props = {
  sermon: Sermon;
  selected?: boolean;
  likeCount: number;
  onSelect: () => void;
};

export default function SermonListCard({ sermon, selected, likeCount, onSelect }: Props) {
  const commentCount = getCommentCount(sermon.id);
  const ytId = sermon.youtubeVideoId;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left rounded-2xl border overflow-hidden transition-all ${
        selected
          ? 'bg-primary-50 border-primary-200 border-l-4 border-l-primary-500 shadow-sm'
          : 'bg-white border-gray-100 hover:shadow-md'
      }`}
    >
      <div className="flex items-stretch min-h-[88px]">
        <div className="relative w-24 sm:w-28 shrink-0 bg-gray-100">
          {ytId ? (
            <>
              <SermonYoutubeThumb videoId={ytId} title={sermon.title} className="w-full h-full min-h-[88px]" />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <div className="w-7 h-7 rounded-full bg-red-600/85 flex items-center justify-center">
                  <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
                </div>
              </div>
            </>
          ) : (
            <div className="w-full h-full min-h-[88px] flex items-center justify-center bg-gradient-to-br from-primary-500 to-secondary-500">
              <BookOpen className="w-8 h-8 text-white opacity-50" />
            </div>
          )}
        </div>

        <div className="flex-1 px-3 py-3 min-w-0 flex flex-col justify-center">
          <p className={`font-bold text-base leading-snug line-clamp-2 ${selected ? 'text-primary-800' : 'text-gray-900'}`}>
            {sermon.title}
          </p>
          {sermon.scripture && (
            <p className="text-sm text-primary-600 mt-1 truncate">{sermon.scripture}</p>
          )}
          <p className="text-sm text-gray-500 mt-1 truncate">{sermon.preacher}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap text-xs text-gray-400">
            <span className="flex items-center gap-0.5">
              <Calendar className="w-3.5 h-3.5" />
              {sermon.sermonDate}
            </span>
            <span className="px-2 py-0.5 bg-gray-100 rounded-full text-gray-600 font-medium">
              {WORSHIP_TYPE_LABELS[sermon.worshipType]}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
            <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{sermon.viewCount}</span>
            <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" />{likeCount}</span>
            <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" />{commentCount}</span>
          </div>
        </div>

        <div className="flex items-center pr-3 shrink-0">
          {selected ? (
            <Check className="w-5 h-5 text-primary-500" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-300" />
          )}
        </div>
      </div>
    </button>
  );
}

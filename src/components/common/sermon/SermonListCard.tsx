import {
  BookOpen, Calendar, Eye, Heart, MessageCircle, Play, ChevronRight,
} from 'lucide-react';
import type { Sermon } from '../../../types/sermon';
import { getCommentCount } from '../../../services/sermonCommentStorage';
import { SermonYoutubeThumb } from './sermonUiUtils';
import { SermonCard } from './sermonDesign';
import { useBreakpoint } from '../../../hooks/useBreakpoint';

type Props = {
  sermon: Sermon;
  selected?: boolean;
  likeCount: number;
  onSelect: () => void;
};

export default function SermonListCard({ sermon, selected, likeCount, onSelect }: Props) {
  const { isMobile } = useBreakpoint();
  const commentCount = getCommentCount(sermon.id);
  const ytId = sermon.youtubeVideoId;
  const thumbW = isMobile ? 96 : 120;
  const thumbH = isMobile ? 72 : 80;

  return (
    <button type="button" onClick={onSelect} className="w-full text-left group">
      <SermonCard
        hover={!selected}
        className={`overflow-hidden ${selected ? 'ring-2 ring-primary-500 ring-offset-2 ring-offset-[#F7F9FB]' : ''}`}
      >
        <div className="flex items-stretch p-3 md:p-4 gap-3 md:gap-4 min-h-[96px]">
          <div
            className="relative shrink-0 rounded-xl overflow-hidden bg-gray-100"
            style={{ width: thumbW, height: thumbH }}
          >
            {ytId ? (
              <>
                <SermonYoutubeThumb videoId={ytId} title={sermon.title} className="w-full h-full" />
                <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-red-600/90 flex items-center justify-center shadow-md">
                    <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-600">
                <BookOpen className="w-8 h-8 text-white/60" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5">
            <p className="text-[17px] font-extrabold text-gray-900 leading-snug line-clamp-2">
              {sermon.title}
            </p>
            {sermon.scripture && (
              <span className="inline-block mt-2 px-2.5 py-1 bg-primary-50 text-primary-700 rounded-lg text-[13px] font-semibold truncate max-w-full">
                {sermon.scripture}
              </span>
            )}
            <p className="text-[13px] text-gray-600 mt-2 font-medium truncate">{sermon.preacher}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[12px] text-[#6B7280]">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {sermon.sermonDate}
              </span>
              <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{sermon.viewCount}</span>
              <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" />{likeCount}</span>
              <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" />{commentCount}</span>
            </div>
          </div>

          <div className="flex items-center shrink-0 pr-1">
            <ChevronRight className={`w-5 h-5 transition-colors ${selected ? 'text-primary-600' : 'text-gray-300 group-hover:text-gray-400'}`} />
          </div>
        </div>
      </SermonCard>
    </button>
  );
}

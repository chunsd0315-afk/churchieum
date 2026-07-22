import {
  BookHeart, Heart, Megaphone, Image, Calendar, BookOpen,
  Book, BookMarked, Target, User, Church, HeartHandshake,
  ChevronRight, ChevronLeft, Play, Sparkles,
} from 'lucide-react';
import { useState, useRef } from 'react';
import type { Page } from './Layout';

type Props = { onNavigate: (page: Page) => void };

const BANNERS = [
  {
    id: '1',
    label: '오늘의 말씀',
    title: '여호와는 나의 목자시니 내게 부족함이 없으리로다',
    sub: '시편 23:1',
    bg: 'from-primary-500 via-primary-600 to-accent-500',
    icon: Book,
  },
  {
    id: '2',
    label: '담임목사 설교',
    title: '믿음의 출발',
    sub: '히브리서 11:1 · 김성기 목사',
    bg: 'from-secondary-500 via-secondary-600 to-primary-600',
    icon: Play,
  },
  {
    id: '3',
    label: '교회 공지사항',
    title: '2026년 하반기 교회 일정 안내',
    sub: '6월 23일 공지 · 전체 공지',
    bg: 'from-violet-500 via-violet-600 to-primary-600',
    icon: Megaphone,
  },
  {
    id: '4',
    label: '교회 행사 안내',
    title: '하계 수련회 참가 신청',
    sub: '7월 15일 ~ 17일 · 전교인 참여',
    bg: 'from-amber-500 via-orange-500 to-rose-500',
    icon: Calendar,
  },
];

type MenuItem = { id: Page; label: string; icon: React.ComponentType<{ className?: string }>; bg: string; iconColor: string };

const CARD_ROWS: MenuItem[][] = [
  [
    { id: 'sermon',               label: '설교',     icon: BookOpen,       bg: 'bg-blue-50',    iconColor: 'text-blue-500' },
    { id: 'announcement',         label: '공지사항', icon: Megaphone,      bg: 'bg-violet-50',  iconColor: 'text-violet-500' },
    { id: 'bible',                label: '성경',     icon: Book,           bg: 'bg-amber-50',   iconColor: 'text-amber-500' },
    { id: 'bible-reading-center', label: '성경통독', icon: Target,         bg: 'bg-green-50',   iconColor: 'text-green-500' },
  ],
  [
    { id: 'grace-notes',          label: '은혜와 기도', icon: BookHeart,      bg: 'bg-primary-50', iconColor: 'text-primary-500' },
    { id: 'bulletin',             label: '주보',     icon: BookMarked,     bg: 'bg-cyan-50',    iconColor: 'text-cyan-500' },
    { id: 'schedule',             label: '일정',     icon: Calendar,       bg: 'bg-emerald-50', iconColor: 'text-emerald-500' },
  ],
  [
    { id: 'album',                label: '앨범',     icon: Image,          bg: 'bg-pink-50',    iconColor: 'text-pink-500' },
    { id: 'sharing',              label: '교회나눔', icon: HeartHandshake, bg: 'bg-orange-50',  iconColor: 'text-orange-500' },
    { id: 'profile',              label: '내 정보',  icon: User,           bg: 'bg-gray-50',    iconColor: 'text-gray-500' },
    { id: 'church-info',          label: '교회정보', icon: Church,         bg: 'bg-teal-50',    iconColor: 'text-teal-500' },
  ],
];

export default function DesktopMemberHome({ onNavigate }: Props) {
  const [bannerIdx, setBannerIdx] = useState(0);
  const bannerTouch = useRef<number | null>(null);

  const banner = BANNERS[bannerIdx];
  const BannerIcon = banner.icon;

  return (
    <div className="px-6 py-6 space-y-6">
      {/* Slide Banner */}
      <div className="relative">
        <div
          className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${banner.bg} p-8 text-white shadow-xl min-h-[180px] flex items-center`}
          onTouchStart={e => { bannerTouch.current = e.touches[0].clientX; }}
          onTouchEnd={e => {
            if (bannerTouch.current === null) return;
            const diff = bannerTouch.current - e.changedTouches[0].clientX;
            if (diff > 50) setBannerIdx(i => Math.min(BANNERS.length - 1, i + 1));
            if (diff < -50) setBannerIdx(i => Math.max(0, i - 1));
            bannerTouch.current = null;
          }}
        >
          <div className="absolute top-0 right-0 w-56 h-56 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/3 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-40 h-40 bg-white/10 rounded-full translate-y-1/3 blur-2xl pointer-events-none" />

          <div className="relative z-10 flex items-center gap-8 w-full">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
              <BannerIcon className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 opacity-80" />
                <span className="text-sm font-medium opacity-90">{banner.label}</span>
              </div>
              <h2 className="text-2xl font-bold mb-1 leading-tight truncate">{banner.title}</h2>
              <p className="text-sm opacity-80">{banner.sub}</p>
            </div>
            <button className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white font-semibold px-5 py-3 rounded-xl text-sm transition-all shrink-0">
              자세히 보기 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Arrow controls */}
        <button
          onClick={() => setBannerIdx(i => Math.max(0, i - 1))}
          disabled={bannerIdx === 0}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors disabled:opacity-30"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <button
          onClick={() => setBannerIdx(i => Math.min(BANNERS.length - 1, i + 1))}
          disabled={bannerIdx === BANNERS.length - 1}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors disabled:opacity-30"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
          {BANNERS.map((_, i) => (
            <button
              key={i}
              onClick={() => setBannerIdx(i)}
              className={`rounded-full transition-all duration-300 ${
                i === bannerIdx ? 'w-5 h-2 bg-white' : 'w-2 h-2 bg-white/50 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Feature Card Rows */}
      <div className="space-y-4">
        {CARD_ROWS.map((row, rowIdx) => (
          <div key={rowIdx} className={`grid gap-4 ${row.length === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
            {row.map(item => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="group flex flex-col items-center gap-3 p-5 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
              >
                <div className={`w-14 h-14 ${item.bg} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                  <item.icon className={`w-7 h-7 ${item.iconColor}`} />
                </div>
                <span className="text-sm font-semibold text-gray-700 text-center">{item.label}</span>
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Ad / Banner placeholder */}
      <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 py-12 px-8 flex flex-col items-center justify-center gap-2">
        <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center mb-1">
          <Image className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-base font-medium text-gray-400">추후 광고 및 교회 소식 배너 영역</p>
        <p className="text-sm text-gray-300">광고, 교회 배너, 교단 소식, 선교 소식 등이 이 자리에 표시됩니다</p>
      </div>
    </div>
  );
}

import {
  User, Church, Bell, BookMarked, Calendar, Heart,
  ChevronRight, LayoutGrid, Sparkles, MapPin, Clock,
} from 'lucide-react';
import type { AppUser } from '../../../services/permissions';

// ─── Public types ─────────────────────────────────────────────────────────────

export type HomeMenuItem = {
  id: string;
  label: string;
  description?: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  bg: string;
  iconColor: string;
  onClick: () => void;
};

export type NoticeItem = {
  id: string;
  title: string;
  date: string;
  isPinned?: boolean;
  category?: string;
};

export type ScheduleItem = {
  id: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
};

export type PrayerItem = {
  id: string;
  title: string;
  authorName?: string;
  createdAt?: string;
};

export type HomeDashboardProps = {
  currentUser: AppUser | null;
  mode: 'admin' | 'pastor' | 'member';
  menuItems: HomeMenuItem[];
  recentNotices: NoticeItem[];
  todaySchedules: ScheduleItem[];
  prayerItems: PrayerItem[];
  churchName?: string;
  orgLabel?: string;
  dailyVerse?: { text: string; ref: string };
  onMenuClick?: (id: string) => void;
  onNoticesMore?: () => void;
  onSchedulesMore?: () => void;
  onPrayersMore?: () => void;
};

// ─── Design tokens ────────────────────────────────────────────────────────────

const CARD = 'church-card';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SectionHeader({
  icon: Icon,
  iconColor,
  title,
  onMore,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  title: string;
  onMore?: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
        <Icon className={`w-5 h-5 ${iconColor}`} />
        {title}
      </h3>
      {onMore && (
        <button
          onClick={onMore}
          className="text-sm text-primary-600 font-semibold flex items-center gap-0.5 hover:underline min-h-[44px] px-2"
        >
          전체보기 <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

function EmptyCard({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-3 text-gray-400">
      <LayoutGrid className="w-10 h-10 opacity-30" />
      <p className="text-base">{message}</p>
    </div>
  );
}

// ─── PC: Menu card grid (desktop only) ───────────────────────────────────────

function PCMenuCard({ item }: { item: HomeMenuItem }) {
  return (
    <button
      onClick={item.onClick}
      className="church-card-interactive text-left w-full"
    >
      <div className={`w-14 h-14 ${item.bg} rounded-[16px] flex items-center justify-center`} style={{ marginBottom: 16 }}>
        <item.icon className={item.iconColor} style={{ width: 26, height: 26 }} />
      </div>
      <p className="font-extrabold text-[#111827]" style={{ fontSize: 17, marginBottom: 8 }}>
        {item.label}
      </p>
      {item.description && (
        <p className="text-[#6B7280]" style={{ fontSize: 14, lineHeight: 1.5 }}>
          {item.description}
        </p>
      )}
    </button>
  );
}

function PCMenuGrid({ items }: { items: HomeMenuItem[] }) {
  return (
    <div className="church-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 }}>
      {items.map(item => <PCMenuCard key={item.id} item={item} />)}
    </div>
  );
}

// ─── Mobile sections ──────────────────────────────────────────────────────────

function ProfileSummarySection({
  currentUser,
  churchName,
  orgLabel,
}: {
  currentUser: AppUser | null;
  mode: HomeDashboardProps['mode'];
  churchName?: string;
  orgLabel?: string;
}) {
  const name = currentUser?.name ?? '성도';
  const position = currentUser?.position;
  const initial = name.charAt(0);

  return (
    <div className={`${CARD} flex items-center gap-4`}>
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center text-white text-xl font-bold shrink-0 shadow-sm">
        {initial}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-900 text-base truncate mb-0.5">{name}</p>
        {position && <p className="text-xs text-gray-500 truncate">{position}</p>}
        {churchName && <p className="text-xs text-gray-400 truncate">{churchName}</p>}
        {orgLabel && <p className="text-xs text-primary-600 font-medium truncate mt-0.5">{orgLabel}</p>}
      </div>
      <div className="shrink-0 w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center">
        <User className="w-4 h-4 text-gray-400" />
      </div>
    </div>
  );
}

function ChurchInfoSection({ churchName }: { churchName?: string }) {
  const name = churchName ?? '교회이음';
  return (
    <div className={`${CARD} flex items-center gap-4`}>
      <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
        <Church className="w-5 h-5 text-teal-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium text-gray-400 mb-0.5">소속 교회</p>
        <p className="font-bold text-gray-900 text-sm truncate">{name}</p>
      </div>
      <div className="text-[10px] text-teal-600 font-semibold bg-teal-50 px-2 py-1 rounded-lg shrink-0">
        교회이음
      </div>
    </div>
  );
}

function HomeMenuGrid({ items }: { items: HomeMenuItem[] }) {
  if (items.length === 0) {
    return <div className={CARD}><EmptyCard message="메뉴가 없습니다" /></div>;
  }
  return (
    <div className="grid grid-cols-3 gap-3 church-stagger">
      {items.map(item => (
        <button
          key={item.id}
          onClick={item.onClick}
          className="group flex flex-col items-center gap-2.5 p-4 church-card-interactive active:scale-[0.97]"
        >
          <div className={`w-14 h-14 ${item.bg} rounded-[16px] flex items-center justify-center group-hover:scale-105 transition-transform duration-200`}>
            <item.icon className={item.iconColor} style={{ width: 24, height: 24 }} />
          </div>
          <span className="text-sm font-semibold text-gray-700 leading-tight text-center">
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );
}

function RecentNoticeSection({ items, onMore }: { items: NoticeItem[]; onMore?: () => void }) {
  return (
    <div className={CARD}>
      <SectionHeader icon={Bell} iconColor="text-violet-500" title="최근 공지사항" onMore={onMore} />
      {items.length === 0 ? (
        <EmptyCard message="등록된 공지사항이 없습니다" />
      ) : (
        <div className="divide-y divide-gray-100">
          {items.map(notice => (
            <div key={notice.id} className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0">
              <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4 text-violet-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base text-gray-800 font-semibold truncate leading-snug">{notice.title}</p>
                <p className="text-sm text-gray-400 mt-1">{notice.date}</p>
              </div>
              {notice.isPinned && (
                <span className="shrink-0 text-xs font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded-lg">고정</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const DEFAULT_VERSE = { text: '여호와는 나의 목자시니 내게 부족함이 없으리로다', ref: '시편 23:1' };

function TodayVerseSection({ verse }: { verse?: { text: string; ref: string } }) {
  const v = verse ?? DEFAULT_VERSE;
  return (
    <div className="bg-gradient-to-br from-primary-500 to-accent-500 rounded-card p-6 text-white relative overflow-hidden shadow-md">
      <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 blur-xl pointer-events-none" />
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
            <BookMarked className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-medium opacity-90 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> 오늘의 말씀
          </span>
        </div>
        <p className="text-base font-semibold leading-relaxed mb-2">"{v.text}"</p>
        <p className="text-sm opacity-80 font-medium">— {v.ref}</p>
      </div>
    </div>
  );
}

function TodayScheduleSection({ items, onMore }: { items: ScheduleItem[]; onMore?: () => void }) {
  return (
    <div className={CARD}>
      <SectionHeader icon={Calendar} iconColor="text-emerald-500" title="다가오는 일정" onMore={onMore} />
      {items.length === 0 ? (
        <EmptyCard message="등록된 일정이 없습니다" />
      ) : (
        <div className="space-y-3">
          {items.map(ev => {
            const d = new Date(ev.date);
            const month = d.getMonth() + 1;
            const day = d.getDate();
            const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
            const weekday = weekdays[d.getDay()];
            return (
              <div key={ev.id} className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex flex-col items-center justify-center shrink-0">
                  <span className="text-xs font-medium text-emerald-600 leading-none">{month}월</span>
                  <span className="text-base font-bold text-emerald-700 leading-tight">{day}</span>
                  <span className="text-[10px] text-emerald-500 leading-none">{weekday}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-gray-800 truncate">{ev.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    {ev.time && (
                      <span className="flex items-center gap-1 text-sm text-gray-400">
                        <Clock className="w-3.5 h-3.5" /> {ev.time}
                      </span>
                    )}
                    {ev.location && (
                      <span className="flex items-center gap-1 text-sm text-gray-400 truncate">
                        <MapPin className="w-3.5 h-3.5 shrink-0" /> {ev.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PrayerSection({ items, onMore }: { items: PrayerItem[]; onMore?: () => void }) {
  return (
    <div className={CARD}>
      <SectionHeader icon={Heart} iconColor="text-rose-500" title="기도제목" onMore={onMore} />
      {items.length === 0 ? (
        <EmptyCard message="등록된 기도제목이 없습니다" />
      ) : (
        <div className="divide-y divide-gray-100">
          {items.map(prayer => (
            <div key={prayer.id} className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0">
              <div className="w-9 h-9 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <Heart className="w-4 h-4 text-rose-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base text-gray-800 font-semibold truncate">{prayer.title}</p>
                {prayer.authorName && <p className="text-sm text-gray-400 mt-1">{prayer.authorName}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function HomeDashboard({
  menuItems,
  recentNotices,
  todaySchedules,
  prayerItems,
  dailyVerse,
  onNoticesMore,
  onSchedulesMore,
  onPrayersMore,
}: HomeDashboardProps) {
  return (
    <>
      {/* ── PC: menu cards only ── */}
      <div className="hidden md:block">
        <PCMenuGrid items={menuItems} />
      </div>

      {/* ── Mobile: full dashboard with all sections ── */}
      <div className="flex flex-col gap-6 pb-10 md:hidden church-stagger">
        <HomeMenuGrid items={menuItems} />
        <RecentNoticeSection items={recentNotices} onMore={onNoticesMore} />
        <TodayVerseSection verse={dailyVerse} />
        <TodayScheduleSection items={todaySchedules} onMore={onSchedulesMore} />
        <PrayerSection items={prayerItems} onMore={onPrayersMore} />
      </div>
    </>
  );
}

export {
  ProfileSummarySection,
  ChurchInfoSection,
  HomeMenuGrid,
  RecentNoticeSection,
  TodayVerseSection,
  TodayScheduleSection,
  PrayerSection,
};

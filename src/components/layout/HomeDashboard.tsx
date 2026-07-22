import { useEffect, useState, useRef } from 'react';
import {
  BookOpen, BookHeart, Megaphone, FileText, Calendar, Heart, Image, Book,
  HeartHandshake, BarChart, BookMarked, User, Church, Network, UserCog,
  Users, Link as LinkIcon, Target, Sparkles, ChevronLeft, ChevronRight,
  Bell, MessageCircle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useChurchOrg } from '../../hooks/useChurchOrg';
import { UserProfileAvatar } from '../common/ui/UserProfileAvatar';
import { getAllAnnouncements } from '../../services/announcementStorage';
import { supabase } from '../../services/supabase';
import type { NavIcon } from '../../types/icons';
import type { AdminPage } from '../admin/Layout';
import type { Page } from '../member/Layout';

// ─── Types ────────────────────────────────────────────────────────────────────

type NavFn = ((page: AdminPage) => void) | ((page: Page) => void);
type SimpleNav = (id: string) => void;

export type HomeDashboardProps = {
  role: 'admin' | 'pastor' | 'member';
  onNavigate: NavFn;
};

type MenuCard = {
  id: string;
  label: string;
  icon: NavIcon;
  bg: string;
  ic: string;
  roles: Array<'admin' | 'pastor' | 'member'>;
};

// ─── Menu definitions ─────────────────────────────────────────────────────────

// Translates admin-style IDs to member/pastor page IDs (prayer excluded — handled by role-specific menu items)
const MEMBER_ID_MAP: Record<string, string> = {
  sermons:       'sermon',
  announcements: 'announcement',
  'bible-plans': 'bible-reading-center',
  qt:            'grace-notes',
  bulletins:     'bulletin',
  events:        'schedule',
  albums:        'album',
};

const MENUS: MenuCard[] = [
  // common
  { id: 'sermons',       label: '설교',        icon: BookOpen,       bg: 'bg-blue-50',    ic: 'text-blue-500',    roles: ['admin', 'pastor', 'member'] },
  { id: 'announcements', label: '공지사항',    icon: Megaphone,      bg: 'bg-violet-50',  ic: 'text-violet-500',  roles: ['admin', 'pastor', 'member'] },
  { id: 'bible',         label: '성경',        icon: BookMarked,     bg: 'bg-amber-50',   ic: 'text-amber-500',   roles: ['admin', 'pastor', 'member'] },
  { id: 'bible-plans',   label: '성경통독',    icon: Target,         bg: 'bg-green-50',   ic: 'text-green-500',   roles: ['admin', 'pastor', 'member'] },
  { id: 'qt',            label: '은혜와 기도',    icon: BookHeart,      bg: 'bg-primary-50', ic: 'text-primary-500', roles: ['admin', 'pastor', 'member'] },
  { id: 'prayers', label: '기도', icon: Heart, bg: 'bg-rose-50', ic: 'text-rose-500', roles: ['admin'] },
  { id: 'prayer',  label: '기도', icon: Heart, bg: 'bg-rose-50', ic: 'text-rose-500', roles: ['pastor', 'member'] },
  { id: 'bulletins',     label: '주보',        icon: FileText,       bg: 'bg-cyan-50',    ic: 'text-cyan-500',    roles: ['admin', 'pastor', 'member'] },
  { id: 'events',        label: '일정',        icon: Calendar,       bg: 'bg-emerald-50', ic: 'text-emerald-500', roles: ['admin', 'pastor', 'member'] },
  { id: 'albums',        label: '앨범',        icon: Image,          bg: 'bg-pink-50',    ic: 'text-pink-500',    roles: ['admin', 'pastor', 'member'] },
  { id: 'sharing',       label: '교회나눔',    icon: HeartHandshake, bg: 'bg-orange-50',  ic: 'text-orange-500',  roles: ['admin', 'pastor', 'member'] },
  { id: 'profile',       label: '내 정보',     icon: User,           bg: 'bg-gray-50',    ic: 'text-gray-500',    roles: ['admin', 'pastor', 'member'] },
  { id: 'church-info',   label: '교회정보',    icon: Church,         bg: 'bg-teal-50',    ic: 'text-teal-500',    roles: ['admin', 'pastor', 'member'] },
  // pastor+
  { id: 'book',          label: '설정',        icon: Book,           bg: 'bg-slate-50',   ic: 'text-slate-500',   roles: ['pastor'] },
  // admin only
  { id: 'statistics',    label: '통계/보고서', icon: BarChart,       bg: 'bg-slate-50',   ic: 'text-slate-500',   roles: ['admin'] },
  { id: 'org',           label: '조직관리',    icon: Network,        bg: 'bg-secondary-50',  ic: 'text-secondary-500',  roles: ['admin'] },
  { id: 'clergy',        label: '교역자관리',  icon: UserCog,        bg: 'bg-purple-50',  ic: 'text-purple-500',  roles: ['admin'] },
  { id: 'members',       label: '성도관리',    icon: Users,          bg: 'bg-sky-50',     ic: 'text-sky-500',     roles: ['admin'] },
  { id: 'invitations',   label: '초대관리',    icon: LinkIcon,       bg: 'bg-lime-50',    ic: 'text-lime-600',    roles: ['admin'] },
];

// ─── Today's scripture ────────────────────────────────────────────────────────

const DAILY_VERSE = { text: '여호와는 나의 목자시니 내게 부족함이 없으리로다', ref: '시편 23:1' };

// ─── Banner slides ────────────────────────────────────────────────────────────

const BANNERS = [
  { label: '오늘의 말씀', title: DAILY_VERSE.text, sub: DAILY_VERSE.ref, bg: 'from-primary-500 via-primary-600 to-accent-500', icon: Book },
  { label: '교회 공지사항', title: '2026년 하반기 교회 일정 안내', sub: '6월 25일 공지 · 전체 공지', bg: 'from-violet-500 via-violet-600 to-primary-600', icon: Megaphone },
  { label: '교회 행사 안내', title: '하계 수련회 참가 신청', sub: '7월 15일 ~ 17일 · 전교인 참여', bg: 'from-amber-500 via-orange-500 to-rose-500', icon: Calendar },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProfileCard({ role, onNavigate }: { role: HomeDashboardProps['role']; onNavigate: SimpleNav }) {
  const { user } = useAuth();
  const { churchName, orgLabel } = useChurchOrg(user);

  const roleBadge = role === 'admin' ? '최고관리자' : role === 'pastor' ? '교역자' : '성도';
  const profileRole = role === 'admin' ? 'super_admin' as const : role === 'pastor' ? 'pastor' as const : 'member' as const;
  const roleBadgeStyle = role === 'admin'
    ? 'bg-primary-100 text-primary-700'
    : role === 'pastor'
    ? 'bg-blue-100 text-blue-700'
    : 'bg-gray-100 text-gray-600';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
      <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0">
        <UserProfileAvatar
          user={user ? { ...user, role: profileRole } : null}
          size={56}
          rounded="2xl"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-bold text-gray-900 text-base truncate">{user?.name ?? '성도'}</span>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${roleBadgeStyle}`}>{roleBadge}</span>
        </div>
        <p className="text-xs text-gray-500 truncate">{churchName}</p>
        {orgLabel && <p className="text-xs text-primary-600 font-medium truncate mt-0.5">{orgLabel}</p>}
      </div>
      <button
        onClick={() => onNavigate('profile')}
        className="shrink-0 p-2 hover:bg-gray-50 rounded-xl transition-colors"
      >
        <User className="w-4 h-4 text-gray-400" />
      </button>
    </div>
  );
}

function BannerSlider() {
  const [idx, setIdx] = useState(0);
  const touchStart = useRef<number | null>(null);
  const banner = BANNERS[idx];
  const Icon = banner.icon;

  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % BANNERS.length), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative">
      <div
        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${banner.bg} px-5 py-6 text-white min-h-[130px] flex items-center`}
        onTouchStart={e => { touchStart.current = e.touches[0].clientX; }}
        onTouchEnd={e => {
          if (touchStart.current === null) return;
          const diff = touchStart.current - e.changedTouches[0].clientX;
          if (diff > 40) setIdx(i => (i + 1) % BANNERS.length);
          if (diff < -40) setIdx(i => (i - 1 + BANNERS.length) % BANNERS.length);
          touchStart.current = null;
        }}
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/3 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-32 h-32 bg-white/10 rounded-full translate-y-1/3 blur-xl pointer-events-none" />
        <div className="relative z-10 flex items-center gap-4 w-full">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3 h-3 opacity-80" />
              <span className="text-xs font-medium opacity-90">{banner.label}</span>
            </div>
            <h2 className="text-base font-bold mb-0.5 leading-tight line-clamp-2">{banner.title}</h2>
            <p className="text-xs opacity-75">{banner.sub}</p>
          </div>
        </div>
        {/* Nav arrows — desktop only */}
        <button
          onClick={() => setIdx(i => (i - 1 + BANNERS.length) % BANNERS.length)}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/20 hover:bg-white/30 rounded-full hidden sm:flex items-center justify-center transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-white" />
        </button>
        <button
          onClick={() => setIdx(i => (i + 1) % BANNERS.length)}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/20 hover:bg-white/30 rounded-full hidden sm:flex items-center justify-center transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-white" />
        </button>
      </div>
      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {BANNERS.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className={`rounded-full transition-all duration-300 ${i === idx ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/70'}`}
          />
        ))}
      </div>
    </div>
  );
}

function resolveId(id: string, role: HomeDashboardProps['role']): string {
  if (role === 'member' || role === 'pastor') return MEMBER_ID_MAP[id] ?? id;
  return id;
}

function MenuGrid({ role, onNavigate }: { role: HomeDashboardProps['role']; onNavigate: SimpleNav }) {
  const menus = MENUS.filter(m => m.roles.includes(role));

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
      {menus.map(item => (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id)}
          className="group flex flex-col items-center gap-2 p-3.5 bg-white rounded-2xl border border-gray-100 shadow-sm active:scale-95 hover:shadow-md hover:-translate-y-0.5 transition-all duration-150"
        >
          <div className={`w-12 h-12 ${item.bg} rounded-[14px] flex items-center justify-center group-hover:scale-110 transition-transform duration-150`}>
            <item.icon className={`w-[22px] h-[22px] ${item.ic}`} />
          </div>
          <span className="text-[11.5px] font-medium text-gray-700 leading-tight text-center">{item.label}</span>
        </button>
      ))}
    </div>
  );
}

function RecentAnnouncements({ onNavigate }: { onNavigate: SimpleNav }) {
  const announcements = getAllAnnouncements().slice(0, 5);

  if (announcements.length === 0) return null;

  const navigateToAnnouncements = () => onNavigate('announcements');

  return (
    <section>
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
          <Bell className="w-4 h-4 text-violet-500" />
          최근 공지사항
        </h3>
        <button
          onClick={navigateToAnnouncements}
          className="text-xs text-primary-600 font-medium flex items-center gap-0.5 hover:underline"
        >
          전체보기 <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
        {announcements.map(a => (
          <button
            key={a.id}
            onClick={navigateToAnnouncements}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors first:rounded-t-2xl last:rounded-b-2xl text-left"
          >
            <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
              <Megaphone className="w-3.5 h-3.5 text-violet-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800 font-medium truncate">{a.title}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{a.date}</p>
            </div>
            {a.isPinned && (
              <span className="shrink-0 text-[10px] font-bold text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">고정</span>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}

function DailyScripture() {
  return (
    <section>
      <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2 mb-2.5">
        <BookMarked className="w-4 h-4 text-amber-500" />
        오늘의 말씀
      </h3>
      <div className="bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl p-5 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <p className="text-base font-semibold leading-relaxed mb-2">"{DAILY_VERSE.text}"</p>
          <p className="text-sm opacity-80 font-medium">— {DAILY_VERSE.ref}</p>
        </div>
      </div>
    </section>
  );
}

type EventRow = { id: string; title: string; start_date: string; location?: string | null };

function TodayEvents({ onNavigate }: { onNavigate: SimpleNav }) {
  const [events, setEvents] = useState<EventRow[]>([]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    supabase
      .from('events')
      .select('id, title, start_date, location')
      .gte('start_date', today)
      .order('start_date')
      .limit(5)
      .then(({ data }) => { if (data) setEvents(data); });
  }, []);

  if (events.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-500" />
          다가오는 일정
        </h3>
        <button
          onClick={() => onNavigate('events')}
          className="text-xs text-primary-600 font-medium flex items-center gap-0.5 hover:underline"
        >
          전체보기 <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="space-y-2">
        {events.map(ev => {
          const d = new Date(ev.start_date);
          const month = d.getMonth() + 1;
          const day = d.getDate();
          const weekday = ['일','월','화','수','목','금','토'][d.getDay()];
          return (
            <div key={ev.id} className="bg-white rounded-xl border border-gray-100 shadow-sm flex items-center gap-3 px-4 py-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex flex-col items-center justify-center shrink-0">
                <span className="text-[10px] font-medium text-emerald-600">{month}월</span>
                <span className="text-sm font-bold text-emerald-700 leading-none">{day}</span>
                <span className="text-[9px] text-emerald-500">{weekday}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{ev.title}</p>
                {ev.location && <p className="text-xs text-gray-400 truncate mt-0.5">{ev.location}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

type PrayerRow = { id: string; title: string; author_name?: string | null; created_at: string };

function PrayerRequests({ onNavigate, prayerPage }: { onNavigate: SimpleNav; prayerPage: string }) {
  const [prayers, setPrayers] = useState<PrayerRow[]>([]);

  useEffect(() => {
    supabase
      .from('prayers')
      .select('id, title, author_name, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => { if (data) setPrayers(data); });
  }, []);

  if (prayers.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-rose-500" />
          기도제목
        </h3>
        <button
          onClick={() => onNavigate(prayerPage)}
          className="text-xs text-primary-600 font-medium flex items-center gap-0.5 hover:underline"
        >
          전체보기 <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
        {prayers.map(p => (
          <div key={p.id} className="flex items-center gap-3 px-4 py-3 first:rounded-t-2xl last:rounded-b-2xl">
            <div className="w-7 h-7 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
              <Heart className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800 font-medium truncate">{p.title}</p>
              {p.author_name && <p className="text-[11px] text-gray-400 mt-0.5">{p.author_name}</p>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function HomeDashboard({ role, onNavigate }: HomeDashboardProps) {
  const prayerPage = role === 'admin' ? 'prayers' : 'prayer';
  const nav = (id: string) => (onNavigate as (p: string) => void)(resolveId(id, role));

  return (
    <div className="pb-8 space-y-4">
      {/* ① Profile */}
      <ProfileCard role={role} onNavigate={nav} />

      {/* ② Banner / Church info */}
      <BannerSlider />

      {/* ③ Menu cards */}
      <section>
        <h3 className="font-bold text-gray-900 text-sm mb-2.5">메뉴</h3>
        <MenuGrid role={role} onNavigate={nav} />
      </section>

      {/* ④ Recent announcements */}
      <RecentAnnouncements onNavigate={nav} />

      {/* ⑤ Today's scripture */}
      <DailyScripture />

      {/* ⑥ Today's events */}
      <TodayEvents onNavigate={nav} />

      {/* ⑦ Prayer requests */}
      <PrayerRequests onNavigate={nav} prayerPage={prayerPage} />
    </div>
  );
}

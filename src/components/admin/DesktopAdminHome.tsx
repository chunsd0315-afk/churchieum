import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import type { AdminPage } from './Layout';
import {
  BookOpen, BookHeart, Megaphone, FileText, Calendar, Heart, Image, Book,
  HeartHandshake, BarChart, BookMarked, User, Church, TrendingUp,
} from 'lucide-react';

type Props = { onNavigate: (page: AdminPage) => void };

type HomeMenuItem = {
  id: AdminPage;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  bg: string;
  ic: string;
};

const HOME_MENUS: HomeMenuItem[] = [
  { id: 'sermons',       label: '설교',        icon: BookOpen,       bg: 'bg-blue-50',    ic: 'text-blue-500' },
  { id: 'announcements', label: '공지사항',    icon: Megaphone,      bg: 'bg-violet-50',  ic: 'text-violet-500' },
  { id: 'bible',         label: '성경',        icon: BookMarked,     bg: 'bg-amber-50',   ic: 'text-amber-500' },
  { id: 'bible-plans',   label: '성경통독',    icon: Book,           bg: 'bg-green-50',   ic: 'text-green-500' },
  { id: 'qt',            label: '은혜기록',    icon: BookHeart,      bg: 'bg-primary-50', ic: 'text-primary-500' },
  { id: 'prayers',       label: '기도',        icon: Heart,          bg: 'bg-rose-50',    ic: 'text-rose-500' },
  { id: 'bulletins',     label: '주보',        icon: FileText,       bg: 'bg-cyan-50',    ic: 'text-cyan-500' },
  { id: 'events',        label: '일정',        icon: Calendar,       bg: 'bg-emerald-50', ic: 'text-emerald-500' },
  { id: 'albums',        label: '앨범',        icon: Image,          bg: 'bg-pink-50',    ic: 'text-pink-500' },
  { id: 'sharing',       label: '교회나눔',    icon: HeartHandshake, bg: 'bg-orange-50',  ic: 'text-orange-500' },
  { id: 'profile',       label: '내 정보',     icon: User,           bg: 'bg-gray-50',    ic: 'text-gray-500' },
  { id: 'church-info',   label: '교회정보',    icon: Church,         bg: 'bg-teal-50',    ic: 'text-teal-500' },
  { id: 'statistics',    label: '통계/보고서', icon: BarChart,       bg: 'bg-slate-50',   ic: 'text-slate-500' },
];

const INITIAL_STATS = {
  memberCount: 0, sermonCount: 0, qtCount: 0,
  announcementCount: 0, newFamilies: 0, bulletins: 0,
};

export default function DesktopAdminHome({ onNavigate }: Props) {
  const [stats, setStats] = useState(INITIAL_STATS);
  const [activities, setActivities] = useState<{ type: string; title: string; date: string }[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [members, sermons, qts, announcements, newFamilies, bulletins] = await Promise.all([
          supabase.from('members').select('id', { count: 'exact', head: true }),
          supabase.from('sermons').select('id', { count: 'exact', head: true }),
          supabase.from('qt').select('id', { count: 'exact', head: true }),
          supabase.from('announcements').select('id', { count: 'exact', head: true }),
          supabase.from('new_families').select('id', { count: 'exact', head: true }).eq('status', 'new'),
          supabase.from('bulletins').select('id', { count: 'exact', head: true }),
        ]);
        setStats({
          memberCount: members.count || 0,
          sermonCount: sermons.count || 0,
          qtCount: qts.count || 0,
          announcementCount: announcements.count || 0,
          newFamilies: newFamilies.count || 0,
          bulletins: bulletins.count || 0,
        });

        const [recentSermons, recentAnnouncements] = await Promise.all([
          supabase.from('sermons').select('title, created_at').order('created_at', { ascending: false }).limit(3),
          supabase.from('announcements').select('title, published_at').order('published_at', { ascending: false }).limit(3),
        ]);
        const acts: typeof activities = [];
        (recentSermons.data || []).forEach(s => acts.push({ type: 'sermon', title: s.title, date: s.created_at }));
        (recentAnnouncements.data || []).forEach(a => acts.push({ type: 'announcement', title: a.title, date: a.published_at }));
        acts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setActivities(acts.slice(0, 6));
      } catch { /* keep zeros */ }
    })();
  }, []);

  void stats;

  return (
    <div className="p-6 space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-3xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 pointer-events-none" />
        <div className="relative z-10">
          <p className="text-white/70 text-sm mb-1">
            {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          </p>
          <h2 className="text-2xl font-bold mb-1">관리자 대시보드</h2>
          <p className="text-white/70 text-sm">교회이음 관리 시스템에 오신 것을 환영합니다.</p>
        </div>
      </div>

      {/* Recent activity + Menu cards */}
      <div className="grid grid-cols-5 gap-5">
        {/* Recent activity */}
        <div className="col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-primary-500" />
            최근 활동
          </h3>
          <div className="space-y-2">
            {activities.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">최근 활동이 없습니다</p>
            ) : activities.map((a, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  a.type === 'sermon' ? 'bg-primary-100' : 'bg-secondary-100'
                }`}>
                  {a.type === 'sermon'
                    ? <BookOpen className="w-4 h-4 text-primary-600" />
                    : <FileText className="w-4 h-4 text-secondary-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 truncate font-medium">{a.title}</p>
                  <p className="text-[11px] text-gray-400">{new Date(a.date).toLocaleDateString('ko-KR')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Menu cards — same style as member home */}
        <div className="col-span-3">
          <div className="grid grid-cols-3 gap-4">
            {HOME_MENUS.map(item => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="group flex flex-col items-center gap-3 p-5 bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
              >
                <div className={`w-14 h-14 ${item.bg} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                  <item.icon className={`w-7 h-7 ${item.ic}`} />
                </div>
                <span className="text-sm font-semibold text-gray-700 text-center">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

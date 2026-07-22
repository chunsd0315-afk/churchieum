import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import type { AdminPage } from './Layout';
import {
  BookOpen, BookHeart, Megaphone, FileText, Calendar, Heart, Image, Book,
  HeartHandshake, BarChart, BookMarked, User, Church,
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
  { id: 'qt',            label: '은혜와 기도',    icon: BookHeart,      bg: 'bg-primary-50', ic: 'text-primary-500' },
  { id: 'bulletins',     label: '주보',        icon: FileText,       bg: 'bg-cyan-50',    ic: 'text-cyan-500' },
  { id: 'events',        label: '일정',        icon: Calendar,       bg: 'bg-emerald-50', ic: 'text-emerald-500' },
  { id: 'albums',        label: '앨범',        icon: Image,          bg: 'bg-pink-50',    ic: 'text-pink-500' },
  { id: 'sharing',       label: '교회나눔',    icon: HeartHandshake, bg: 'bg-orange-50',  ic: 'text-orange-500' },
  { id: 'profile',       label: '내 정보',     icon: User,           bg: 'bg-gray-50',    ic: 'text-gray-500' },
  { id: 'church-info',   label: '교회정보',    icon: Church,         bg: 'bg-teal-50',    ic: 'text-teal-500' },
  { id: 'statistics',    label: '통계/보고서', icon: BarChart,       bg: 'bg-slate-50',   ic: 'text-slate-500' },
];

export default function MobileAdminHome({ onNavigate }: Props) {
  const [stats, setStats] = useState({
    memberCount: 0, qtCount: 0, announcementCount: 0, sermonCount: 0,
  });

  useEffect(() => {
    (async () => {
      try {
        const [members, qts, announcements, sermons] = await Promise.all([
          supabase.from('members').select('id', { count: 'exact', head: true }),
          supabase.from('qt').select('id', { count: 'exact', head: true }),
          supabase.from('announcements').select('id', { count: 'exact', head: true }),
          supabase.from('sermons').select('id', { count: 'exact', head: true }),
        ]);
        setStats({
          memberCount: members.count || 0,
          qtCount: qts.count || 0,
          announcementCount: announcements.count || 0,
          sermonCount: sermons.count || 0,
        });
      } catch { /* keep zeros */ }
    })();
  }, []);

  void stats;

  return (
    <div className="pb-6 space-y-4">
      {/* 3-column menu grid — same card style as member home */}
      <div className="grid grid-cols-3 gap-2.5">
        {HOME_MENUS.map(item => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className="flex flex-col items-center gap-2 p-3 bg-white rounded-2xl shadow-sm border border-gray-100 active:scale-95 transition-transform duration-100"
          >
            <div className={`w-11 h-11 ${item.bg} rounded-xl flex items-center justify-center`}>
              <item.icon className={`w-5 h-5 ${item.ic}`} />
            </div>
            <span className="text-[11px] font-medium text-gray-700 leading-tight text-center">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

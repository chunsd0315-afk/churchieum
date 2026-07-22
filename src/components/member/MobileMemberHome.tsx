import {
  BookHeart, Heart, Megaphone, Image, Calendar, BookOpen,
  Book, BookMarked, Target, User, Church, HeartHandshake,
} from 'lucide-react';
import type { Page } from './Layout';

type Props = { onNavigate: (page: Page) => void };

type MenuItem = {
  id: Page;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  bg: string;
  iconColor: string;
};

const MENUS: MenuItem[] = [
  { id: 'sermon',               label: '설교',     icon: BookOpen,       bg: 'bg-blue-50',    iconColor: 'text-blue-500' },
  { id: 'announcement',         label: '공지사항', icon: Megaphone,      bg: 'bg-violet-50',  iconColor: 'text-violet-500' },
  { id: 'bible',                label: '성경',     icon: Book,           bg: 'bg-amber-50',   iconColor: 'text-amber-500' },
  { id: 'bible-reading-center', label: '성경통독', icon: Target,         bg: 'bg-green-50',   iconColor: 'text-green-500' },
  { id: 'grace-notes',          label: '은혜와 기도', icon: BookHeart,      bg: 'bg-primary-50', iconColor: 'text-primary-500' },
  { id: 'prayer',               label: '기도',     icon: Heart,          bg: 'bg-rose-50',    iconColor: 'text-rose-500' },
  { id: 'bulletin',             label: '주보',     icon: BookMarked,     bg: 'bg-cyan-50',    iconColor: 'text-cyan-500' },
  { id: 'schedule',             label: '일정',     icon: Calendar,       bg: 'bg-emerald-50', iconColor: 'text-emerald-500' },
  { id: 'album',                label: '앨범',     icon: Image,          bg: 'bg-pink-50',    iconColor: 'text-pink-500' },
  { id: 'sharing',              label: '교회나눔', icon: HeartHandshake, bg: 'bg-orange-50',  iconColor: 'text-orange-500' },
  { id: 'profile',              label: '내 정보',  icon: User,           bg: 'bg-gray-50',    iconColor: 'text-gray-500' },
  { id: 'church-info',          label: '교회정보', icon: Church,         bg: 'bg-teal-50',    iconColor: 'text-teal-500' },
];

export default function MobileMemberHome({ onNavigate }: Props) {
  return (
    <div className="pb-6">
      <div className="grid grid-cols-3 gap-3">
        {MENUS.map(item => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className="flex flex-col items-center gap-2 p-3.5 bg-white active:scale-95 transition-transform duration-100"
            style={{ borderRadius: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9' }}
          >
            <div className={`w-12 h-12 ${item.bg} rounded-[14px] flex items-center justify-center`}>
              <item.icon className={`w-5 h-5 ${item.iconColor}`} />
            </div>
            <span className="text-[11.5px] font-medium text-gray-700 leading-tight text-center">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

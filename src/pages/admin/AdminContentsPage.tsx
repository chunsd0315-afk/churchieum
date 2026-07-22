import {
  BookOpen, BookHeart, Megaphone, FileText, Calendar, Heart, Image,
  Book, BookMarked, HeartHandshake,
} from 'lucide-react';
import type { AdminPage } from '../../components/admin/Layout';

type ContentItem = {
  id: AdminPage;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  bg: string;
  iconColor: string;
};

const CONTENT_ITEMS: ContentItem[] = [
  { id: 'sermons',       label: '설교',     description: '설교 등록과 관리',       icon: BookOpen,       bg: 'bg-blue-50',    iconColor: 'text-blue-500' },
  { id: 'announcements', label: '공지',     description: '교회 공지 작성',         icon: Megaphone,      bg: 'bg-violet-50',  iconColor: 'text-violet-500' },
  { id: 'bulletins',     label: '주보',     description: '주보 업로드와 관리',     icon: FileText,       bg: 'bg-cyan-50',    iconColor: 'text-cyan-500' },
  { id: 'qt',            label: '은혜와 기도', description: '성도 은혜·기도 기록 관리',     icon: BookHeart,      bg: 'bg-primary-50', iconColor: 'text-primary-500' },
  { id: 'events',        label: '일정',     description: '예배·행사 일정',         icon: Calendar,       bg: 'bg-emerald-50', iconColor: 'text-emerald-500' },
  { id: 'albums',        label: '앨범',     description: '교회 앨범 관리',         icon: Image,          bg: 'bg-pink-50',    iconColor: 'text-pink-500' },
  { id: 'bible-plans',   label: '성경통독', description: '통독 계획 관리',         icon: Book,           bg: 'bg-green-50',   iconColor: 'text-green-500' },
  { id: 'sharing',       label: '교회나눔', description: '교회 간 나눔 관리',       icon: HeartHandshake, bg: 'bg-orange-50',  iconColor: 'text-orange-500' },
  { id: 'bible',         label: '성경',     description: '성경 읽기 화면',         icon: BookMarked,     bg: 'bg-amber-50',   iconColor: 'text-amber-500' },
];

type Props = {
  onNavigate: (page: AdminPage) => void;
};

export default function AdminContentsPage({ onNavigate }: Props) {
  return (
    <div className="pb-8">
      <p className="text-base text-gray-600 mb-6">
        설교, 공지, 주보 등 교회 콘텐츠를 한곳에서 관리합니다.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 church-stagger">
        {CONTENT_ITEMS.map(item => (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            className="church-card-interactive text-left flex flex-col gap-3 touch-target"
          >
            <div className={`w-12 h-12 ${item.bg} rounded-card flex items-center justify-center`}>
              <item.icon className={`w-6 h-6 ${item.iconColor}`} />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-base">{item.label}</p>
              <p className="text-sm text-gray-500 mt-1">{item.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

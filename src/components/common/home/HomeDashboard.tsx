import type { NavIcon } from '../../../types/icons';
import { useBreakpoint } from '../../../hooks/useBreakpoint';

// ─── Public types ─────────────────────────────────────────────────────────────

export type HomeMenuItem = {
  id: string;
  label: string;
  description: string;
  icon: NavIcon;
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

/** @deprecated 요약 섹션은 홈에서 숨김 — 하위 호환용 optional props */
export type HomeDashboardProps = {
  menuItems: HomeMenuItem[];
  currentUser?: unknown;
  mode?: 'admin' | 'pastor' | 'member';
  recentNotices?: NoticeItem[];
  todaySchedules?: ScheduleItem[];
  prayerItems?: PrayerItem[];
  churchName?: string;
  orgLabel?: string;
  dailyVerse?: { text: string; ref: string };
  onMenuClick?: (id: string) => void;
  onNoticesMore?: () => void;
  onSchedulesMore?: () => void;
  onPrayersMore?: () => void;
};

// ─── Menu card ────────────────────────────────────────────────────────────────

function HomeMenuCard({ item, isMobile }: { item: HomeMenuItem; isMobile: boolean }) {
  if (isMobile) {
    return (
      <button
        type="button"
        onClick={item.onClick}
        className="flex flex-col items-center text-center transition-all duration-150 active:scale-[0.97]"
        style={{
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: 18,
          padding: 12,
          boxShadow: '0 8px 24px rgba(15,23,42,.04)',
          cursor: 'pointer',
        }}
      >
        <div
          className={`${item.bg} flex items-center justify-center`}
          style={{ width: 42, height: 42, borderRadius: 16, margin: '0 auto 8px' }}
        >
          <item.icon className={item.iconColor} style={{ width: 22, height: 22 }} />
        </div>
        <p
          className="w-full"
          style={{ fontSize: 13, fontWeight: 800, color: '#111827', marginBottom: 4 }}
        >
          {item.label}
        </p>
        <p
          className="w-full line-clamp-2"
          style={{
            fontSize: 11,
            fontWeight: 400,
            color: '#6B7280',
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {item.description}
        </p>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={item.onClick}
      className="group text-left w-full transition-all duration-150 hover:-translate-y-px hover:bg-[#F9FAFB]"
      style={{
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        borderRadius: 20,
        padding: 20,
        boxShadow: '0 8px 24px rgba(15,23,42,.04)',
        cursor: 'pointer',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 12px 30px rgba(15,23,42,.08)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(15,23,42,.04)';
      }}
    >
      <div
        className={`${item.bg} flex items-center justify-center`}
        style={{ width: 48, height: 48, borderRadius: 16, marginBottom: 14 }}
      >
        <item.icon className={item.iconColor} style={{ width: 24, height: 24 }} />
      </div>
      <p style={{ fontSize: 16, fontWeight: 800, color: '#111827', marginBottom: 6 }}>
        {item.label}
      </p>
      <p style={{ fontSize: 13, fontWeight: 400, color: '#6B7280', lineHeight: 1.4 }}>
        {item.description}
      </p>
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function HomeDashboard({ menuItems }: HomeDashboardProps) {
  const { isMobile } = useBreakpoint();

  if (menuItems.length === 0) {
    return (
      <p className="text-center text-gray-500 py-12 text-base">메뉴가 없습니다</p>
    );
  }

  return (
    <div
      className="church-stagger w-full"
      style={
        isMobile
          ? {
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 12,
            }
          : {
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: 16,
            }
      }
    >
      {menuItems.map(item => (
        <HomeMenuCard key={item.id} item={item} isMobile={isMobile} />
      ))}
    </div>
  );
}

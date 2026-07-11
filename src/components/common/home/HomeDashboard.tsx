import type { MenuIconKey } from '../design-system';
import {
  RoleGreetingBanner,
  HomeSummaryWidgets,
  MobileMenuGrid,
  DesktopMenuGrid,
} from '../design-system';
import { useBreakpoint } from '../../../hooks/useBreakpoint';
import { useAuth } from '../../../contexts/AuthContext';
import { useChurchOrg } from '../../../hooks/useChurchOrg';
import { useHomeDashboardData } from './useHomeDashboardData';

// ─── Public types ─────────────────────────────────────────────────────────────

export type HomeMenuItem = {
  id: string;
  label: string;
  description: string;
  iconKey: MenuIconKey;
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
  menuItems: HomeMenuItem[];
  mode?: 'admin' | 'pastor' | 'member';
  onSchedulesMore?: () => void;
  onNoticesMore?: () => void;
};

// ─── Main component ───────────────────────────────────────────────────────────

export default function HomeDashboard({
  menuItems,
  mode = 'member',
  onSchedulesMore,
  onNoticesMore,
}: HomeDashboardProps) {
  const { isMobile } = useBreakpoint();
  const { user } = useAuth();
  const { churchName } = useChurchOrg(user);
  const { recentNotices, upcomingSchedules } = useHomeDashboardData();

  const roleLabel =
    mode === 'admin'
      ? '최고관리자'
      : mode === 'pastor'
        ? '교역자'
        : user?.position ?? '성도';

  if (menuItems.length === 0) {
    return (
      <p className="text-center text-gray-500 py-12 text-base">메뉴가 없습니다</p>
    );
  }

  return (
    <div className="w-full">
      <RoleGreetingBanner
        userName={user?.name}
        roleLabel={roleLabel}
        churchName={churchName}
        mode={mode}
      />

      {isMobile ? (
        <MobileMenuGrid items={menuItems} />
      ) : (
        <>
          <DesktopMenuGrid items={menuItems} />
          <HomeSummaryWidgets
            schedules={upcomingSchedules}
            notices={recentNotices}
            onSchedulesMore={onSchedulesMore}
            onNoticesMore={onNoticesMore}
          />
        </>
      )}
    </div>
  );
}

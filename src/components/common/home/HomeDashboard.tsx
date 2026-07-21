import type { MenuIconKey } from '../../../config/menuIconMap';
import {
  RoleGreetingBanner,
  HomeSummaryWidgets,
  MobileMenuGrid,
  DesktopMenuGrid,
  DS,
} from '../design-system';
import { useBreakpoint } from '../../../hooks/useBreakpoint';
import { useAuth } from '../../../contexts/AuthContext';
import { useChurchOrg } from '../../../hooks/useChurchOrg';
import { useHomeDashboardData } from './useHomeDashboardData';

export type HomeMenuItem = {
  id: string;
  label: string;
  description: string;
  iconKey: import('../../../config/menuIconMap').MenuIconKey;
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

function roleLabelForMode(
  mode: 'admin' | 'pastor' | 'member',
  userPosition?: string,
): string {
  if (mode === 'admin') return '최고관리자';
  if (mode === 'pastor') return '교역자';
  return userPosition ?? '성도';
}

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

  const roleLabel = roleLabelForMode(mode, user?.position);

  if (menuItems.length === 0) {
    return (
      <p className="text-center py-12 text-base" style={{ color: DS.colors.textMuted }}>
        메뉴가 없습니다
      </p>
    );
  }

  return (
    <div className="w-full" style={{ background: isMobile ? DS.colors.bgPage : 'transparent' }}>
      <RoleGreetingBanner
        userName={user?.name}
        roleLabel={roleLabel}
        position={user?.position}
        churchName={isMobile ? undefined : churchName}
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

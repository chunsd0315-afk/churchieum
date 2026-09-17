/**
 * 설정 작업공간 — 상단 헤더는 그대로 두고 사이드바와 중앙 콘텐츠만 설정용으로 바꾼다.
 * AdminLayout·PastorLayout이 같은 결과를 공통 AppLayout에 그대로 넘겨 쓴다.
 */
import { useCallback, useState, type ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useBreakpoint } from '../../../hooks/useBreakpoint';
import { MobileSubPageHeader } from '../../common/ui/PageLayout';
import { SettingsSidebar } from './SettingsSidebar';
import { SettingsContent } from './SettingsContent';
import { SettingsMobileHome } from './SettingsMobileHome';
import {
  DEFAULT_SETTINGS_SUB_PAGE,
  useSettingsItems,
  type SettingsSubPage,
} from './settingsMenu';

export type SettingsWorkspace = {
  /** 설정 화면이 열려 있는지 */
  active: boolean;
  openSettings: () => void;
  /** 설정 종료 후 지정된 화면으로 이동 */
  closeSettings: () => void;
  /** 다른 메뉴로 이동할 때 설정만 닫기 */
  dismissSettings: () => void;
  /** PC 설정 사이드바 — 기본 메뉴 사이드바를 대신한다 */
  sidebar: ReactNode | null;
  /** 설정 중앙 콘텐츠 */
  content: ReactNode | null;
  /** 모바일 설정 헤더 */
  mobileHeader: ReactNode | null;
  /** 깊은 설정 화면에서는 하단 내비를 감춘다 */
  showBottomNav: boolean;
};

type Options = {
  /** 최고관리자만 설정을 열 수 있다 */
  enabled: boolean;
  /** 설정에서 나갈 때 이동할 화면 */
  onExit?: () => void;
};

export function useSettingsWorkspace({ enabled, onExit }: Options): SettingsWorkspace {
  const { isMobile } = useBreakpoint();
  const items = useSettingsItems();
  const [open, setOpen] = useState(false);
  const [subPage, setSubPage] = useState<SettingsSubPage | null>(null);

  const openSettings = useCallback(() => {
    if (!enabled) return;
    setOpen(true);
  }, [enabled]);

  const dismissSettings = useCallback(() => {
    setOpen(false);
    setSubPage(null);
  }, []);

  const closeSettings = useCallback(() => {
    dismissSettings();
    onExit?.();
  }, [dismissSettings, onExit]);

  const active = open && enabled;

  if (!active) {
    return {
      active: false,
      openSettings,
      closeSettings,
      dismissSettings,
      sidebar: null,
      content: null,
      mobileHeader: null,
      showBottomNav: true,
    };
  }

  const desktopSubPage = subPage ?? DEFAULT_SETTINGS_SUB_PAGE;
  const currentTitle = subPage ? items.find(i => i.id === subPage)?.title : undefined;

  const backButton = (onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 px-3 py-2 hover:bg-gray-100 rounded-[10px] transition-colors text-gray-600 touch-target"
    >
      <ChevronLeft className="w-5 h-5" />
      <span className="text-sm font-medium">뒤로</span>
    </button>
  );

  const mobileHeader = (
    <MobileSubPageHeader
      title={currentTitle ?? '교회이음 설정'}
      description={currentTitle ? undefined : '교회 통합 관리센터'}
      leading={backButton(subPage ? () => setSubPage(null) : closeSettings)}
    />
  );

  const content = isMobile
    ? (subPage
        ? <SettingsContent subPage={subPage} items={items} onSubNavigate={setSubPage} />
        : <SettingsMobileHome items={items} onSelect={setSubPage} />)
    : (
        <SettingsContent
          subPage={desktopSubPage}
          items={items}
          onSubNavigate={setSubPage}
          showBreadcrumb
        />
      );

  return {
    active: true,
    openSettings,
    closeSettings,
    dismissSettings,
    sidebar: (
      <SettingsSidebar
        items={items}
        subPage={desktopSubPage}
        onSelect={setSubPage}
        onBack={closeSettings}
      />
    ),
    content,
    mobileHeader,
    showBottomNav: subPage === null,
  };
}

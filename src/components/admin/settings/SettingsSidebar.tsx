/**
 * PC 설정 사이드바 — 설정에 들어가면 기본 메뉴 사이드바 자리를 대신한다.
 * 상단 헤더(PCTopHeader)는 그대로 유지되고 이 사이드바와 중앙 콘텐츠만 바뀐다.
 */
import { ChevronLeft } from 'lucide-react';
import { MenuIcon } from '../../common/MenuIcon';
import { DS } from '../../common/design-system/tokens';
import { SettingsItemIcon } from './SettingsItemIcon';
import {
  SETTINGS_GROUP_LABELS,
  SETTINGS_GROUP_ORDER,
  type SettingsItem,
  type SettingsSubPage,
} from './settingsMenu';

type Props = {
  items: SettingsItem[];
  subPage: SettingsSubPage;
  onSelect: (page: SettingsSubPage) => void;
  onBack: () => void;
};

function SettingsSidebarItem({
  item,
  active,
  onClick,
}: {
  item: SettingsItem;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-2.5 transition-all duration-200 active:scale-[0.98]"
      style={{
        height: 48,
        borderRadius: DS.radius.capsule,
        padding: '0 12px',
        fontSize: 14,
        fontWeight: active ? 700 : 500,
        background: active ? DS.colors.activeBg : 'transparent',
        boxShadow: active ? `inset 0 0 0 1px ${DS.colors.activeAccent}55` : 'none',
        color: active ? DS.colors.activeText : DS.colors.textPrimary,
      }}
      onMouseEnter={e => {
        if (!active) e.currentTarget.style.background = DS.colors.bgGray;
      }}
      onMouseLeave={e => {
        if (!active) e.currentTarget.style.background = 'transparent';
      }}
    >
      <SettingsItemIcon item={item} active={active} variant="sidebar" />
      <span className="flex-1 text-left truncate">{item.title}</span>
      {active && (
        <span
          className="shrink-0 rounded-full"
          style={{ width: 6, height: 6, background: DS.colors.gold }}
          aria-hidden
        />
      )}
    </button>
  );
}

export function SettingsSidebar({ items, subPage, onSelect, onBack }: Props) {
  return (
    <aside
      className="h-full flex flex-col shrink-0 overflow-y-auto scrollbar-hide"
      style={{
        width: DS.layout.sidebarWidth,
        background: DS.colors.bgSidebar,
        borderRight: `1px solid ${DS.colors.borderDefault}`,
        padding: '14px 14px 18px',
      }}
    >
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 self-start rounded-[12px] px-2 py-2 text-sm font-medium transition-colors touch-target"
        style={{ color: DS.colors.textSecondary }}
        onMouseEnter={e => { e.currentTarget.style.background = DS.colors.bgGray; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
      >
        <ChevronLeft className="w-4 h-4" />
        뒤로
      </button>

      <div
        className="flex items-center gap-2.5 mt-1 mb-3 pb-3"
        style={{ borderBottom: `1px solid ${DS.colors.borderSubtle}` }}
      >
        <MenuIcon iconKey="settings" variant="sidebar" active label="교회이음 설정" />
        <div className="min-w-0">
          <p
            className="font-bold truncate leading-snug"
            style={{ fontSize: 14, color: DS.colors.textPrimary }}
          >
            교회이음 설정
          </p>
          <p className="truncate" style={{ fontSize: 11, color: DS.colors.textMuted }}>
            교회 통합 관리센터
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-3">
        {SETTINGS_GROUP_ORDER.map(group => {
          const groupItems = items.filter(i => i.group === group);
          if (groupItems.length === 0) return null;
          return (
            <div key={group}>
              <p
                className="px-3 pb-1 font-bold tracking-wide"
                style={{ fontSize: 11, color: DS.colors.textMuted }}
              >
                {SETTINGS_GROUP_LABELS[group]}
              </p>
              <div className="space-y-0.5">
                {groupItems.map(item => (
                  <SettingsSidebarItem
                    key={item.id}
                    item={item}
                    active={subPage === item.id}
                    onClick={() => onSelect(item.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

/** 모바일 설정 홈 — 그룹별 목록에서 세부 설정으로 들어간다 */
import { ChevronRight } from 'lucide-react';
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
  onSelect: (page: SettingsSubPage) => void;
};

export function SettingsMobileHome({ items, onSelect }: Props) {
  return (
    <div className="px-4 pt-4 pb-10">
      {SETTINGS_GROUP_ORDER.map(group => {
        const groupItems = items.filter(i => i.group === group);
        if (groupItems.length === 0) return null;
        return (
          <div key={group} className="mb-6">
            <p
              className="mb-2 px-1 font-bold"
              style={{ fontSize: 12, color: DS.colors.textMuted }}
            >
              {SETTINGS_GROUP_LABELS[group]}
            </p>
            <div
              className="overflow-hidden"
              style={{
                background: DS.colors.bgSurface,
                border: `1px solid ${DS.colors.borderCard}`,
                borderRadius: DS.radius.cardMobile,
                boxShadow: DS.shadow.card,
              }}
            >
              {groupItems.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelect(item.id)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left min-h-[64px] touch-target"
                  style={{
                    borderTop: index === 0 ? 'none' : `1px solid ${DS.colors.borderSubtle}`,
                  }}
                >
                  <SettingsItemIcon item={item} variant="list" />
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-bold"
                      style={{ fontSize: 15, color: DS.colors.textPrimary }}
                    >
                      {item.title}
                    </p>
                    <p
                      className="mt-0.5 leading-snug line-clamp-1"
                      style={{ fontSize: 12, color: DS.colors.textMuted }}
                    >
                      {item.description}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 shrink-0" style={{ color: DS.colors.textMuted }} />
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Page } from '../member/Layout';
import { MenuIcon } from '../common/MenuIcon';
import type { MenuIconKey } from '../../config/menuIconMap';
import { DS } from '../common/design-system/tokens';
import { HOME_MENU_CATALOG } from '../common/home/homeMenuCatalog';

type Props = {
  onNavigate: (page: Page) => void;
};

type MenuRow = {
  page: Page;
  label: string;
  description: string;
  iconKey: MenuIconKey;
};

type MenuSection = {
  title: string;
  items: MenuRow[];
};

const SECTIONS: MenuSection[] = [
  {
    title: '말씀과 신앙생활',
    items: [
      { page: 'sermon', label: HOME_MENU_CATALOG.sermon.label, description: '하나님의 말씀', iconKey: 'sermon' },
      { page: 'bible', label: HOME_MENU_CATALOG.bible.label, description: '말씀을 읽어요', iconKey: 'bible' },
      {
        page: 'bible-reading-center',
        label: HOME_MENU_CATALOG.biblePlan.label,
        description: '통독 계획',
        iconKey: 'biblePlan',
      },
      {
        page: 'grace-notes',
        label: HOME_MENU_CATALOG.grace.label,
        description: '함께 기도해요',
        iconKey: 'grace',
      },
    ],
  },
  {
    title: '교회 소식과 참여',
    items: [
      {
        page: 'announcement',
        label: HOME_MENU_CATALOG.announcement.label,
        description: '교회 소식',
        iconKey: 'announcement',
      },
      { page: 'bulletin', label: HOME_MENU_CATALOG.bulletin.label, description: '이번 주 주보', iconKey: 'bulletin' },
      { page: 'schedule', label: HOME_MENU_CATALOG.schedule.label, description: '교회 일정', iconKey: 'schedule' },
      { page: 'album', label: HOME_MENU_CATALOG.album.label, description: '추억을 나눠요', iconKey: 'album' },
    ],
  },
  {
    title: '함께하는 교회',
    items: [
      { page: 'sharing', label: HOME_MENU_CATALOG.sharing.label, description: '함께 나눠요', iconKey: 'sharing' },
      { page: 'church-info', label: HOME_MENU_CATALOG.churchInfo.label, description: '우리 교회', iconKey: 'churchInfo' },
      { page: 'profile', label: HOME_MENU_CATALOG.profile.label, description: '내 정보', iconKey: 'profile' },
    ],
  },
];

export default function AllMenusPage({ onNavigate }: Props) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SECTIONS;
    return SECTIONS.map(section => ({
      ...section,
      items: section.items.filter(
        item =>
          item.label.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q),
      ),
    })).filter(section => section.items.length > 0);
  }, [query]);

  return (
    <div className="pb-4">
      <div
        className="relative overflow-hidden mb-5 px-5 py-6"
        style={{
          borderRadius: DS.radius.banner,
          background: 'linear-gradient(135deg, #FFF5E8 0%, #E8F5E9 50%, #FFF9F2 100%)',
          border: `1px solid ${DS.colors.borderCard}`,
          boxShadow: DS.shadow.card,
        }}
      >
        <p
          className="font-bold leading-snug"
          style={{ fontSize: 17, color: DS.colors.leatherDeep, maxWidth: '88%' }}
        >
          하나님과, 사람과, 세상을 잇는 교회이음.
        </p>
        <div
          className="absolute right-3 bottom-2 opacity-90 pointer-events-none"
          style={{ width: 72, height: 56 }}
        >
          <MenuIcon iconKey="churchInfo" size={56} />
        </div>
      </div>

      <div className="relative mb-5">
        <Search
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
          style={{ color: DS.colors.textMuted }}
        />
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="메뉴 검색"
          className="w-full pl-10 pr-4 outline-none"
          style={{
            height: 48,
            borderRadius: DS.radius.input,
            border: `1px solid ${DS.colors.borderCard}`,
            background: DS.colors.bgSurface,
            color: DS.colors.textPrimary,
            fontSize: 15,
          }}
        />
      </div>

      <div className="space-y-6">
        {filtered.map(section => (
          <section key={section.title}>
            <h2
              className="font-bold mb-3 px-0.5"
              style={{ fontSize: 15, color: DS.colors.leatherDeep }}
            >
              {section.title}
            </h2>
            <div
              className="grid grid-cols-4 gap-2"
              style={{
                padding: 12,
                borderRadius: DS.radius.card,
                background: DS.colors.bgSurface,
                border: `1px solid ${DS.colors.borderCard}`,
                boxShadow: DS.shadow.card,
              }}
            >
              {section.items.map(item => (
                <button
                  key={`${section.title}-${item.page}-${item.iconKey}`}
                  type="button"
                  onClick={() => onNavigate(item.page)}
                  className="flex flex-col items-center gap-1.5 py-2 px-1 rounded-[16px] active:scale-[0.97] transition-transform touch-target"
                  aria-label={item.label}
                >
                  <MenuIcon iconKey={item.iconKey} size={48} label={item.label} />
                  <span
                    className="text-center leading-tight line-clamp-2"
                    style={{ fontSize: 12, fontWeight: 700, color: DS.colors.textPrimary }}
                  >
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div
        className="mt-6 px-5 py-5"
        style={{
          borderRadius: DS.radius.card,
          background: 'linear-gradient(135deg, #FFF5E8 0%, #F3FAF4 100%)',
          border: `1px solid ${DS.colors.borderCard}`,
        }}
      >
        <p
          className="leading-snug"
          style={{
            fontFamily: "var(--font-family-serif), 'Noto Serif KR', Georgia, serif",
            fontSize: 14,
            fontWeight: 600,
            color: DS.colors.textPrimary,
          }}
        >
          모든 것을 품위 있게 하고 질서 있게 하라
        </p>
        <p className="mt-1" style={{ fontSize: 12, color: DS.colors.textMuted }}>
          고린도전서 14:40
        </p>
      </div>
    </div>
  );
}

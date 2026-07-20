export type SharedContentCollectionTab = {
  id: string;
  label: string;
  shortLabel?: string;
  count?: number;
};

export function SharedContentCollectionTabs({
  tabs,
  activeTab,
  onChange,
  ariaLabel = '목록 보기',
}: {
  tabs: SharedContentCollectionTab[];
  activeTab: string;
  onChange: (id: string) => void;
  ariaLabel?: string;
}) {
  const cols = tabs.length === 2 ? 'grid-cols-2' : `grid-cols-${Math.min(tabs.length, 4)}`;

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`grid ${cols} gap-1 rounded-xl bg-gray-100 p-1 w-full`}
    >
      {tabs.map(tab => {
        const selected = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={`collection-panel-${tab.id}`}
            onClick={() => onChange(tab.id)}
            className={`min-h-[44px] px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors touch-target ${
              selected
                ? 'bg-[#2F8F62] text-white shadow-sm'
                : 'bg-white text-gray-600 border border-[#E5E7EB]'
            }`}
          >
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.shortLabel ?? tab.label}</span>
            {tab.count !== undefined && (
              <>
                {' '}
                <span className={selected ? 'text-white/90' : 'text-gray-400'}>{tab.count}</span>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}

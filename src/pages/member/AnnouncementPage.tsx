import { useState, useMemo } from 'react';
import {
  Megaphone, Pin, X, Calendar, Star, Paperclip, ImageIcon, Download,
  Bell, SlidersHorizontal, LayoutGrid, List, Plus,
} from 'lucide-react';
import { getAllAnnouncements, type Announcement } from '../../services/announcementStorage';
import { buildNoticeScopeBadges } from '../../services/announcementHelpers';
import { useAuth } from '../../contexts/AuthContext';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import type { AppUser } from '../../services/permissions';
import { PageHeaderBar, useToast } from '../../components/common/ui';
import StatusBadge from '../../components/layout/StatusBadge';
import EmptyState from '../../components/layout/EmptyState';
import {
  AnnouncementSearchPanel,
  AnnouncementFilterChips,
  EMPTY_FILTER,
  isFilterActive,
  countActiveFilters,
  type AnnouncementSearchFilter,
} from '../../components/announcement/AnnouncementSearchPanel';
import { getAllOrganizations } from '../../services/organizationStorage';

type ImportanceFilter = 'all' | 'important' | 'regular';

function isAnnouncementVisible(ann: Announcement, user: AppUser | null): boolean {
  if (!user) return ann.scope === 'all';
  if (user.role === 'super_admin') return true;
  if (ann.scope === 'all') return true;
  if (user.role === 'pastor') {
    if (ann.scope === 'level1')     return user.assignedDistrictIds?.includes(ann.scopeId ?? '')   ?? false;
    if (ann.scope === 'level2')     return user.assignedZoneIds?.includes(ann.scopeId ?? '')       ?? false;
    if (ann.scope === 'department') return user.assignedDepartmentIds?.includes(ann.scopeId ?? '') ?? false;
  }
  if (user.role === 'member') {
    if (ann.scope === 'level1')     return ann.scopeId === user.districtId;
    if (ann.scope === 'level2')     return ann.scopeId === user.zoneId;
    if (ann.scope === 'department') return user.departmentIds?.includes(ann.scopeId ?? '') ?? false;
  }
  return false;
}

function isImportantNotice(a: Announcement): boolean {
  return a.isPinned || a.isImportant;
}

function byNewest(a: Announcement, b: Announcement): number {
  const byDate = b.date.localeCompare(a.date);
  if (byDate !== 0) return byDate;
  return (b.created_at ?? '').localeCompare(a.created_at ?? '');
}

export default function AnnouncementPage() {
  const { user, isPastor, isAdmin } = useAuth();
  const toast = useToast();
  const { isMobile } = useBreakpoint();
  const canCreate = isPastor || isAdmin;

  const [importanceFilter, setImportanceFilter] = useState<ImportanceFilter>('all');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('list');
  const effectiveViewMode = isMobile ? 'list' : viewMode;
  const [showSearch, setShowSearch] = useState(false);
  const [selected, setSelected] = useState<Announcement | null>(null);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  // 상세검색 필터 state
  const [searchFilter, setSearchFilter] = useState<AnnouncementSearchFilter>(EMPTY_FILTER);
  // 패널에서 편집 중인 임시 값 (Apply 전)
  const [draftFilter, setDraftFilter] = useState<AnnouncementSearchFilter>(EMPTY_FILTER);

  const visibleAnnouncements = useMemo(
    () => getAllAnnouncements().filter(a => isAnnouncementVisible(a, user)),
    [user],
  );

  // 조직 맵 (scope 필터에서 ID → scopeId 매핑용)
  const orgMap = useMemo(
    () => new Map(getAllOrganizations().map(o => [o.id, o])),
    [],
  );

  const filtered = useMemo(() => {
    const f = searchFilter;
    return visibleAnnouncements
      .filter(a => {
        // 내 조직 + 조직 선택이 있으면 해당 조직 공지만
        if (f.scopeMode === 'my_org' && f.selectedOrgIds.length > 0) {
          return f.selectedOrgIds.some(orgId => {
            const org = orgMap.get(orgId);
            if (!org) return false;
            // scope=all → 항상 표시
            if (a.scope === 'all') return true;
            // scopeId 일치 또는 해당 org가 scopeId와 같은 경우
            return a.scopeId === orgId || a.scopeId === org.id;
          });
        }
        return true;
      })
      .filter(a => {
        // 기간 필터 (date 필드 기준)
        const { dateFrom, dateTo } = f;
        if (!dateFrom && !dateTo) return true;
        if (dateFrom && a.date < dateFrom) return false;
        if (dateTo && a.date > dateTo) return false;
        return true;
      })
      .filter(a => {
        if (!f.keyword) return true;
        const q = f.keyword.toLowerCase();
        return (
          a.title.toLowerCase().includes(q) ||
          a.content.toLowerCase().includes(q) ||
          a.author.toLowerCase().includes(q)
        );
      })
      .filter(a => {
        if (importanceFilter === 'important') return isImportantNotice(a);
        if (importanceFilter === 'regular') return !isImportantNotice(a);
        return true;
      });
  }, [visibleAnnouncements, searchFilter, importanceFilter, orgMap]);

  const pinned = useMemo(
    () => filtered.filter(isImportantNotice).sort(byNewest),
    [filtered],
  );
  const regular = useMemo(
    () => filtered.filter(a => !isImportantNotice(a)).sort(byNewest),
    [filtered],
  );

  const resetFilters = () => {
    setSearchFilter(EMPTY_FILTER);
    setDraftFilter(EMPTY_FILTER);
    setShowSearch(false);
  };

  const handleCreate = () => {
    toast.info('관리자 모드의 공지 메뉴에서 등록·관리할 수 있습니다.');
  };

  const filterTabs: { id: ImportanceFilter; label: string }[] = [
    { id: 'all', label: '전체' },
    { id: 'important', label: '중요공지' },
    { id: 'regular', label: '일반공지' },
  ];

  return (
    <div className="space-y-5 pb-24 md:pb-8 max-w-[900px] mx-auto">
      <PageHeaderBar
        title="공지사항"
        description="교회 소식과 중요한 안내를 확인하세요."
        action={
          canCreate ? (
            <button
              type="button"
              onClick={handleCreate}
              className="inline-flex items-center gap-2 h-12 px-4 rounded-[14px] bg-primary-500 text-white text-sm font-bold hover:bg-primary-600 touch-target"
            >
              <Plus className="w-4 h-4" />
              공지 등록
            </button>
          ) : undefined
        }
        mobileFab={canCreate ? { label: '공지 등록', onClick: handleCreate } : undefined}
      />

      {/* 검색 · 필터 · 보기 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-[14px] overflow-x-auto">
            {filterTabs.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setImportanceFilter(tab.id)}
                className={`px-3.5 h-10 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors touch-target ${
                  importanceFilter === tab.id
                    ? 'bg-white text-primary-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (!showSearch) setDraftFilter(searchFilter);
                setShowSearch(s => !s);
              }}
              className={`flex items-center gap-2 px-4 rounded-[14px] border text-sm font-semibold transition-all touch-target ${
                showSearch || isFilterActive(searchFilter)
                  ? 'bg-primary-500 border-primary-500 text-white'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
              style={{ height: '44px' }}
            >
              <SlidersHorizontal className="w-4 h-4" />
              상세검색
              {countActiveFilters(searchFilter) > 0 && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
                  showSearch ? 'bg-white/20' : 'bg-primary-100 text-primary-700'
                }`}>
                  {countActiveFilters(searchFilter)}
                </span>
              )}
            </button>

            {!isMobile && (
              <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-[14px]">
                <button
                  type="button"
                  onClick={() => setViewMode('card')}
                  title="카드 보기"
                  className={`flex items-center justify-center rounded-xl transition-all ${
                    viewMode === 'card' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-400 hover:text-gray-600'
                  }`}
                  style={{ width: '36px', height: '36px' }}
                >
                  <LayoutGrid className="w-4.5 h-4.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  title="목록 보기"
                  className={`flex items-center justify-center rounded-xl transition-all ${
                    viewMode === 'list' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-400 hover:text-gray-600'
                  }`}
                  style={{ width: '36px', height: '36px' }}
                >
                  <List className="w-4.5 h-4.5" />
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 상세검색 패널 (PC: 확장 패널 / 모바일: BottomSheet) */}
      {showSearch && isMobile && (
        <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-end">
          <div className="w-full bg-white rounded-t-[24px] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <h3 className="text-base font-bold text-gray-900">상세검색</h3>
              <button
                type="button"
                onClick={() => setShowSearch(false)}
                className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 touch-target"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <AnnouncementSearchPanel
              asSheet
              value={draftFilter}
              onChange={setDraftFilter}
              onApply={() => {
                setSearchFilter(draftFilter);
                setShowSearch(false);
              }}
              onReset={resetFilters}
            />
          </div>
        </div>
      )}

      {showSearch && !isMobile && (
        <AnnouncementSearchPanel
          value={draftFilter}
          onChange={setDraftFilter}
          onApply={() => {
            setSearchFilter(draftFilter);
            setShowSearch(false);
          }}
          onReset={resetFilters}
        />
      )}

      {/* 적용된 필터 Chips */}
      {isFilterActive(searchFilter) && !showSearch && (
        <AnnouncementFilterChips filter={searchFilter} onChange={f => { setSearchFilter(f); setDraftFilter(f); }} />
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="공지사항이 없습니다"
          description="아직 등록된 공지사항이 없어요."
        />
      ) : (
        <div className="space-y-5">
          {pinned.length > 0 && importanceFilter !== 'regular' && (
            <section>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Pin className="w-3.5 h-3.5 text-amber-500" /> 중요 공지
              </h3>
              {effectiveViewMode === 'list' ? (
                <div className="church-list">
                  {pinned.map(a => <AnnListCard key={a.id} item={a} onClick={() => setSelected(a)} />)}
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {pinned.map(a => <AnnGridCard key={a.id} item={a} onClick={() => setSelected(a)} />)}
                </div>
              )}
            </section>
          )}

          {regular.length > 0 && importanceFilter !== 'important' && (
            <section>
              {pinned.length > 0 && importanceFilter === 'all' && (
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5" /> 일반 공지
                </h3>
              )}
              {effectiveViewMode === 'list' ? (
                <div className="church-list">
                  {regular.map(a => <AnnListCard key={a.id} item={a} onClick={() => setSelected(a)} />)}
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {regular.map(a => <AnnGridCard key={a.id} item={a} onClick={() => setSelected(a)} />)}
                </div>
              )}
            </section>
          )}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center md:p-4">
          <div className="bg-white w-full md:max-w-2xl md:rounded-3xl rounded-t-3xl max-h-[92vh] flex flex-col shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between flex-shrink-0 rounded-t-3xl">
              <h3 className="font-bold text-gray-900">공지 상세</h3>
              <button type="button" onClick={() => setSelected(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 pb-8">
              {selected.images.length > 0 && (
                <div
                  className="w-full overflow-hidden rounded-[16px] bg-gray-100 cursor-pointer"
                  style={{ aspectRatio: '16/7' }}
                  onClick={() => setLightboxImg(selected.images[0])}
                >
                  <img src={selected.images[0]} alt="" className="w-full h-full object-cover" />
                </div>
              )}

              <div>
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                  {buildNoticeScopeBadges(selected).map((b, i) => (
                    <StatusBadge key={i} label={b.label} variant={b.variant} />
                  ))}
                  {selected.isPinned && (
                    <span className="inline-flex items-center gap-0.5 px-2.5 font-bold bg-red-50 text-red-600 text-[11px] rounded-full"
                      style={{ height: '22px' }}>
                      <Pin className="w-2.5 h-2.5" /> 고정
                    </span>
                  )}
                  {selected.isImportant && (
                    <span className="inline-flex items-center gap-0.5 px-2.5 font-bold bg-amber-50 text-amber-600 text-[11px] rounded-full"
                      style={{ height: '22px' }}>
                      <Star className="w-2.5 h-2.5" /> 중요
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-900 leading-snug">{selected.title}</h2>
                <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> {selected.date}
                  <span className="ml-1">{selected.author}</span>
                </p>
              </div>

              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{selected.content}</p>

              {selected.images.length > 1 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5" /> 첨부 이미지 {selected.images.length}장
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {selected.images.map((img, i) => (
                      <button key={i} type="button" onClick={() => setLightboxImg(img)}
                        className="aspect-video rounded-xl overflow-hidden border border-gray-200 hover:opacity-90 transition-opacity">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selected.files.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5" /> 첨부파일 {selected.files.length}개
                  </p>
                  {selected.files.map((f, i) => (
                    <a key={i} href={f.data} download={f.name}
                      className="flex items-center gap-3 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors">
                      <Paperclip className="w-4 h-4 text-gray-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">{f.name}</p>
                        <p className="text-[10px] text-gray-400">{f.size}</p>
                      </div>
                      <Download className="w-4 h-4 text-primary-500 shrink-0" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {lightboxImg && (
        <div className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxImg(null)}>
          <img src={lightboxImg} alt="" className="max-w-full max-h-full rounded-2xl object-contain" />
          <button type="button" className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      )}
    </div>
  );
}

function AnnListCard({ item, onClick }: { item: Announcement; onClick: () => void }) {
  const hasThumb = item.images.length > 0;
  const important = isImportantNotice(item);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`church-list-row min-h-[88px] md:min-h-[110px] md:py-5
        ${important ? 'bg-amber-50/70 border-l-[3px] border-l-amber-500' : ''}`}
    >
      <div className="flex items-start gap-3 md:gap-4">
        {hasThumb && (
          <div className="block md:hidden shrink-0 overflow-hidden bg-gray-100 rounded-[12px]"
            style={{ width: '96px', height: '72px' }}>
            <img src={item.images[0]} alt="" className="w-full h-full object-cover"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
          </div>
        )}
        {hasThumb && (
          <div className="hidden md:block shrink-0 overflow-hidden bg-gray-100 rounded-[12px]"
            style={{ width: '120px', height: '80px' }}>
            <img src={item.images[0]} alt="" className="w-full h-full object-cover"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
            {important && (
              <span className="inline-flex items-center gap-0.5 px-2 font-bold bg-amber-100 text-amber-700 text-[10px] rounded-full"
                style={{ height: '20px' }}>
                <Star className="w-2.5 h-2.5" /> 중요
              </span>
            )}
            {buildNoticeScopeBadges(item).map((b, i) => (
              <StatusBadge key={i} label={b.label} variant={b.variant} />
            ))}
          </div>
          <h3 className="font-bold text-gray-900 leading-snug line-clamp-2" style={{ fontSize: '15px' }}>
            {item.title}
          </h3>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2 leading-snug">
            {item.content.split('\n').filter(Boolean)[0]}
          </p>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-[11px] text-gray-400 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {item.date}
            </span>
            <span className="text-[11px] text-gray-400">{item.author}</span>
            {(item.images.length > 0 || item.files.length > 0) && (
              <span className="text-[11px] text-gray-400 flex items-center gap-2 ml-auto">
                {item.images.length > 0 && (
                  <span className="flex items-center gap-0.5"><ImageIcon className="w-3 h-3" /> {item.images.length}</span>
                )}
                {item.files.length > 0 && (
                  <span className="flex items-center gap-0.5"><Paperclip className="w-3 h-3" /> {item.files.length}</span>
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function AnnGridCard({ item, onClick }: { item: Announcement; onClick: () => void }) {
  const hasThumb = item.images.length > 0;
  const important = isImportantNotice(item);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left border rounded-[20px] flex flex-col
        transition-all hover:shadow-lg hover:-translate-y-0.5 overflow-hidden
        ${important
          ? 'bg-amber-50/70 border-amber-200 border-l-4 border-l-amber-500'
          : 'bg-white border-gray-200'
        }`}
      style={{ boxShadow: '0 8px 24px rgba(15,23,42,.04)' }}
    >
      {hasThumb && (
        <div className="w-full overflow-hidden bg-gray-100" style={{ height: '140px' }}>
          <img src={item.images[0]} alt="" className="w-full h-full object-cover"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
        </div>
      )}
      <div className="flex-1 p-4">
        <div className="flex flex-wrap gap-1 mb-2">
          {important && (
            <span className="inline-flex items-center gap-0.5 px-2 font-bold bg-amber-100 text-amber-700 text-[10px] rounded-full"
              style={{ height: '20px' }}>
              <Star className="w-2.5 h-2.5" /> 중요
            </span>
          )}
          {buildNoticeScopeBadges(item).map((b, i) => (
            <StatusBadge key={i} label={b.label} variant={b.variant} />
          ))}
        </div>
        <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 mb-1">{item.title}</h3>
        <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-snug">
          {item.content.split('\n').filter(Boolean)[0]}
        </p>
        <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-auto">
          <Calendar className="w-3 h-3 shrink-0" />
          <span>{item.date}</span>
          <span className="ml-1">{item.author}</span>
        </div>
      </div>
    </button>
  );
}

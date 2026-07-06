import { useState, useMemo } from 'react';
import {
  Megaphone, Pin, X, Calendar, Star, Paperclip, ImageIcon, Download,
  Bell, SlidersHorizontal, LayoutGrid, List,
} from 'lucide-react';
import { getAllAnnouncements, type Announcement } from '../../services/announcementStorage';
import { buildNoticeScopeBadges } from '../../services/announcementHelpers';
import { getAllDistricts, getZones, getAllDepartments } from '../../services/orgData';
import { useAuth } from '../../contexts/AuthContext';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import type { AppUser } from '../../services/permissions';
import { PageHeaderBar } from '../../components/common/ui';
import StatusBadge from '../../components/layout/StatusBadge';
import EmptyState from '../../components/layout/EmptyState';

const SELECT = 'w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400 text-gray-700';

/* ── Visibility check per user role ──────────────────────────────────────── */
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

export default function AnnouncementPage() {
  const { user } = useAuth();
  const { isMobile } = useBreakpoint();

  /* ─── Visibility-scoped base list ──────────────────────────────────────── */
  const visibleAnnouncements = useMemo(
    () => getAllAnnouncements().filter(a => isAnnouncementVisible(a, user)),
    [user]
  );

  /* ─── View & search state ───────────────────────────────────────────────── */
  const [viewMode, setViewMode]       = useState<'card' | 'list'>('list');
  const effectiveViewMode             = isMobile ? 'list' : viewMode;
  const [showSearch, setShowSearch]   = useState(false);
  const [selected, setSelected]       = useState<Announcement | null>(null);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  /* ─── Filter state ──────────────────────────────────────────────────────── */
  const [fDistrict, setFDistrict] = useState('');
  const [fZone, setFZone]         = useState('');
  const [fDept, setFDept]         = useState('');
  const [fDate, setFDate]         = useState('');
  const [fText, setFText]         = useState('');

  /* ─── Role-scoped search options ────────────────────────────────────────── */
  const allDistricts = useMemo(() => getAllDistricts().filter(d => d.is_active), []);
  const allDepts     = useMemo(() => getAllDepartments().filter(d => d.is_active), []);

  const districtOptions = useMemo(() => {
    if (!user || user.role === 'super_admin') return allDistricts;
    if (user.role === 'pastor') return allDistricts.filter(d => user.assignedDistrictIds?.includes(d.id));
    return allDistricts.filter(d => d.id === user.districtId);
  }, [user, allDistricts]);

  const zonesInDistrict = useMemo(() => {
    if (!fDistrict || fDistrict === 'church') return [];
    const zones = getZones(fDistrict).filter(z => z.is_active);
    if (!user || user.role === 'super_admin') return zones;
    if (user.role === 'pastor') return zones.filter(z => user.assignedZoneIds?.includes(z.id));
    return zones.filter(z => z.id === user.zoneId);
  }, [fDistrict, user]);

  const deptOptions = useMemo(() => {
    if (!user || user.role === 'super_admin') return allDepts;
    if (user.role === 'pastor') return allDepts.filter(d => user.assignedDepartmentIds?.includes(d.id));
    return allDepts.filter(d => user.departmentIds?.includes(d.id));
  }, [user, allDepts]);

  /* ─── Advanced filter logic ─────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    return visibleAnnouncements
      .filter(a => {
        if (!fDistrict && !fDept) return true;
        if (fDistrict === 'church') return a.scope === 'all';
        if (fZone)     return a.scope === 'level2'     && a.scopeId === fZone;
        if (fDistrict) return a.scope === 'level1'     && a.scopeId === fDistrict;
        if (fDept)     return a.scope === 'department' && a.scopeId === fDept;
        return true;
      })
      .filter(a => !fDate || a.date === fDate)
      .filter(a => {
        if (!fText) return true;
        const q = fText.toLowerCase();
        return a.title.toLowerCase().includes(q) || a.content.toLowerCase().includes(q);
      });
  }, [visibleAnnouncements, fDistrict, fZone, fDept, fDate, fText]);

  const pinned  = filtered.filter(a => a.isPinned);
  const regular = filtered.filter(a => !a.isPinned);

  const resetFilters = () => {
    setFDistrict(''); setFZone(''); setFDept(''); setFDate(''); setFText('');
  };

  return (
    <div className="space-y-5 pb-8">
      <PageHeaderBar title="공지사항" description="교회 소식과 안내를 확인하세요." />

      {/* ── Toolbar ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => setShowSearch(s => !s)}
          className={`flex items-center gap-2 px-4 rounded-[14px] border text-sm font-semibold transition-all ${
            showSearch
              ? 'bg-primary-500 border-primary-500 text-white'
              : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
          }`}
          style={{ height: '44px' }}
        >
          <SlidersHorizontal style={{ width: '16px', height: '16px' }} />
          상세검색
        </button>

        {/* View mode toggle: PC only */}
        {!isMobile && (
          <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-[14px]">
            <button
              onClick={() => setViewMode('card')}
              title="카드 보기"
              className={`flex items-center justify-center rounded-xl transition-all ${
                viewMode === 'card' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-400 hover:text-gray-600'
              }`}
              style={{ width: '36px', height: '36px' }}
            >
              <LayoutGrid style={{ width: '18px', height: '18px' }} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              title="목록 보기"
              className={`flex items-center justify-center rounded-xl transition-all ${
                viewMode === 'list' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-400 hover:text-gray-600'
              }`}
              style={{ width: '36px', height: '36px' }}
            >
              <List style={{ width: '18px', height: '18px' }} />
            </button>
          </div>
        )}
      </div>

      {/* ── Advanced search panel ─────────────────────────────────────────────── */}
      {showSearch && (
        <div className="bg-white border border-gray-200 rounded-[20px] p-6">
          <div className="grid grid-cols-2 gap-4">
            {/* 상위조직 */}
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-2 block">상위조직</label>
              <select
                value={fDistrict}
                onChange={e => { setFDistrict(e.target.value); setFZone(''); }}
                className={SELECT}
              >
                <option value="">전체</option>
                <option value="church">교회공지</option>
                {districtOptions.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* 하위조직 */}
            <div>
              <label className={`text-xs font-semibold mb-2 block ${
                fDistrict && fDistrict !== 'church' ? 'text-gray-600' : 'text-gray-300'
              }`}>하위조직</label>
              <select
                value={fZone}
                onChange={e => setFZone(e.target.value)}
                disabled={!fDistrict || fDistrict === 'church'}
                className={`${SELECT} disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                <option value="">전체</option>
                {zonesInDistrict.map(z => (
                  <option key={z.id} value={z.id}>{z.name}</option>
                ))}
              </select>
            </div>

            {/* 부서 */}
            {deptOptions.length > 0 && (
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-2 block">부서</label>
                <select value={fDept} onChange={e => setFDept(e.target.value)} className={SELECT}>
                  <option value="">전체</option>
                  {deptOptions.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* 날짜 */}
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-2 block">날짜</label>
              <input
                type="date" value={fDate}
                onChange={e => setFDate(e.target.value)}
                className={SELECT}
              />
            </div>

            {/* 검색어 */}
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-600 mb-2 block">검색어</label>
              <input
                type="text" value={fText}
                onChange={e => setFText(e.target.value)}
                placeholder="제목 또는 내용을 검색하세요."
                className={SELECT}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-gray-100">
            <button
              onClick={resetFilters}
              className="px-5 py-2 border border-gray-200 rounded-[14px] text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              초기화
            </button>
            <button
              onClick={() => setShowSearch(false)}
              className="px-5 py-2 bg-primary-500 text-white rounded-[14px] text-sm font-bold hover:bg-primary-600 transition-colors"
            >
              조회
            </button>
          </div>
        </div>
      )}

      {/* ── Announcement list ─────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="공지사항이 없습니다"
          description="아직 등록된 공지사항이 없어요."
        />
      ) : (
        <div className="space-y-5">
          {pinned.length > 0 && (
            <section>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Pin className="w-3.5 h-3.5 text-red-400" /> 중요 공지
              </h3>
              {effectiveViewMode === 'list' ? (
                <div className="flex flex-col gap-3">
                  {pinned.map(a => <AnnListCard key={a.id} item={a} onClick={() => setSelected(a)} />)}
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {pinned.map(a => <AnnGridCard key={a.id} item={a} onClick={() => setSelected(a)} />)}
                </div>
              )}
            </section>
          )}

          {regular.length > 0 && (
            <section>
              {pinned.length > 0 && (
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5" /> 일반 공지
                </h3>
              )}
              {effectiveViewMode === 'list' ? (
                <div className="flex flex-col gap-3">
                  {regular.map(a => <AnnListCard key={a.id} item={a} onClick={() => setSelected(a)} />)}
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {regular.map(a => <AnnGridCard key={a.id} item={a} onClick={() => setSelected(a)} />)}
                </div>
              )}
            </section>
          )}
        </div>
      )}

      {/* ── Detail Modal ──────────────────────────────────────────────────────── */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center md:p-4">
          <div className="bg-white w-full md:max-w-2xl md:rounded-3xl rounded-t-3xl max-h-[92vh] flex flex-col shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between flex-shrink-0 rounded-t-3xl">
              <h3 className="font-bold text-gray-900">공지 상세</h3>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
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
                      <button key={i} onClick={() => setLightboxImg(img)}
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

      {/* ── Lightbox ──────────────────────────────────────────────────────────── */}
      {lightboxImg && (
        <div className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxImg(null)}>
          <img src={lightboxImg} alt="" className="max-w-full max-h-full rounded-2xl object-contain" />
          <button className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ── List card (mobile + desktop list view) ──────────────────────────────── */
function AnnListCard({ item, onClick }: { item: Announcement; onClick: () => void }) {
  const hasThumb = item.images.length > 0;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-white border transition-all
        hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,23,42,.08)]
        active:scale-[0.99] rounded-[18px] md:rounded-[20px] p-4 md:p-5
        min-h-[88px] md:min-h-[110px]
        ${item.isPinned
          ? 'border-l-[3px] border-l-primary-500 border-t-gray-200 border-r-gray-200 border-b-gray-200'
          : 'border-gray-200'
        }`}
      style={{ boxShadow: '0 8px 24px rgba(15,23,42,.04)' }}
    >
      <div className="flex items-start gap-3 md:gap-4">
        {/* Mobile thumbnail: 96×72 */}
        {hasThumb && (
          <div className="block md:hidden shrink-0 overflow-hidden bg-gray-100 rounded-[12px]"
            style={{ width: '96px', height: '72px' }}>
            <img src={item.images[0]} alt="" className="w-full h-full object-cover"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
          </div>
        )}
        {/* Desktop thumbnail: 120×80 */}
        {hasThumb && (
          <div className="hidden md:block shrink-0 overflow-hidden bg-gray-100 rounded-[12px]"
            style={{ width: '120px', height: '80px' }}>
            <img src={item.images[0]} alt="" className="w-full h-full object-cover"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
            {buildNoticeScopeBadges(item).map((b, i) => (
              <StatusBadge key={i} label={b.label} variant={b.variant} />
            ))}
            {item.isImportant && (
              <span className="inline-flex items-center gap-0.5 px-2 font-bold bg-amber-50 text-amber-500 text-[10px] rounded-full"
                style={{ height: '20px' }}>
                <Star className="w-2.5 h-2.5" /> 중요
              </span>
            )}
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

/* ── Grid card (PC card view) ────────────────────────────────────────────── */
function AnnGridCard({ item, onClick }: { item: Announcement; onClick: () => void }) {
  const hasThumb = item.images.length > 0;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-white border rounded-[20px] flex flex-col
        transition-all hover:shadow-lg hover:-translate-y-0.5 overflow-hidden
        ${item.isPinned
          ? 'border-l-4 border-l-primary-500 border-t-gray-200 border-r-gray-200 border-b-gray-200'
          : 'border-gray-200'
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
          {buildNoticeScopeBadges(item).map((b, i) => (
            <StatusBadge key={i} label={b.label} variant={b.variant} />
          ))}
          {item.isImportant && (
            <span className="inline-flex items-center gap-0.5 px-2 font-bold bg-amber-50 text-amber-500 text-[10px] rounded-full"
              style={{ height: '20px' }}>
              <Star className="w-2.5 h-2.5" /> 중요
            </span>
          )}
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

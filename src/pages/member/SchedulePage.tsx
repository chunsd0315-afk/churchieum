/**
 * 일정 — 월간 달력 + 선택 날짜 일정 (최고관리자·교역자·성도 공통)
 */

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  ChevronLeft, ChevronRight, Plus, Search, X, Loader, Clock, MapPin,
} from 'lucide-react';
import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import {
  canWriteContent,
  getAvailableScopes,
  type ContentScope,
} from '../../services/permissions';
import { getDistricts, getZones, getDepartments } from '../../services/orgData';
import {
  PageHeaderBar,
  DetailSettingsButton,
  ConfirmDialog,
} from '../../components/common/ui';
import {
  ScheduleViewToggle,
  readScheduleViewMode,
  writeScheduleViewMode,
  type ScheduleViewMode,
} from '../../components/schedule/ScheduleViewToggle';
import {
  ScheduleSearchPanel,
  ScheduleFilterChips,
  EMPTY_SCHEDULE_FILTER,
  isScheduleFilterActive,
  countScheduleDetailFilters,
  scheduleMatchesFilter,
  type ScheduleSearchFilter,
} from '../../components/schedule/ScheduleSearchPanel';
import { ScheduleMonthCalendar } from '../../components/schedule/ScheduleMonthCalendar';
import { ScheduleDayPanel } from '../../components/schedule/ScheduleDayPanel';
import { ScheduleDetailView } from '../../components/schedule/ScheduleDetailView';
import { ScheduleEventForm } from '../../components/schedule/ScheduleEventForm';
import {
  type ScheduleEvent,
  mergeEventVisibility,
  saveEventVisibility,
  isEventVisible,
  sortEventsByDateTime,
  toDateKey,
  formatEventDateLong,
  formatEventTime,
  eventTypeLabel,
  eventScopeBadge,
} from '../../services/eventHelpers';

const DEMO_EVENTS: ScheduleEvent[] = [
  { id: '1', title: '주일예배', event_date: '2026-06-22', event_time: '11:00', location: '본당', event_type: 'worship', description: '담임목사님 설교', is_recurring: false, created_at: '', visibility_type: 'all' },
  { id: '2', title: '수요예배', event_date: '2026-06-24', event_time: '19:30', location: '킹덤홀', event_type: 'worship', is_recurring: false, created_at: '', visibility_type: 'all' },
  { id: '3', title: '금요기도회', event_date: '2026-06-26', event_time: '21:00', location: '기도실', event_type: 'prayer', is_recurring: false, created_at: '', visibility_type: 'all' },
  { id: '4', title: '청년부 모임', event_date: '2026-06-22', event_time: '14:00', location: '교육관 2층', event_type: 'meeting', is_recurring: false, created_at: '', visibility_type: 'all' },
  { id: '5', title: '장로 · 권사 기도회', event_date: '2026-06-25', event_time: '06:00', location: '기도실', event_type: 'prayer', is_recurring: false, created_at: '', visibility_type: 'all' },
  { id: '6', title: '교역자 회의', event_date: '2026-09-02', event_time: '09:00', location: '교역자실', event_type: 'meeting', is_recurring: false, created_at: '', visibility_type: 'all' },
  { id: '7', title: '권사성가대 연습', event_date: '2026-09-02', event_time: '14:00', location: '성가대 연습실', event_type: 'choir', is_recurring: false, created_at: '', visibility_type: 'all' },
  { id: '8', title: '수요예배', event_date: '2026-09-02', event_time: '20:00', location: '킹덤홀', event_type: 'worship', is_recurring: false, created_at: '', visibility_type: 'all' },
  { id: '9', title: '외국인복지센터 방문', event_date: '2026-09-04', event_time: '11:00', location: '센터', event_type: 'event', is_recurring: false, created_at: '', visibility_type: 'all' },
  { id: '10', title: '주일1부예배', event_date: '2026-09-06', event_time: '09:00', location: '본당', event_type: 'worship', is_recurring: false, created_at: '', visibility_type: 'all' },
  { id: '11', title: '주일2부예배', event_date: '2026-09-06', event_time: '11:00', location: '본당', event_type: 'worship', is_recurring: false, created_at: '', visibility_type: 'all' },
  { id: '12', title: '주일3부예배', event_date: '2026-09-06', event_time: '13:00', location: '본당', event_type: 'worship', is_recurring: false, created_at: '', visibility_type: 'all' },
];

const HISTORY_KEY = 'churchieum_schedule_layer';

type ScheduleHistory = {
  [HISTORY_KEY]: true;
  layer: 'detail';
  id: string;
};

function readScheduleHistory(): ScheduleHistory | null {
  const s = window.history.state as ScheduleHistory | null;
  if (s?.[HISTORY_KEY] && s.layer === 'detail' && s.id) return s;
  return null;
}

function scopeToVisibility(scope: ContentScope): Pick<ScheduleEvent, 'visibility_type' | 'scope_id' | 'scope_name'> {
  if (scope.type === 'all') {
    return { visibility_type: 'all' };
  }
  return {
    visibility_type: scope.type,
    scope_id: scope.id,
    scope_name: scope.name,
  };
}

export default function SchedulePage() {
  const { user } = useAuth();
  const { isMobile } = useBreakpoint();
  const canWrite = canWriteContent(user);
  const orgData = { districts: getDistricts(), zones: getZones(), departments: getDepartments() };
  const availableScopes = getAvailableScopes(user, orgData);

  const today = useMemo(() => new Date(), []);
  const todayKey = toDateKey(today);

  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [viewMode, setViewModeState] = useState<ScheduleViewMode>(() => readScheduleViewMode('calendar'));
  const [detailId, setDetailId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ScheduleEvent | null>(null);
  const [formInitialDate, setFormInitialDate] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const [showSearch, setShowSearch] = useState(false);
  const [searchFilter, setSearchFilter] = useState<ScheduleSearchFilter>(EMPTY_SCHEDULE_FILTER);
  const [draftFilter, setDraftFilter] = useState<ScheduleSearchFilter>(EMPTY_SCHEDULE_FILTER);

  const listScrollRef = useRef(0);

  const setViewMode = (mode: ScheduleViewMode) => {
    setViewModeState(mode);
    writeScheduleViewMode(mode);
  };

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true });
      if (error) throw error;
      const merged = mergeEventVisibility(data && data.length > 0 ? data : DEMO_EVENTS);
      setEvents(merged);
    } catch {
      setEvents(mergeEventVisibility(DEMO_EVENTS));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const captureListScroll = useCallback(() => {
    listScrollRef.current = window.scrollY || document.documentElement.scrollTop;
  }, []);

  const restoreListScroll = useCallback(() => {
    requestAnimationFrame(() => {
      window.scrollTo({ top: listScrollRef.current, behavior: 'auto' });
    });
  }, []);

  useEffect(() => {
    const onPopState = () => {
      const hist = readScheduleHistory();
      if (hist?.layer === 'detail') {
        setDetailId(hist.id);
        setShowForm(false);
        return;
      }
      setDetailId(null);
      setShowForm(false);
      restoreListScroll();
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [restoreListScroll]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const visibleEvents = useMemo(
    () => events
      .filter(e => isEventVisible(e, user))
      .filter(e => scheduleMatchesFilter(e, searchFilter))
      .sort(sortEventsByDateTime),
    [events, user, searchFilter],
  );

  const eventsByDate = useMemo(() => {
    const map = new Map<string, ScheduleEvent[]>();
    for (const ev of visibleEvents) {
      const key = ev.event_date.slice(0, 10);
      const list = map.get(key) ?? [];
      list.push(ev);
      map.set(key, list);
    }
    for (const [, list] of map) {
      list.sort(sortEventsByDateTime);
    }
    return map;
  }, [visibleEvents]);

  const selectedDayEvents = eventsByDate.get(selectedDate) ?? [];

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const monthLabel = currentMonth.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });

  const listGrouped = useMemo(() => {
    const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
    const inMonth = visibleEvents.filter(e => e.event_date.startsWith(monthStr));
    const groups: { date: string; items: ScheduleEvent[] }[] = [];
    let last = '';
    for (const ev of inMonth) {
      const d = ev.event_date.slice(0, 10);
      if (d !== last) {
        groups.push({ date: d, items: [] });
        last = d;
      }
      groups[groups.length - 1].items.push(ev);
    }
    return groups;
  }, [visibleEvents, year, month]);

  const detailEvent = detailId ? visibleEvents.find(e => e.id === detailId) ?? events.find(e => e.id === detailId) ?? null : null;

  const setKeyword = (keyword: string) => {
    setSearchFilter({ ...searchFilter, keyword });
    setDraftFilter({ ...draftFilter, keyword });
  };

  const handleDraftChange = (f: ScheduleSearchFilter) => {
    setDraftFilter(f);
    if (f.keyword !== searchFilter.keyword) {
      setSearchFilter({ ...searchFilter, keyword: f.keyword });
    }
  };

  const resetFilters = () => {
    setSearchFilter(EMPTY_SCHEDULE_FILTER);
    setDraftFilter(EMPTY_SCHEDULE_FILTER);
    setShowSearch(false);
  };

  const goToday = () => {
    const now = new Date();
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(toDateKey(now));
  };

  const openDetail = (ev: ScheduleEvent) => {
    captureListScroll();
    setDetailId(ev.id);
    window.history.pushState(
      { [HISTORY_KEY]: true, layer: 'detail', id: ev.id } satisfies ScheduleHistory,
      '',
    );
  };

  const openNew = (dateKey?: string) => {
    if (!canWrite) return;
    setEditing(null);
    setFormInitialDate(dateKey ?? selectedDate);
    setShowForm(true);
    setDetailId(null);
  };

  const openEdit = (ev: ScheduleEvent) => {
    if (!canWrite) return;
    setEditing(ev);
    setFormInitialDate(undefined);
    setShowForm(true);
  };

  const handleSave = async ({
    event: payload,
    scope,
  }: {
    event: Omit<ScheduleEvent, 'id' | 'created_at' | 'is_recurring'>;
    scope: ContentScope;
  }) => {
    if (!canWrite || saving) return;
    setSaving(true);
    const vis = scopeToVisibility(scope);
    try {
      const dbPayload = {
        title: payload.title,
        description: payload.description ?? null,
        event_date: payload.event_date,
        event_time: payload.event_time ?? null,
        location: payload.location ?? null,
        event_type: payload.event_type,
      };

      if (editing) {
        await supabase.from('events').update(dbPayload).eq('id', editing.id);
        saveEventVisibility(editing.id, vis);
        showToast('일정이 수정되었습니다');
      } else {
        const { data } = await supabase.from('events').insert(dbPayload).select('id').single();
        const newId = data?.id ?? `local-${Date.now()}`;
        saveEventVisibility(newId, vis);
        showToast('일정이 등록되었습니다');
      }
      setShowForm(false);
      setEditing(null);
      await fetchEvents();
    } catch {
      const localId = editing?.id ?? `local-${Date.now()}`;
      const localEvent: ScheduleEvent = {
        ...payload,
        id: localId,
        is_recurring: false,
        created_at: new Date().toISOString(),
        ...vis,
      };
      saveEventVisibility(localId, vis);
      setEvents(prev => {
        if (editing) return prev.map(e => (e.id === editing.id ? localEvent : e));
        return [...prev, localEvent].sort(sortEventsByDateTime);
      });
      setShowForm(false);
      setEditing(null);
      showToast(editing ? '일정이 수정되었습니다' : '일정이 등록되었습니다');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!canWrite) return;
    try {
      await supabase.from('events').delete().eq('id', id);
    } catch {
      /* local fallback */
    }
    setEvents(prev => prev.filter(e => e.id !== id));
    setDeleteConfirm(null);
    setDetailId(null);
    showToast('삭제되었습니다');
    restoreListScroll();
  };

  const handleFormBack = () => {
    if (!window.confirm('작성 중인 내용이 있습니다.\n나가시겠습니까?')) return;
    setShowForm(false);
    setEditing(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader className="w-6 h-6 animate-spin text-primary-500" />
      </div>
    );
  }

  if (showForm && canWrite) {
    return (
      <ScheduleEventForm
        editing={editing}
        initialDate={formInitialDate}
        availableScopes={availableScopes}
        saving={saving}
        onSave={handleSave}
        onBack={handleFormBack}
      />
    );
  }

  if (detailEvent) {
    return (
      <>
        <ScheduleDetailView
          event={detailEvent}
          canManage={canWrite}
          onBack={() => {
            const hist = readScheduleHistory();
            if (hist?.layer === 'detail') {
              window.history.back();
              return;
            }
            setDetailId(null);
            restoreListScroll();
          }}
          onEdit={() => openEdit(detailEvent)}
          onDelete={() => setDeleteConfirm(detailEvent.id)}
        />
        <ConfirmDialog
          open={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
          title="일정 삭제"
          description="이 작업은 되돌릴 수 없습니다."
          variant="danger"
        />
      </>
    );
  }

  return (
    <div className="space-y-4 pb-24 md:pb-8 max-w-[1100px] mx-auto">
      <PageHeaderBar
        title="일정"
        description="교회 일정을 한눈에 확인하세요."
        action={
          canWrite ? (
            <button
              type="button"
              onClick={() => openNew()}
              className="inline-flex items-center gap-2 h-12 px-4 rounded-[18px] bg-primary-500 text-[#1A1A1A] text-sm font-bold hover:bg-primary-600 active:bg-primary-700 active:scale-[0.98] transition-all touch-target"
            >
              <Plus className="w-4 h-4" />
              일정 작성
            </button>
          ) : undefined
        }
        mobileFab={canWrite ? { label: '일정 작성', onClick: () => openNew() } : undefined}
      />

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            value={searchFilter.keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="키워드, 일정 검색"
            className="w-full pl-12 pr-12 py-3 rounded-2xl border border-gray-200 text-sm bg-white min-h-[48px] focus:border-primary-400 focus:outline-none"
          />
          {searchFilter.keyword && (
            <button
              type="button"
              onClick={() => setKeyword('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 touch-target"
              aria-label="검색어 지우기"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <DetailSettingsButton
            onClick={() => {
              if (!showSearch) setDraftFilter(searchFilter);
              setShowSearch(s => !s);
            }}
            active={showSearch}
            activeCount={countScheduleDetailFilters(searchFilter)}
            aria-expanded={showSearch}
            className="flex-1 sm:flex-none"
          />
          <ScheduleViewToggle value={viewMode} onChange={setViewMode} />
        </div>
      </div>

      {showSearch && isMobile && (
        <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-end">
          <div className="w-full bg-white rounded-t-[24px] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <h3 className="text-base font-bold text-gray-900">상세설정</h3>
              <button type="button" onClick={() => setShowSearch(false)} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 touch-target" aria-label="닫기">✕</button>
            </div>
            <ScheduleSearchPanel
              asSheet
              value={draftFilter}
              onChange={handleDraftChange}
              onApply={() => { setSearchFilter(draftFilter); setShowSearch(false); }}
              onReset={resetFilters}
            />
          </div>
        </div>
      )}

      {showSearch && !isMobile && (
        <ScheduleSearchPanel
          value={draftFilter}
          onChange={handleDraftChange}
          onApply={() => { setSearchFilter(draftFilter); setShowSearch(false); }}
          onReset={resetFilters}
        />
      )}

      {isScheduleFilterActive(searchFilter) && !showSearch && (
        <ScheduleFilterChips
          filter={searchFilter}
          onChange={f => { setSearchFilter(f); setDraftFilter(f); }}
        />
      )}

      <div className="flex items-center justify-between gap-2 bg-white rounded-[20px] border border-[#ECECEC] px-3 py-2 md:px-4 md:py-3 shadow-sm">
        <button
          type="button"
          onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
          className="p-2 rounded-xl hover:bg-gray-100 touch-target min-h-[48px] min-w-[48px] flex items-center justify-center"
          aria-label="이전 달"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
        <div className="flex items-center gap-2 flex-1 justify-center min-w-0">
          <h2 className="font-bold text-gray-900 text-base md:text-lg truncate">{monthLabel}</h2>
          <button
            type="button"
            onClick={goToday}
            className="shrink-0 px-3 py-1.5 min-h-[36px] rounded-[12px] text-xs font-bold bg-primary-50 text-primary-800 border border-primary-200 hover:bg-primary-100 transition-colors touch-target"
          >
            오늘
          </button>
        </div>
        <button
          type="button"
          onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
          className="p-2 rounded-xl hover:bg-gray-100 touch-target min-h-[48px] min-w-[48px] flex items-center justify-center"
          aria-label="다음 달"
        >
          <ChevronRight className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {viewMode === 'calendar' ? (
        <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-5 lg:items-start">
          <ScheduleMonthCalendar
            year={year}
            month={month}
            selectedDate={selectedDate}
            todayKey={todayKey}
            eventsByDate={eventsByDate}
            compact={isMobile}
            onSelectDate={setSelectedDate}
          />
          <ScheduleDayPanel
            className="hidden lg:flex mt-0 sticky top-4"
            dateKey={selectedDate}
            events={selectedDayEvents}
            canWrite={canWrite}
            onSelectEvent={openDetail}
            onAdd={() => openNew(selectedDate)}
          />
          <ScheduleDayPanel
            className="lg:hidden mt-4"
            dateKey={selectedDate}
            events={selectedDayEvents}
            canWrite={canWrite}
            onSelectEvent={openDetail}
            onAdd={() => openNew(selectedDate)}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {listGrouped.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-[24px] border border-gray-100">
              <p className="text-gray-400 text-sm">이번 달 일정이 없습니다</p>
            </div>
          ) : (
            listGrouped.map(group => (
              <section key={group.date}>
                <h3 className="text-sm font-bold text-gray-700 mb-2 px-1">
                  {formatEventDateLong(group.date)}
                </h3>
                <div className="bg-white rounded-[20px] border border-[#ECECEC] overflow-hidden divide-y divide-gray-100">
                  {group.items.map(ev => (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => openDetail(ev)}
                      className="w-full text-left px-4 py-4 hover:bg-primary-50/40 transition-colors touch-target"
                    >
                      <div className="flex items-start gap-3">
                        {ev.event_time && (
                          <span className="text-xs font-bold text-primary-700 shrink-0 w-16">
                            {formatEventTime(ev.event_time)}
                          </span>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 text-sm">{ev.title}</p>
                          {ev.location && (
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {ev.location}
                            </p>
                          )}
                          <div className="flex gap-2 mt-2 flex-wrap">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                              [{eventTypeLabel(ev.event_type)}]
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary-50 text-primary-800">
                              [{eventScopeBadge(ev)}]
                            </span>
                          </div>
                        </div>
                        {!ev.event_time && (
                          <Clock className="w-4 h-4 text-gray-300 shrink-0" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-medium">
          {toast}
        </div>
      )}
    </div>
  );
}

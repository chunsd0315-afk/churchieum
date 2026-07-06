import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight, Grid, List, Loader, X, Plus, Edit3, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { canWriteContent, getAvailableScopes, type ContentScope } from '../../services/permissions';
import { getDistricts, getZones, getDepartments } from '../../services/orgData';
import { PageHeaderBar } from '../../components/common/ui';

type ChurchEvent = {
  id: string;
  title: string;
  event_date: string;
  event_time?: string;
  end_date?: string;
  location?: string;
  event_type: string;
  description?: string;
};

const DEMO_EVENTS: ChurchEvent[] = [
  { id: '1', title: '주일예배', event_date: '2026-06-22', event_time: '11:00', location: '본당', event_type: 'worship', description: '담임목사님 설교: 히브리서 11:1' },
  { id: '2', title: '수요예배', event_date: '2026-06-24', event_time: '19:30', location: '본당', event_type: 'worship' },
  { id: '3', title: '금요기도회', event_date: '2026-06-26', event_time: '21:00', location: '기도실', event_type: 'prayer' },
  { id: '4', title: '청년부 모임', event_date: '2026-06-22', event_time: '14:00', location: '교육관 2층', event_type: 'meeting' },
  { id: '5', title: '장로 · 권사 기도회', event_date: '2026-06-25', event_time: '06:00', location: '기도실', event_type: 'prayer' },
  { id: '6', title: '주일예배', event_date: '2026-06-29', event_time: '11:00', location: '본당', event_type: 'worship' },
  { id: '7', title: '여름 수련회', event_date: '2026-07-15', event_time: '09:00', location: '강원도 속초', event_type: 'event', description: '전교인 2박 3일 여름 수련회' },
  { id: '8', title: '전교인 야외예배', event_date: '2026-08-10', event_time: '10:00', location: '서울 어린이대공원', event_type: 'event' },
];

const EVENT_COLORS: Record<string, string> = {
  worship: 'bg-primary-500', prayer: 'bg-rose-500',
  meeting: 'bg-secondary-500', event: 'bg-amber-500', church: 'bg-blue-500',
};
const EVENT_BG: Record<string, string> = {
  worship: 'bg-primary-50 text-primary-600', prayer: 'bg-rose-50 text-rose-600',
  meeting: 'bg-secondary-50 text-secondary-600', event: 'bg-amber-50 text-amber-600', church: 'bg-blue-50 text-blue-600',
};
const EVENT_LABELS: Record<string, string> = {
  worship: '예배', prayer: '기도', meeting: '모임', event: '행사', church: '교회',
};

export default function SchedulePage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date(2026, 5, 1));
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [selected, setSelected] = useState<ChurchEvent | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ChurchEvent | null>(null);

  const canWrite = canWriteContent(user);
  const orgData = { districts: getDistricts(), zones: getZones(), departments: getDepartments() };
  const availableScopes = getAvailableScopes(user, orgData);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('events')
        .select('*')
        .order('event_date');
      setEvents(data && data.length > 0 ? data : DEMO_EVENTS);
      setLoading(false);
    })();
  }, []);

  const handleCreateEvent = (ev: ChurchEvent) => {
    if (editingEvent) {
      setEvents(prev => prev.map(e => e.id === ev.id ? ev : e));
    } else {
      setEvents(prev => [ev, ...prev]);
    }
    setShowCreateForm(false);
    setEditingEvent(null);
  };

  const handleDeleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
    setSelected(null);
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  const pad = (n: number) => String(n).padStart(2, '0');
  const monthStr = `${year}-${pad(month + 1)}`;

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${pad(month + 1)}-${pad(day)}`;
    return events.filter(e => e.event_date === dateStr);
  };

  const monthEvents = events
    .filter(e => e.event_date.startsWith(monthStr))
    .sort((a, b) => {
      if (a.event_date !== b.event_date) return a.event_date.localeCompare(b.event_date);
      return (a.event_time || '').localeCompare(b.event_time || '');
    });

  if (loading) {
    return <div className="flex items-center justify-center h-48"><Loader className="w-6 h-6 animate-spin text-primary-500" /></div>;
  }

  return (
    <div className="pb-8 space-y-4">
      <PageHeaderBar
        title="일정"
        description="교회 예배와 행사 일정을 확인하세요."
        action={
          <div className="flex items-center gap-2">
            {canWrite && (
              <button
                onClick={() => { setEditingEvent(null); setShowCreateForm(true); }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary-500 text-white rounded-full text-sm font-semibold hover:bg-primary-600 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" /> 일정 등록
              </button>
            )}
            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
              <button onClick={() => setViewMode('calendar')} className={`p-2 rounded-lg transition-colors ${viewMode === 'calendar' ? 'bg-white shadow-sm' : ''}`}>
                <Grid className="w-4 h-4 text-gray-600" />
              </button>
              <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}>
                <List className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        }
      />

      {/* Month nav */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-2 hover:bg-gray-100 rounded-xl">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="font-bold text-gray-900">
          {currentDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
        </h3>
        <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-2 hover:bg-gray-100 rounded-xl">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Calendar Grid */}
      {viewMode === 'calendar' && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="grid grid-cols-7 mb-2">
            {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
              <div key={d} className={`text-center text-xs font-semibold py-1 ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'}`}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={i} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayEvents = getEventsForDay(day);
              const isToday = isCurrentMonth && today.getDate() === day;
              return (
                <div key={day} className="aspect-square flex flex-col items-center justify-start pt-1 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => dayEvents.length > 0 && setSelected(dayEvents[0])}>
                  <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium ${isToday ? 'bg-primary-500 text-white' : 'text-gray-700'}`}>{day}</span>
                  <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                    {dayEvents.slice(0, 3).map((e, ei) => (
                      <div key={ei} className={`w-1.5 h-1.5 rounded-full ${EVENT_COLORS[e.event_type] || 'bg-gray-400'}`} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-100 flex-wrap">
            {Object.entries(EVENT_LABELS).slice(0, 4).map(([type, label]) => (
              <div key={type} className="flex items-center gap-1 text-xs text-gray-500">
                <div className={`w-2 h-2 rounded-full ${EVENT_COLORS[type]}`} />
                {label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Event List */}
      <div className="space-y-2.5">
        {(viewMode === 'list' ? monthEvents : monthEvents.slice(0, 5)).map(e => (
          <button key={e.id} onClick={() => setSelected(e)}
            className="w-full text-left bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-start gap-3.5 hover:shadow-md active:scale-[0.99] transition-all">
            <div className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${EVENT_BG[e.event_type] || 'bg-gray-50 text-gray-500'}`}>
              <span className="text-sm font-bold">{new Date(e.event_date).getDate()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${EVENT_BG[e.event_type] || 'bg-gray-50 text-gray-500'}`}>
                  {EVENT_LABELS[e.event_type] || e.event_type}
                </span>
              </div>
              <h4 className="font-semibold text-gray-900 text-sm">{e.title}</h4>
              {e.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{e.description}</p>}
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                {e.event_time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{e.event_time}</span>}
                {e.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{e.location}</span>}
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" />
          </button>
        ))}
        {monthEvents.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl">
            <Calendar className="w-14 h-14 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">이번 달 일정이 없습니다</p>
          </div>
        )}
      </div>

      {/* Event Detail Sheet */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-lg rounded-t-3xl p-5 pb-8">
            <div className="flex items-center justify-between mb-4">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${EVENT_BG[selected.event_type] || 'bg-gray-50 text-gray-500'}`}>
                {EVENT_LABELS[selected.event_type] || selected.event_type}
              </span>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">{selected.title}</h2>
            {selected.description && <p className="text-sm text-gray-600 mb-4 leading-relaxed">{selected.description}</p>}
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3">
                <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span>{new Date(selected.event_date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</span>
              </div>
              {selected.event_time && (
                <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3">
                  <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span>{selected.event_time}</span>
                </div>
              )}
              {selected.location && (
                <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3">
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span>{selected.location}</span>
                </div>
              )}
            </div>
            {canWrite && (
              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => { setEditingEvent(selected); setSelected(null); setShowCreateForm(true); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-primary-50 text-primary-600 rounded-xl text-sm font-semibold hover:bg-primary-100"
                >
                  <Edit3 className="w-4 h-4" /> 수정
                </button>
                <button
                  onClick={() => handleDeleteEvent(selected.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-red-50 text-red-500 rounded-xl text-sm font-semibold hover:bg-red-100"
                >
                  <Trash2 className="w-4 h-4" /> 삭제
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create / Edit Form */}
      {showCreateForm && (
        <CreateEventModal
          editing={editingEvent}
          availableScopes={availableScopes}
          onSave={handleCreateEvent}
          onClose={() => { setShowCreateForm(false); setEditingEvent(null); }}
        />
      )}
    </div>
  );
}

const SCOPE_TYPE_LABEL: Record<string, string> = {
  all: '전체 성도', district: '특정 교구', zone: '특정 구역', department: '특정 부서',
};

function CreateEventModal({
  editing,
  availableScopes,
  onSave,
  onClose,
}: {
  editing: ChurchEvent | null;
  availableScopes: ContentScope[];
  onSave: (e: ChurchEvent) => void;
  onClose: () => void;
}) {
  const [title, setTitle]       = useState(editing?.title ?? '');
  const [date, setDate]         = useState(editing?.event_date ?? new Date().toISOString().slice(0, 10));
  const [time, setTime]         = useState(editing?.event_time ?? '');
  const [location, setLocation] = useState(editing?.location ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [eventType, setEventType] = useState(editing?.event_type ?? 'worship');
  const [scope, setScope]       = useState<ContentScope>(availableScopes[0] ?? { type: 'all', name: '전체 성도' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) return;
    const ev: ChurchEvent = {
      id: editing?.id ?? `local-${Date.now()}`,
      title: title.trim(),
      event_date: date,
      event_time: time || undefined,
      location: location || undefined,
      description: description || undefined,
      event_type: eventType,
    };
    onSave(ev);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-5 py-4 border-b border-gray-100 flex items-center justify-between rounded-t-3xl z-10">
          <h3 className="font-bold text-gray-900">{editing ? '일정 수정' : '일정 등록'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">제목 *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="일정 제목을 입력하세요"
              className="w-full px-3.5 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:ring-0" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">날짜 *</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} required
                className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:ring-0" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">시간</label>
              <input type="time" value={time} onChange={e => setTime(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:ring-0" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">장소</label>
            <input value={location} onChange={e => setLocation(e.target.value)} placeholder="장소 입력"
              className="w-full px-3.5 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:ring-0" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">설명</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="일정 설명"
              className="w-full px-3.5 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:ring-0 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">유형</label>
              <select value={eventType} onChange={e => setEventType(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:ring-0">
                {Object.entries(EVENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">공개 범위</label>
              <select
                value={availableScopes.indexOf(scope)}
                onChange={e => setScope(availableScopes[Number(e.target.value)] ?? scope)}
                className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:ring-0"
              >
                {availableScopes.map((s, i) => (
                  <option key={i} value={i}>{SCOPE_TYPE_LABEL[s.type]} {s.name && s.type !== 'all' ? `(${s.name})` : ''}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-3 border border-gray-200 text-gray-600 font-semibold rounded-2xl text-sm">취소</button>
            <button type="submit" className="flex-1 py-3 bg-primary-500 text-white font-bold rounded-2xl text-sm hover:bg-primary-600">
              {editing ? '수정 저장' : '일정 등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

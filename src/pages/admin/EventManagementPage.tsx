import { useState, useEffect } from 'react';
import { supabase, ChurchEvent } from '../../services/supabase';
import { Calendar, Edit, Trash2, Clock, MapPin, Save } from 'lucide-react';
import ContentEditorLayout from '../../components/layout/ContentEditorLayout';
import { PageLayout, Badge, ConfirmDialog } from '../../components/common/ui';
import { useBreakpoint } from '../../hooks/useBreakpoint';

export default function EventManagementPage() {
  const { isDesktop: _isDesktop } = useBreakpoint();
  const [events, setEvents] = useState<ChurchEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ChurchEvent | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [location, setLocation] = useState('');
  const [eventType, setEventType] = useState('church');
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => { fetchEvents(); }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('events').select('*').order('event_date', { ascending: true });
      setEvents(data || []);
    } catch (e) { console.error('Error fetching events:', e); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    if (!title || !eventDate || saving) return;
    setSaving(true);
    try {
      const payload = { title, description: description || null, event_date: eventDate, event_time: eventTime || null, location: location || null, event_type: eventType };
      if (editing) await supabase.from('events').update(payload).eq('id', editing.id);
      else await supabase.from('events').insert(payload);
      resetForm();
      fetchEvents();
    } catch (e) { console.error('Error saving event:', e); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('events').delete().eq('id', id);
    setDeleteId(null);
    fetchEvents();
  };

  const resetForm = () => { setShowForm(false); setEditing(null); setTitle(''); setDescription(''); setEventDate(''); setEventTime(''); setLocation(''); setEventType('church'); };
  const handleBack = () => { if (!!(title.trim() || eventDate) && !window.confirm('작성 중인 내용이 있습니다.\n나가시겠습니까?')) return; resetForm(); };
  const openEdit = (event: ChurchEvent) => { setEditing(event); setTitle(event.title); setDescription(event.description || ''); setEventDate(event.event_date); setEventTime(event.event_time || ''); setLocation(event.location || ''); setEventType(event.event_type || 'church'); setShowForm(true); };

  const eventTypes = [{ value: 'worship', label: '예배' }, { value: 'prayer', label: '기도회' }, { value: 'meeting', label: '모임' }, { value: 'event', label: '행사' }, { value: 'church', label: '교회일정' }];
  const eventTypeColors: Record<string, { bg: string; text: string }> = {
    worship: { bg: 'bg-primary-100', text: 'text-primary-700' },
    prayer:  { bg: 'bg-rose-100',    text: 'text-rose-700' },
    meeting: { bg: 'bg-teal-100',    text: 'text-teal-700' },
    event:   { bg: 'bg-amber-100',   text: 'text-amber-700' },
    church:  { bg: 'bg-violet-100',  text: 'text-violet-700' },
  };

  const formFields = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">날짜</label>
          <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none" required />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">시간</label>
          <input type="time" value={eventTime} onChange={e => setEventTime(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none" />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">제목</label>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="주일예배" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none" required />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">장소</label>
        <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="본당" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none" />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">유형</label>
        <select value={eventType} onChange={e => setEventType(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none">
          {eventTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">설명</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="상세 설명" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none resize-none" rows={3} />
      </div>
    </div>
  );

  if (showForm) {
    return (
      <ContentEditorLayout title={editing ? '일정 수정' : '일정 등록'} onBack={handleBack}
        saveButton={
          <button onClick={handleSubmit} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors">
            <Save className="w-4 h-4" />{saving ? '저장 중...' : '저장'}
          </button>
        }
      >{formFields}</ContentEditorLayout>
    );
  }

  return (
    <>
      <PageLayout
        header={{ title: '일정', description: '교회 예배와 행사 일정을 확인하세요.' }}
        addButton={{ label: '일정 등록', onClick: () => setShowForm(true) }}
        loading={loading}
        skeletonCount={4}
        empty={{ icon: <Calendar size={28} />, title: '등록된 일정이 없습니다' }}
      >
        {!loading && events.map(event => {
          const tc = eventTypeColors[event.event_type] ?? { bg: 'bg-gray-100', text: 'text-gray-700' };
          const typeLabel = eventTypes.find(t => t.value === event.event_type)?.label ?? '일정';
          return (
            <div key={event.id} className="bg-white rounded-card border border-gray-200 shadow-card-md p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 ${tc.bg}`}>
                    <span className={`text-lg font-bold ${tc.text}`}>{new Date(event.event_date).getDate()}</span>
                    <span className={`text-[10px] opacity-80 ${tc.text}`}>{new Date(event.event_date).toLocaleDateString('ko-KR', { month: 'short' })}</span>
                  </div>
                  <div>
                    <Badge variant="gray" size="sm">{typeLabel}</Badge>
                    <h3 className="font-bold text-gray-900 mt-1">{event.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      {event.event_time && <span className="flex items-center gap-1"><Clock size={12} />{event.event_time.substring(0, 5)}</span>}
                      {event.location && <span className="flex items-center gap-1"><MapPin size={12} />{event.location}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(event)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><Edit className="w-4 h-4 text-gray-500" /></button>
                  <button onClick={() => setDeleteId(event.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4 text-red-400" /></button>
                </div>
              </div>
            </div>
          );
        })}
      </PageLayout>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        title="일정 삭제"
        description="이 작업은 되돌릴 수 없습니다."
        variant="danger"
      />
    </>
  );
}

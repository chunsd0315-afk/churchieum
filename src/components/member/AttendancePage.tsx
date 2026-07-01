import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { CheckSquare, Calendar, Check, X, TrendingUp, Loader } from 'lucide-react';

type AttendanceRecord = {
  id: string;
  member_id?: string;
  date?: string;
  attendance_date?: string;
  worship_type: string;
  is_present: boolean;
};

const WORSHIP_TYPES = [
  { key: 'sunday_main', label: '주일예배' },
  { key: 'wednesday', label: '수요예배' },
  { key: 'friday', label: '금요기도회' },
];

const DEMO_HISTORY: AttendanceRecord[] = [
  { id: '1', attendance_date: '2026-06-22', worship_type: 'sunday_main', is_present: true },
  { id: '2', attendance_date: '2026-06-18', worship_type: 'wednesday', is_present: true },
  { id: '3', attendance_date: '2026-06-15', worship_type: 'sunday_main', is_present: true },
  { id: '4', attendance_date: '2026-06-11', worship_type: 'wednesday', is_present: true },
  { id: '5', attendance_date: '2026-06-08', worship_type: 'sunday_main', is_present: true },
  { id: '6', attendance_date: '2026-06-04', worship_type: 'wednesday', is_present: false },
  { id: '7', attendance_date: '2026-06-01', worship_type: 'sunday_main', is_present: true },
  { id: '8', attendance_date: '2026-05-28', worship_type: 'wednesday', is_present: true },
  { id: '9', attendance_date: '2026-05-25', worship_type: 'sunday_main', is_present: true },
  { id: '10', attendance_date: '2026-05-21', worship_type: 'wednesday', is_present: false },
];

export default function AttendancePage() {
  const { user } = useAuth();
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayChecked, setTodayChecked] = useState<Set<string>>(new Set());
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('attendance')
        .select('*')
        .order('attendance_date', { ascending: false })
        .limit(50);
      setHistory(data && data.length > 0 ? data : DEMO_HISTORY);

      // Check if already checked in today
      const todayRecords = (data || DEMO_HISTORY).filter(r => (r.attendance_date || r.date) === today);
      setTodayChecked(new Set(todayRecords.map(r => r.worship_type)));
      setLoading(false);
    })();
  }, []);

  const handleCheckIn = async (worshipType: string) => {
    if (todayChecked.has(worshipType)) return;
    const newRecord: AttendanceRecord = {
      id: Date.now().toString(),
      attendance_date: today,
      worship_type: worshipType,
      is_present: true,
    };
    try {
      await supabase.from('attendance').insert({
        attendance_date: today,
        worship_type: worshipType,
        is_present: true,
      });
    } catch { /* ignore */ }
    setHistory([newRecord, ...history]);
    setTodayChecked(prev => new Set([...prev, worshipType]));
  };

  const getDate = (r: AttendanceRecord) => r.attendance_date || r.date || '';
  const currentMonthStr = today.substring(0, 7);
  const monthRecords = history.filter(r => getDate(r).startsWith(currentMonthStr));
  const presentCount = monthRecords.filter(r => r.is_present).length;
  const sundayCount = history.filter(r => r.worship_type === 'sunday_main' && r.is_present).length;
  const totalRate = Math.round((history.filter(r => r.is_present).length / Math.max(1, history.length)) * 100);

  const getLabel = (key: string) => WORSHIP_TYPES.find(w => w.key === key)?.label || key;

  if (loading) {
    return <div className="flex items-center justify-center h-48"><Loader className="w-6 h-6 animate-spin text-primary-500" /></div>;
  }

  return (
    <div className="pb-8 space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
          <CheckSquare className="w-6 h-6 text-secondary-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-gray-900">{sundayCount}</p>
          <p className="text-xs text-gray-500">주일 출석</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
          <Calendar className="w-6 h-6 text-primary-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-gray-900">{presentCount}</p>
          <p className="text-xs text-gray-500">이번 달</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
          <TrendingUp className="w-6 h-6 text-amber-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-gray-900">{totalRate}%</p>
          <p className="text-xs text-gray-500">출석률</p>
        </div>
      </div>

      {/* Today check-in */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary-500" />
          오늘 출석체크
        </h3>
        <p className="text-xs text-gray-400 mb-3">
          {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
        </p>
        <div className="space-y-2.5">
          {WORSHIP_TYPES.map(w => {
            const checked = todayChecked.has(w.key);
            return (
              <button key={w.key} onClick={() => handleCheckIn(w.key)} disabled={checked}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl font-medium text-sm transition-all ${
                  checked
                    ? 'bg-secondary-50 text-secondary-700 border border-secondary-200'
                    : 'bg-gray-50 text-gray-700 border border-gray-100 hover:bg-primary-50 hover:border-primary-200 hover:text-primary-700'
                }`}>
                <span>{w.label}</span>
                {checked
                  ? <span className="flex items-center gap-1 text-secondary-600 text-xs"><Check className="w-4 h-4" /> 출석완료</span>
                  : <CheckSquare className="w-5 h-5 text-gray-400" />
                }
              </button>
            );
          })}
        </div>
      </div>

      {/* Monthly attendance grid */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary-400" />
          {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })} 출석 현황
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() }).map((_, i) => {
            const day = i + 1;
            const dateStr = `${currentMonthStr}-${String(day).padStart(2, '0')}`;
            const dayRecords = history.filter(r => getDate(r) === dateStr);
            const hasPresent = dayRecords.some(r => r.is_present);
            const isToday = day === new Date().getDate();
            return (
              <div key={day}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold transition-all ${
                  isToday
                    ? 'ring-2 ring-primary-500'
                    : ''
                } ${
                  hasPresent
                    ? 'bg-secondary-500 text-white'
                    : dayRecords.length > 0
                    ? 'bg-red-100 text-red-400'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                {day}
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-secondary-500" /> 출석</span>
          <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-red-100" /> 결석</span>
          <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-gray-100" /> 미기록</span>
        </div>
      </div>

      {/* History list */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 text-sm">최근 출석 기록</h3>
          <span className="text-xs text-gray-400">{history.length}건</span>
        </div>
        <div className="divide-y divide-gray-50">
          {history.slice(0, 15).map(r => (
            <div key={r.id} className="flex items-center gap-3.5 px-4 py-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${r.is_present ? 'bg-secondary-100 text-secondary-600' : 'bg-red-100 text-red-400'}`}>
                {r.is_present ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{getLabel(r.worship_type)}</p>
                <p className="text-xs text-gray-400">
                  {new Date(getDate(r)).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
                </p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${r.is_present ? 'bg-secondary-100 text-secondary-600' : 'bg-red-100 text-red-400'}`}>
                {r.is_present ? '출석' : '결석'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

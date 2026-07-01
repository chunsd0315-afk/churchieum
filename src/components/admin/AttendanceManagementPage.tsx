import { useEffect, useState } from 'react';
import { supabase, Member, Attendance } from '../../lib/supabase';
import { CheckSquare, Calendar, Check, Search } from 'lucide-react';

export default function AttendanceManagementPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [worshipType, setWorshipType] = useState('main');
  const [searchQuery, setSearchQuery] = useState('');

  const worshipTypes = [
    { key: 'morning', label: '오전예배' },
    { key: 'main', label: '주일예배' },
    { key: 'afternoon', label: '오후예배' },
    { key: 'wednesday', label: '수요예배' },
    { key: 'friday', label: '금요예배' },
  ];

  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate, worshipType]);

  const fetchMembers = async () => {
    const { data } = await supabase.from('members').select('*').eq('is_active', true).order('name');
    if (data) setMembers(data);
    setLoading(false);
  };

  const fetchAttendance = async () => {
    const { data } = await supabase.from('attendance').select('*').eq('attendance_date', selectedDate).eq('worship_type', worshipType);
    if (data) setAttendance(data);
  };

  const handleAttendance = async (memberId: string, isPresent: boolean) => {
    try {
      if (isPresent) {
        await supabase.from('attendance').upsert({
          member_id: memberId,
          worship_type: worshipType,
          attendance_date: selectedDate,
          is_present: true,
        });
      } else {
        await supabase.from('attendance').delete().match({
          member_id: memberId,
          worship_type: worshipType,
          attendance_date: selectedDate,
        });
      }
      fetchAttendance();
    } catch (e) {
      console.error('Error updating attendance:', e);
    }
  };

  const isPresent = (memberId: string) => {
    return attendance.some(a => a.member_id === memberId && a.is_present);
  };

  const filteredMembers = members.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const presentCount = attendance.filter(a => a.is_present).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Date & Worship Type Selection */}
      <div className="card grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">날짜</label>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">예배</label>
          <select value={worshipType} onChange={(e) => setWorshipType(e.target.value)} className="input-field">
            {worshipTypes.map(w => <option key={w.key} value={w.key}>{w.label}</option>)}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="card flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-gray-500" />
          <span className="text-gray-600">출석 현황</span>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary-500">{presentCount}</p>
          <p className="text-xs text-gray-500">/ {members.length}명</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input type="text" placeholder="이름 검색" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="input-field pl-10" />
      </div>

      {/* Member List */}
      <div className="space-y-2">
        {filteredMembers.map(member => (
          <button
            key={member.id}
            onClick={() => handleAttendance(member.id, !isPresent(member.id))}
            className={`card w-full flex items-center justify-between ${
              isPresent(member.id) ? 'bg-secondary-50 border-secondary-200' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isPresent(member.id) ? 'bg-secondary-500 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                {isPresent(member.id) ? <Check className="w-5 h-5" /> : <span className="text-sm font-medium">{member.name[0]}</span>}
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">{member.name}</p>
                <p className="text-xs text-gray-500">{member.phone || ''}</p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm ${
              isPresent(member.id) ? 'bg-secondary-500 text-white' : 'bg-gray-100 text-gray-500'
            }`}>
              {isPresent(member.id) ? '출석' : '미출석'}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Briefcase, Plus, Search, Edit, Trash2, X, Phone, Mail,
  Check, Building, Users, UserPlus,
} from 'lucide-react';

type StaffRole = '담임목사' | '부목사' | '전도사' | '사무장' | '간사' | '직원';

type Staff = {
  id: string;
  name: string;
  role: StaffRole;
  phone: string;
  email: string;
  department: string;
  join_date: string;
  is_active: boolean;
};

const ROLE_COLORS: Record<StaffRole, string> = {
  '담임목사': 'bg-amber-100 text-amber-700',
  '부목사':   'bg-orange-100 text-orange-700',
  '전도사':   'bg-violet-100 text-violet-700',
  '사무장':   'bg-teal-100 text-teal-700',
  '간사':     'bg-green-100 text-green-700',
  '직원':     'bg-gray-100 text-gray-600',
};

const STAFF_ROLES: StaffRole[] = ['담임목사', '부목사', '전도사', '사무장', '간사', '직원'];
const DB_STAFF_ROLES = ['담임목사', '목사', '전도사', '부목사', '사무장', '간사', '직원'];
const DEPARTMENTS = ['교역부', '행정부', '교육부', '찬양팀', '청소년부', '어린이부', '선교부', '기타'];

const DEMO_STAFF: Staff[] = [
  { id: '1', name: '김성기', role: '담임목사', phone: '010-1000-0001', email: 'pastor@sfbc.kr',  department: '교역부',  join_date: '2000-03-01', is_active: true },
  { id: '2', name: '이재훈', role: '부목사',   phone: '010-1000-0002', email: 'pastor2@sfbc.kr', department: '교육부',  join_date: '2015-01-01', is_active: true },
  { id: '3', name: '박지영', role: '전도사',   phone: '010-1000-0003', email: 'jy@sfbc.kr',      department: '청소년부', join_date: '2020-03-01', is_active: true },
  { id: '4', name: '최민수', role: '전도사',   phone: '010-1000-0004', email: 'ms@sfbc.kr',      department: '어린이부', join_date: '2021-09-01', is_active: true },
  { id: '5', name: '한수진', role: '사무장',   phone: '010-1000-0005', email: 'admin@sfbc.kr',   department: '행정부',  join_date: '2018-06-01', is_active: true },
  { id: '6', name: '오태양', role: '간사',     phone: '010-1000-0006', email: 'oty@sfbc.kr',     department: '찬양팀',  join_date: '2023-02-01', is_active: true },
];

const EMPTY_FORM: Omit<Staff, 'id'> = {
  name: '', role: '전도사', phone: '', email: '', department: '교역부', join_date: '', is_active: true,
};

export default function StaffManagementPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbLoaded, setDbLoaded] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<StaffRole | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [form, setForm] = useState<Omit<Staff, 'id'>>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Staff | null>(null);

  const f = <K extends keyof typeof form>(k: K, v: typeof form[K]) =>
    setForm(prev => ({ ...prev, [k]: v }));

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('members')
        .select('*')
        .in('role', DB_STAFF_ROLES)
        .order('name');
      if (data && data.length > 0) {
        setStaff(data.map(m => ({
          id: m.id,
          name: m.name,
          role: (m.role as StaffRole) || '직원',
          phone: m.phone || '',
          email: m.email || '',
          department: '',
          join_date: m.join_date || '',
          is_active: m.is_active,
        })));
        setDbLoaded(true);
      } else {
        setStaff(DEMO_STAFF);
      }
      setLoading(false);
    })();
  }, []);

  const filtered = staff.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.name.includes(search) || s.phone.includes(search) || s.email.toLowerCase().includes(q);
    const matchRole = roleFilter === 'all' || s.role === roleFilter;
    return matchSearch && matchRole;
  });

  const openNew = () => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); };
  const openEdit = (s: Staff) => {
    setEditing(s);
    setForm({ name: s.name, role: s.role, phone: s.phone, email: s.email, department: s.department, join_date: s.join_date, is_active: s.is_active });
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (dbLoaded) {
        const payload = {
          name: form.name,
          role: form.role,
          phone: form.phone || null,
          email: form.email || null,
          join_date: form.join_date || null,
          is_active: form.is_active,
          updated_at: new Date().toISOString(),
        };
        if (editing) {
          await supabase.from('members').update(payload).eq('id', editing.id);
          setStaff(prev => prev.map(s => s.id === editing.id ? { ...s, ...form } : s));
        } else {
          const { data } = await supabase.from('members').insert({ ...payload, user_id: crypto.randomUUID() }).select().single();
          if (data) setStaff(prev => [{ id: data.id, ...form }, ...prev]);
        }
      } else {
        if (editing) {
          setStaff(prev => prev.map(s => s.id === editing.id ? { ...s, ...form } : s));
        } else {
          setStaff(prev => [{ id: Date.now().toString(), ...form }, ...prev]);
        }
      }
      setShowForm(false);
    } catch { /* ignore */ }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    if (dbLoaded) {
      await supabase.from('members').delete().eq('id', deleteConfirm.id);
    }
    setStaff(prev => prev.filter(s => s.id !== deleteConfirm.id));
    setDeleteConfirm(null);
  };

  const roleCounts = STAFF_ROLES.reduce((acc, r) => ({
    ...acc,
    [r]: staff.filter(s => s.role === r).length,
  }), {} as Record<string, number>);

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Stats cards */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
        {STAFF_ROLES.map(r => (
          <button key={r} onClick={() => setRoleFilter(roleFilter === r ? 'all' : r)}
            className={`rounded-2xl p-3 text-center transition-all ${roleFilter === r ? 'bg-primary-500 text-white shadow-sm' : 'bg-white border border-gray-100 shadow-sm hover:shadow-md'}`}>
            <p className={`text-xl font-bold ${roleFilter === r ? 'text-white' : 'text-gray-900'}`}>{roleCounts[r] || 0}</p>
            <p className={`text-[10px] mt-0.5 ${roleFilter === r ? 'text-white/80' : 'text-gray-400'}`}>{r}</p>
          </button>
        ))}
      </div>

      {/* Search + add */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="이름, 전화번호, 이메일 검색"
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:border-primary-400 focus:ring-0 shadow-sm" />
        </div>
        <button onClick={openNew}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors shadow-sm whitespace-nowrap">
          <UserPlus className="w-4 h-4" /> 직원 등록
        </button>
      </div>

      {!dbLoaded && !loading && (
        <div className="flex items-center justify-center">
          <span className="bg-amber-50 text-amber-600 text-xs px-3 py-1 rounded-full font-semibold">데모 데이터</span>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-14 bg-white rounded-2xl border border-gray-100">
          <Briefcase className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">등록된 교역자/직원이 없습니다</p>
          <button onClick={openNew} className="mt-3 text-primary-500 text-sm font-medium hover:underline">
            지금 등록하기
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map(s => (
            <div key={s.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4 flex items-center gap-3 group hover:shadow-md transition-shadow">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center flex-shrink-0 text-lg font-bold text-primary-700">
                {s.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="font-bold text-gray-900">{s.name}</span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${ROLE_COLORS[s.role]}`}>{s.role}</span>
                  {s.department && s.department !== '교역부' && (
                    <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Building className="w-2.5 h-2.5" />{s.department}
                    </span>
                  )}
                  {!s.is_active && (
                    <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">비활성</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                  {s.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{s.phone}</span>}
                  {s.email && <span className="flex items-center gap-1 truncate"><Mail className="w-3 h-3" />{s.email}</span>}
                  {s.join_date && <span className="text-gray-300">부임 {s.join_date}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button onClick={() => openEdit(s)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <Edit className="w-4 h-4 text-gray-400" />
                </button>
                <button onClick={() => setDeleteConfirm(s)} className="p-2 hover:bg-red-50 rounded-xl transition-colors">
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-5 py-4 border-b border-gray-100 flex items-center justify-between rounded-t-3xl z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-primary-600" />
                </div>
                <h3 className="font-bold text-gray-900">{editing ? '직원 수정' : '직원 등록'}</h3>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">이름 *</label>
                  <input type="text" value={form.name} onChange={e => f('name', e.target.value)} required autoFocus
                    className="w-full px-3.5 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:ring-0" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">직분/직책</label>
                  <select value={form.role} onChange={e => f('role', e.target.value as StaffRole)}
                    className="w-full px-3.5 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:ring-0">
                    {STAFF_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">전화번호</label>
                <input type="tel" value={form.phone} onChange={e => f('phone', e.target.value)}
                  placeholder="010-0000-0000"
                  className="w-full px-3.5 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:ring-0" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">이메일</label>
                <input type="email" value={form.email} onChange={e => f('email', e.target.value)}
                  className="w-full px-3.5 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:ring-0" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">담당 부서</label>
                  <select value={form.department} onChange={e => f('department', e.target.value)}
                    className="w-full px-3.5 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:ring-0">
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">부임일</label>
                  <input type="date" value={form.join_date} onChange={e => f('join_date', e.target.value)}
                    className="w-full px-3.5 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:ring-0" />
                </div>
              </div>
              <button type="button" onClick={() => f('is_active', !form.is_active)}
                className="flex items-center gap-2.5 cursor-pointer">
                <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${form.is_active ? 'bg-primary-500' : 'bg-white border-2 border-gray-300'}`}>
                  {form.is_active && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="text-sm text-gray-700">재직 중</span>
              </button>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-3.5 border border-gray-200 text-gray-600 font-semibold rounded-2xl hover:bg-gray-50 text-sm">
                  취소
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-3.5 bg-primary-500 text-white font-bold rounded-2xl hover:bg-primary-600 disabled:opacity-50 text-sm">
                  {saving ? '저장 중...' : (editing ? '수정 저장' : '등록')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-1">직원을 삭제하시겠습니까?</h3>
            <p className="text-sm text-gray-500 mb-6"><strong>{deleteConfirm.name}</strong> ({deleteConfirm.role}) 을 삭제합니다.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-3.5 border border-gray-200 text-gray-600 font-semibold rounded-2xl hover:bg-gray-50">
                취소
              </button>
              <button onClick={handleDelete}
                className="flex-1 py-3.5 bg-red-500 text-white font-bold rounded-2xl hover:bg-red-600">
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

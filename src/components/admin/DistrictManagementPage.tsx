/**
 * 교구관리 — 교구 목록 CRUD
 */
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { MapPin, Plus, Edit3, Trash2, X, CheckCircle, XCircle, ChevronRight, Users } from 'lucide-react';
import { useOrgSettings } from '../../contexts/OrgSettingsContext';

type District = {
  id: string;
  name: string;
  description: string | null;
  leader_name: string | null;
  is_active: boolean;
  sort_order: number;
  member_count?: number;
};

const DEMO: District[] = [
  { id: '1', name: '1교구', description: '서울 북부 지역', leader_name: '김성기 목사', is_active: true, sort_order: 1, member_count: 42 },
  { id: '2', name: '2교구', description: '서울 중부 지역', leader_name: '이준혁 목사', is_active: true, sort_order: 2, member_count: 35 },
  { id: '3', name: '3교구', description: '서울 남부 지역', leader_name: '박성실 전도사', is_active: true, sort_order: 3, member_count: 28 },
  { id: '4', name: '4교구', description: '경기 북부 지역', leader_name: '최은혜 전도사', is_active: false, sort_order: 4, member_count: 0 },
];

type FormData = { name: string; description: string; leader_name: string; is_active: boolean; sort_order: string };
const EMPTY: FormData = { name: '', description: '', leader_name: '', is_active: true, sort_order: '0' };

export default function DistrictManagementPage() {
  const { l1 } = useOrgSettings();
  const [districts, setDistricts] = useState<District[]>([]);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<District | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.from('church_districts').select('*').order('sort_order');
    if (data && data.length > 0) {
      setDistricts(data);
    } else {
      setDistricts(DEMO);
      setIsDemo(true);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openForm = (d?: District) => {
    if (d) {
      setEditing(d);
      setForm({ name: d.name, description: d.description ?? '', leader_name: d.leader_name ?? '', is_active: d.is_active, sort_order: String(d.sort_order) });
    } else {
      setEditing(null);
      setForm({ ...EMPTY, sort_order: String(districts.length + 1) });
    }
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    const payload = { name: form.name.trim(), description: form.description || null, leader_name: form.leader_name || null, is_active: form.is_active, sort_order: parseInt(form.sort_order) || 0, updated_at: new Date().toISOString() };
    try {
      if (isDemo) {
        if (editing) {
          setDistricts(p => p.map(d => d.id === editing.id ? { ...d, ...payload } : d));
        } else {
          setDistricts(p => [...p, { ...payload, id: `demo-${Date.now()}`, member_count: 0 }]);
        }
      } else {
        if (editing) {
          await supabase.from('church_districts').update(payload).eq('id', editing.id);
        } else {
          await supabase.from('church_districts').insert(payload);
        }
        await load();
      }
      setShowForm(false);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (isDemo) {
      setDistricts(p => p.filter(d => d.id !== id));
    } else {
      await supabase.from('church_districts').delete().eq('id', id);
      await load();
    }
    setDeleteId(null);
  };

  const f = (k: keyof FormData, v: string | boolean) => setForm(p => ({ ...p, [k]: v }));

  const active = districts.filter(d => d.is_active);
  const inactive = districts.filter(d => !d.is_active);

  if (loading) return <div className="flex items-center justify-center h-40"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" /></div>;

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Header stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-primary-600">{districts.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">전체 {l1}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{active.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">운영 중</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-gray-400">{inactive.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">비활성</p>
        </div>
      </div>

      {isDemo && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-700">
          <span className="font-semibold">데모 데이터</span>표시 중 — 저장 시 임시 반영됩니다.
        </div>
      )}

      {/* List */}
      <div className="space-y-2">
        {districts.map(d => (
          <div key={d.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${d.is_active ? 'bg-primary-100' : 'bg-gray-100'}`}>
              <MapPin className={`w-5 h-5 ${d.is_active ? 'text-primary-600' : 'text-gray-400'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-gray-900 text-sm">{d.name}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${d.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                  {d.is_active ? '운영 중' : '비활성'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">{d.leader_name ? `담당: ${d.leader_name}` : '담당자 미지정'} {d.description ? `· ${d.description}` : ''}</p>
              {d.member_count !== undefined && (
                <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1"><Users className="w-3 h-3" /> {d.member_count}명</p>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={() => openForm(d)} className="p-2 hover:bg-primary-50 text-primary-600 rounded-xl transition-colors"><Edit3 className="w-4 h-4" /></button>
              <button onClick={() => setDeleteId(d.id)} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-colors"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>

      <button onClick={() => openForm()}
        className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-primary-200 text-primary-600 font-semibold rounded-2xl hover:bg-primary-50 transition-colors text-sm">
        <Plus className="w-5 h-5" /> {l1} 추가
      </button>

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="font-bold text-gray-900 mb-2">{l1}을 삭제하시겠습니까?</h3>
            <p className="text-sm text-gray-500 mb-5">소속 {l1} 및 성도 정보는 유지됩니다.</p>
            <div className="flex gap-2">
              <button onClick={() => handleDelete(deleteId)} className="flex-1 py-3 bg-red-500 text-white rounded-2xl text-sm font-bold hover:bg-red-600">삭제</button>
              <button onClick={() => setDeleteId(null)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-2xl text-sm font-bold">취소</button>
            </div>
          </div>
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="sticky top-0 bg-white px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-lg text-gray-900">{editing ? `${l1} 수정` : `${l1} 추가`}</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">{l1}명 *</label>
                <input value={form.name} onChange={e => f('name', e.target.value)} required placeholder={`예: 1${l1}`}
                  className="w-full px-3.5 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:ring-0" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">담당 교역자</label>
                <input value={form.leader_name} onChange={e => f('leader_name', e.target.value)} placeholder="예: 김성기 목사"
                  className="w-full px-3.5 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:ring-0" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">설명</label>
                <input value={form.description} onChange={e => f('description', e.target.value)} placeholder="교구 설명"
                  className="w-full px-3.5 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:ring-0" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">정렬 순서</label>
                  <input type="number" value={form.sort_order} onChange={e => f('sort_order', e.target.value)} min="0"
                    className="w-full px-3.5 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:ring-0" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">사용 여부</label>
                  <div className="flex gap-2 h-[46px]">
                    {[true, false].map(v => (
                      <button key={String(v)} type="button" onClick={() => f('is_active', v)}
                        className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl text-xs font-semibold border-2 transition-all ${form.is_active === v ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 bg-gray-50 text-gray-500'}`}>
                        {v ? <><CheckCircle className="w-3.5 h-3.5" />사용</> : <><XCircle className="w-3.5 h-3.5" />미사용</>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 border border-gray-200 text-gray-600 font-semibold rounded-2xl text-sm">취소</button>
                <button type="submit" disabled={saving} className="flex-1 py-3 bg-primary-500 text-white font-bold rounded-2xl text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                  {editing ? '수정 저장' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

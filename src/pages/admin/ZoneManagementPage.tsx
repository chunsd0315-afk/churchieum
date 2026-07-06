/**
 * 구역관리 — 교구 하위 구역 CRUD, 교구별 트리 보기
 */
import { useEffect, useState } from 'react';
import { supabase } from '../../services/supabase';
import { Network, Plus, Edit3, Trash2, X, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useOrgSettings } from '../../contexts/OrgSettingsContext';

type District = { id: string; name: string; sort_order: number };
type Zone = {
  id: string;
  district_id: string | null;
  name: string;
  leader_name: string | null;
  clergy_name: string | null;
  is_active: boolean;
  sort_order: number;
};

const DEMO_DISTRICTS: District[] = [
  { id: 'd1', name: '1교구', sort_order: 1 },
  { id: 'd2', name: '2교구', sort_order: 2 },
  { id: 'd3', name: '3교구', sort_order: 3 },
  { id: 'd4', name: '4교구', sort_order: 4 },
];
const DEMO_ZONES: Zone[] = [
  { id: 'z1', district_id: 'd1', name: '1구역', leader_name: '홍길동', clergy_name: '김성기 목사', is_active: true, sort_order: 1 },
  { id: 'z2', district_id: 'd1', name: '2구역', leader_name: '이순신', clergy_name: '김성기 목사', is_active: true, sort_order: 2 },
  { id: 'z3', district_id: 'd1', name: '3구역', leader_name: '박세종', clergy_name: '김성기 목사', is_active: true, sort_order: 3 },
  { id: 'z4', district_id: 'd2', name: '1구역', leader_name: '최민준', clergy_name: '이준혁 목사', is_active: true, sort_order: 1 },
  { id: 'z5', district_id: 'd2', name: '2구역', leader_name: '정하은', clergy_name: '이준혁 목사', is_active: true, sort_order: 2 },
  { id: 'z6', district_id: 'd3', name: '1구역', leader_name: '김다은', clergy_name: '박성실 전도사', is_active: true, sort_order: 1 },
  { id: 'z7', district_id: 'd3', name: '2구역', leader_name: null, clergy_name: '박성실 전도사', is_active: false, sort_order: 2 },
];

type FormData = { district_id: string; name: string; leader_name: string; clergy_name: string; is_active: boolean; sort_order: string };
const EMPTY: FormData = { district_id: '', name: '', leader_name: '', clergy_name: '', is_active: true, sort_order: '1' };

export default function ZoneManagementPage() {
  const { l1, l2 } = useOrgSettings();
  const [districts, setDistricts] = useState<District[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Zone | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedDistricts, setExpandedDistricts] = useState<Set<string>>(new Set());

  const load = async () => {
    const [distRes, zoneRes] = await Promise.all([
      supabase.from('church_districts').select('id,name,sort_order').order('sort_order'),
      supabase.from('church_zones').select('*').order('sort_order'),
    ]);
    if (distRes.data && distRes.data.length > 0) {
      setDistricts(distRes.data);
      setZones(zoneRes.data ?? []);
      setExpandedDistricts(new Set(distRes.data.map((d: District) => d.id)));
    } else {
      setDistricts(DEMO_DISTRICTS);
      setZones(DEMO_ZONES);
      setIsDemo(true);
      setExpandedDistricts(new Set(DEMO_DISTRICTS.map(d => d.id)));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openForm = (z?: Zone, districtId?: string) => {
    if (z) {
      setEditing(z);
      setForm({ district_id: z.district_id ?? '', name: z.name, leader_name: z.leader_name ?? '', clergy_name: z.clergy_name ?? '', is_active: z.is_active, sort_order: String(z.sort_order) });
    } else {
      setEditing(null);
      const zonesInDist = zones.filter(z => z.district_id === (districtId ?? districts[0]?.id));
      setForm({ ...EMPTY, district_id: districtId ?? districts[0]?.id ?? '', sort_order: String(zonesInDist.length + 1) });
    }
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.district_id) return;
    setSaving(true);
    const payload = { district_id: form.district_id, name: form.name.trim(), leader_name: form.leader_name || null, clergy_name: form.clergy_name || null, is_active: form.is_active, sort_order: parseInt(form.sort_order) || 0, updated_at: new Date().toISOString() };
    try {
      if (isDemo) {
        if (editing) setZones(p => p.map(z => z.id === editing.id ? { ...z, ...payload } : z));
        else setZones(p => [...p, { ...payload, id: `demo-${Date.now()}` }]);
      } else {
        if (editing) await supabase.from('church_zones').update(payload).eq('id', editing.id);
        else await supabase.from('church_zones').insert(payload);
        await load();
      }
      setShowForm(false);
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (isDemo) setZones(p => p.filter(z => z.id !== id));
    else { await supabase.from('church_zones').delete().eq('id', id); await load(); }
    setDeleteId(null);
  };

  const f = (k: keyof FormData, v: string | boolean) => setForm(p => ({ ...p, [k]: v }));
  const toggleDistrict = (id: string) => setExpandedDistricts(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  if (loading) return <div className="flex items-center justify-center h-40"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" /></div>;

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-primary-600">{zones.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">전체 {l2}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{zones.filter(z => z.is_active).length}</p>
          <p className="text-xs text-gray-400 mt-0.5">운영 중</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-bold text-gray-400">{zones.filter(z => !z.is_active).length}</p>
          <p className="text-xs text-gray-400 mt-0.5">비활성</p>
        </div>
      </div>

      {isDemo && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-700">
          <span className="font-semibold">데모 데이터</span>표시 중
        </div>
      )}

      {/* District tree */}
      <div className="space-y-3">
        {districts.map(dist => {
          const distZones = zones.filter(z => z.district_id === dist.id);
          const expanded = expandedDistricts.has(dist.id);
          return (
            <div key={dist.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <button
                onClick={() => toggleDistrict(dist.id)}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left">
                <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <Network className="w-4.5 h-4.5 text-primary-600" />
                </div>
                <div className="flex-1">
                  <span className="font-bold text-gray-900 text-sm">{dist.name}</span>
                  <span className="text-xs text-gray-400 ml-2">{distZones.length}개 {l2}</span>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); openForm(undefined, dist.id); }}
                  className="p-1.5 bg-primary-50 hover:bg-primary-100 text-primary-600 rounded-lg transition-colors mr-1">
                  <Plus className="w-3.5 h-3.5" />
                </button>
                {expanded ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
              </button>

              {expanded && distZones.length > 0 && (
                <div className="border-t border-gray-50 divide-y divide-gray-50">
                  {distZones.map(z => (
                    <div key={z.id} className="flex items-center gap-3 px-4 py-3 bg-gray-50/50">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0 ml-2" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800 text-sm">{z.name}</span>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${z.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                            {z.is_active ? '운영' : '비활성'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {z.leader_name ? `${l2}장: ${z.leader_name}` : `${l2}장 미지정`}
                          {z.clergy_name ? ` · 담당: ${z.clergy_name}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => openForm(z)} className="p-1.5 hover:bg-primary-50 text-primary-600 rounded-lg transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setDeleteId(z.id)} className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {expanded && distZones.length === 0 && (
                <div className="border-t border-gray-50 px-4 py-3 text-xs text-gray-400 text-center">
                  {l2}이 없습니다. + 버튼으로 추가하세요.
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button onClick={() => openForm()}
        className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-primary-200 text-primary-600 font-semibold rounded-2xl hover:bg-primary-50 transition-colors text-sm">
        <Plus className="w-5 h-5" /> {l2} 추가
      </button>

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="font-bold text-gray-900 mb-2">{l2}을 삭제하시겠습니까?</h3>
            <div className="flex gap-2 mt-5">
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
              <h3 className="font-bold text-lg text-gray-900">{editing ? `${l2} 수정` : `${l2} 추가`}</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">소속 {l1} *</label>
                <select value={form.district_id} onChange={e => f('district_id', e.target.value)} required
                  className="w-full px-3.5 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:ring-0">
                  <option value="">선택하세요</option>
                  {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">{l2}명 *</label>
                <input value={form.name} onChange={e => f('name', e.target.value)} required placeholder={`예: 1${l2}`}
                  className="w-full px-3.5 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:ring-0" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">{l2}장</label>
                  <input value={form.leader_name} onChange={e => f('leader_name', e.target.value)} placeholder={`${l2}장 이름`}
                    className="w-full px-3.5 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:ring-0" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">담당 교역자</label>
                  <input value={form.clergy_name} onChange={e => f('clergy_name', e.target.value)} placeholder="담당 교역자"
                    className="w-full px-3.5 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:ring-0" />
                </div>
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
                        className={`flex-1 flex items-center justify-center gap-1 rounded-xl text-xs font-semibold border-2 transition-all ${form.is_active === v ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 bg-gray-50 text-gray-500'}`}>
                        {v ? <><CheckCircle className="w-3.5 h-3.5" />사용</> : <><XCircle className="w-3.5 h-3.5" />미사용</>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 border border-gray-200 text-gray-600 font-semibold rounded-2xl text-sm">취소</button>
                <button type="submit" disabled={saving} className="flex-1 py-3 bg-primary-500 text-white font-bold rounded-2xl text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
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

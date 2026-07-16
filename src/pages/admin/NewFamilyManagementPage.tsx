import { useEffect, useState } from 'react';
import { supabase, NewFamily, Member } from '../../services/supabase';
import { UserPlus, Plus, Edit, Trash2, X, Calendar } from 'lucide-react';

export default function NewFamilyManagementPage() {
  const [newFamilies, setNewFamilies] = useState<NewFamily[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingNf, setEditingNf] = useState<NewFamily | null>(null);
  const [saving, setSaving] = useState(false);

  const statusOptions = [
    { value: 'new', label: '초대' },
    { value: 'visiting', label: '방문 중' },
    { value: 'decision', label: '등록 결신' },
    { value: 'registered', label: '등록 완료' },
  ];

  const [formData, setFormData] = useState({
    member_id: '',
    contact_source: '',
    first_visit_date: '',
    decision_date: '',
    counselor_id: '',
    status: 'new',
    notes: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [nfRes, memberRes] = await Promise.all([
        supabase.from('new_families').select('*').order('created_at', { ascending: false }),
        supabase.from('members').select('*').order('name'),
      ]);
      if (nfRes.data) setNewFamilies(nfRes.data);
      if (memberRes.data) setMembers(memberRes.data);
    } catch (e) {
      console.error('Error fetching data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const dataToSave = {
        ...formData,
        member_id: formData.member_id || null,
        counselor_id: formData.counselor_id || null,
        first_visit_date: formData.first_visit_date || null,
        decision_date: formData.decision_date || null,
      };

      if (editingNf) {
        await supabase.from('new_families').update(dataToSave).eq('id', editingNf.id);
      } else {
        await supabase.from('new_families').insert(dataToSave);
      }
      setShowForm(false);
      setEditingNf(null);
      resetForm();
      fetchData();
    } catch (e) {
      console.error('Error saving new family:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (nf: NewFamily) => {
    setEditingNf(nf);
    setFormData({
      member_id: nf.member_id || '',
      contact_source: nf.contact_source || '',
      first_visit_date: nf.first_visit_date || '',
      decision_date: nf.decision_date || '',
      counselor_id: nf.counselor_id || '',
      status: nf.status,
      notes: nf.notes || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    await supabase.from('new_families').delete().eq('id', id);
    fetchData();
  };

  const resetForm = () => {
    setFormData({ member_id: '', contact_source: '', first_visit_date: '', decision_date: '', counselor_id: '', status: 'new', notes: '' });
    setEditingNf(null);
  };

  const getMemberName = (id: string | undefined) => members.find(m => m.id === id)?.name || '미지정';
  const getStatusLabel = (status: string) => statusOptions.find(s => s.value === status)?.label || status;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-600">
          <UserPlus className="w-5 h-5" />
          <span>{newFamilies.length}명의 새가족</span>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary text-sm py-2 px-4">
          <Plus className="w-4 h-4 inline mr-1" /> 새가족 등록
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-lg">{editingNf ? '새가족 수정' : '새가족 등록'}</h3>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">성도</label>
                <select value={formData.member_id} onChange={(e) => setFormData({ ...formData, member_id: e.target.value })} className="input-field">
                  <option value="">선택하세요</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">접촉 경로</label>
                <input type="text" value={formData.contact_source} onChange={(e) => setFormData({ ...formData, contact_source: e.target.value })} className="input-field" placeholder="예) 지인 소개, 전도 등" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">첫 방문일</label>
                <input type="date" value={formData.first_visit_date} onChange={(e) => setFormData({ ...formData, first_visit_date: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="input-field">
                  {statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">등록 결신일</label>
                <input type="date" value={formData.decision_date} onChange={(e) => setFormData({ ...formData, decision_date: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">담당자</label>
                <select value={formData.counselor_id} onChange={(e) => setFormData({ ...formData, counselor_id: e.target.value })} className="input-field">
                  <option value="">선택하세요</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">메모</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="input-field min-h-[80px]" />
              </div>
              <div className="flex gap-2 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="btn-outline flex-1">취소</button>
                <button type="submit" disabled={saving} className="bg-accent-500 text-white font-medium py-3 px-6 rounded-xl flex-1">{saving ? '저장 중...' : '저장'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="church-list">
        {newFamilies.map(nf => (
          <div key={nf.id} className="church-list-row">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900">{getMemberName(nf.member_id)}</h4>
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    nf.status === 'registered' ? 'bg-success-100 text-success-600' :
                    nf.status === 'decision' ? 'bg-primary-100 text-primary-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {getStatusLabel(nf.status)}
                  </span>
                </div>
                <p className="text-sm text-gray-500">접촉: {nf.contact_source || '미입력'}</p>
                {nf.first_visit_date && (
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <Calendar className="w-3 h-3" />
                    첫 방문: {nf.first_visit_date}
                  </p>
                )}
                {nf.notes && <p className="text-sm text-gray-600 mt-2">{nf.notes}</p>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleEdit(nf)} className="p-2 hover:bg-gray-100 rounded"><Edit className="w-4 h-4 text-gray-500" /></button>
                <button onClick={() => handleDelete(nf.id)} className="p-2 hover:bg-gray-100 rounded"><Trash2 className="w-4 h-4 text-red-500" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

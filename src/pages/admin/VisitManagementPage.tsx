import { useEffect, useState } from 'react';
import { supabase, Visit, Member } from '../../services/supabase';
import { Home, Plus, Edit, Trash2, X, Calendar, User } from 'lucide-react';

export default function VisitManagementPage() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    visited_member_id: '',
    visit_date: '',
    purpose: '',
    notes: '',
    next_action: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [visitRes, memberRes] = await Promise.all([
        supabase.from('visits').select('*').order('visit_date', { ascending: false }),
        supabase.from('members').select('*').eq('is_active', true).order('name'),
      ]);
      if (visitRes.data) setVisits(visitRes.data);
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
        visited_member_id: formData.visited_member_id || null,
      };

      if (editingVisit) {
        await supabase.from('visits').update(dataToSave).eq('id', editingVisit.id);
      } else {
        await supabase.from('visits').insert(dataToSave);
      }
      setShowForm(false);
      setEditingVisit(null);
      resetForm();
      fetchData();
    } catch (e) {
      console.error('Error saving visit:', e);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (visit: Visit) => {
    setEditingVisit(visit);
    setFormData({
      visited_member_id: visit.visited_member_id || '',
      visit_date: visit.visit_date,
      purpose: visit.purpose || '',
      notes: visit.notes || '',
      next_action: visit.next_action || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    await supabase.from('visits').delete().eq('id', id);
    fetchData();
  };

  const resetForm = () => {
    setFormData({ visited_member_id: '', visit_date: '', purpose: '', notes: '', next_action: '' });
    setEditingVisit(null);
  };

  const getMemberName = (id: string | undefined) => members.find(m => m.id === id)?.name || '미지정';

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
          <Home className="w-5 h-5" />
          <span>{visits.length}건의 심방</span>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary text-sm py-2 px-4">
          <Plus className="w-4 h-4 inline mr-1" /> 심방 등록
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-lg">{editingVisit ? '심방 수정' : '심방 등록'}</h3>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">방문한 성도</label>
                <select value={formData.visited_member_id} onChange={(e) => setFormData({ ...formData, visited_member_id: e.target.value })} className="input-field">
                  <option value="">선택하세요</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">방문 날짜 *</label>
                <input type="date" value={formData.visit_date} onChange={(e) => setFormData({ ...formData, visit_date: e.target.value })} className="input-field" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">방문 목적</label>
                <input type="text" value={formData.purpose} onChange={(e) => setFormData({ ...formData, purpose: e.target.value })} className="input-field" placeholder="예) 심방, 위로, 기도 등" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="input-field min-h-[100px]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">다음 계획</label>
                <input type="text" value={formData.next_action} onChange={(e) => setFormData({ ...formData, next_action: e.target.value })} className="input-field" />
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
        {visits.map(visit => (
          <div key={visit.id} className="church-list-row">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {visit.visit_date}
                </p>
                <h4 className="font-semibold text-gray-900 mt-1 flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  {getMemberName(visit.visited_member_id)}
                </h4>
                {visit.purpose && <p className="text-sm text-primary-500 mt-1">{visit.purpose}</p>}
                {visit.notes && <p className="text-sm text-gray-600 mt-2">{visit.notes}</p>}
                {visit.next_action && <p className="text-sm text-secondary-600 mt-2">다음: {visit.next_action}</p>}
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleEdit(visit)} className="p-2 hover:bg-gray-100 rounded"><Edit className="w-4 h-4 text-gray-500" /></button>
                <button onClick={() => handleDelete(visit.id)} className="p-2 hover:bg-gray-100 rounded"><Trash2 className="w-4 h-4 text-red-500" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

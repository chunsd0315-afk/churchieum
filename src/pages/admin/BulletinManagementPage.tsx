import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../services/supabase';
import { useFileUpload } from '../../hooks/useFileUpload';
import {
  FileText, Edit2, Trash2, X, Calendar, Eye, Download,
  Image as ImageIcon, Archive, ArchiveRestore, ExternalLink,
  Upload, Loader2, Save,
} from 'lucide-react';
import ContentEditorLayout from '../../components/layout/ContentEditorLayout';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { PageLayout, TabBar, Badge, ConfirmDialog } from '../../components/common/ui';

type Bulletin = {
  id: string;
  title: string;
  description?: string;
  bulletin_date: string;
  pdf_url?: string;
  image_url?: string;
  view_count: number;
  is_archived: boolean;
  created_at: string;
};

type FormData = {
  title: string;
  description: string;
  bulletin_date: string;
  pdf_url: string;
  image_url: string;
};

const EMPTY_FORM: FormData = {
  title: '',
  description: '',
  bulletin_date: new Date().toISOString().split('T')[0],
  pdf_url: '',
  image_url: '',
};

function isFormDirty(form: FormData): boolean {
  return !!(form.title.trim() || form.pdf_url || form.image_url);
}

export default function BulletinManagementPage() {
  const { isDesktop: _isDesktop } = useBreakpoint();
  const [bulletins, setBulletins] = useState<Bulletin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Bulletin | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'active' | 'archived'>('active');
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [toast, setToast] = useState('');
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const pdfUpload = useFileUpload({ bucket: 'bulletins', folder: 'pdf', maxSizeMB: 50 });
  const imgUpload = useFileUpload({ bucket: 'bulletins', folder: 'covers', maxSizeMB: 10 });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('bulletins')
        .select('*')
        .order('bulletin_date', { ascending: false });
      setBulletins(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, bulletin_date: new Date().toISOString().split('T')[0] });
    setImagePreview('');
    setShowForm(true);
  };

  const openEdit = (b: Bulletin) => {
    setEditing(b);
    setForm({
      title: b.title,
      description: b.description || '',
      bulletin_date: b.bulletin_date,
      pdf_url: b.pdf_url || '',
      image_url: b.image_url || '',
    });
    setImagePreview(b.image_url || '');
    setShowForm(true);
  };

  const handleBack = () => {
    if (isFormDirty(form) && !window.confirm('작성 중인 내용이 있습니다.\n나가시겠습니까?')) return;
    setShowForm(false);
    setEditing(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description || null,
        bulletin_date: form.bulletin_date,
        pdf_url: form.pdf_url || null,
        image_url: form.image_url || null,
      };
      if (editing) {
        await supabase.from('bulletins').update(payload).eq('id', editing.id);
        showToast('주보가 수정되었습니다');
      } else {
        await supabase.from('bulletins').insert({ ...payload, view_count: 0, is_archived: false });
        showToast('주보가 등록되었습니다');
      }
      setShowForm(false);
      setEditing(null);
      fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('bulletins').delete().eq('id', id);
    setDeleteConfirm(null);
    showToast('삭제되었습니다');
    fetchData();
  };

  const handleToggleArchive = async (b: Bulletin) => {
    await supabase.from('bulletins').update({ is_archived: !b.is_archived }).eq('id', b.id);
    showToast(b.is_archived ? '보관 해제되었습니다' : '보관함으로 이동되었습니다');
    fetchData();
  };

  const displayed = bulletins
    .filter(b => (tab === 'active' ? !b.is_archived : b.is_archived))
    .filter(b => !search || b.title.includes(search) || b.bulletin_date.includes(search));

  const activeCount = bulletins.filter(b => !b.is_archived).length;
  const archivedCount = bulletins.filter(b => b.is_archived).length;
  const latest = bulletins.filter(b => !b.is_archived)[0];

  const formFields = (
    <div className="space-y-4">
      {/* Date */}
      <div>
        <label className="text-xs font-semibold text-gray-600 mb-1.5 block">주보 날짜 *</label>
        <input
          type="date"
          value={form.bulletin_date}
          onChange={e => setForm({ ...form, bulletin_date: e.target.value })}
          required
          className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400"
        />
      </div>

      {/* Title */}
      <div>
        <label className="text-xs font-semibold text-gray-600 mb-1.5 block">제목 *</label>
        <input
          type="text"
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
          placeholder="2026년 6월 4주차 주보"
          required
          className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400"
        />
      </div>

      {/* Description */}
      <div>
        <label className="text-xs font-semibold text-gray-600 mb-1.5 block">설명 (선택)</label>
        <input
          type="text"
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          placeholder="성령 강림 후 제5주 주일예배 주보"
          className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400"
        />
      </div>

      {/* PDF Upload */}
      <div>
        <label className="text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-red-500" /> 주보 PDF (선택)
        </label>
        <input ref={pdfInputRef} type="file" accept="application/pdf" className="hidden"
          onChange={async e => {
            const file = e.target.files?.[0];
            if (!file) return;
            const url = await pdfUpload.upload(file);
            if (url) setForm(f => ({ ...f, pdf_url: url }));
            e.target.value = '';
          }} />
        {form.pdf_url ? (
          <div className="flex items-center gap-2 px-3.5 py-3 bg-red-50 border border-red-200 rounded-xl">
            <FileText className="w-4 h-4 text-red-400 flex-shrink-0" />
            <a href={form.pdf_url} target="_blank" rel="noopener noreferrer"
              className="flex-1 text-sm text-red-700 hover:underline truncate flex items-center gap-1">
              PDF 확인 <ExternalLink className="w-3 h-3 flex-shrink-0" />
            </a>
            <button type="button" onClick={() => setForm(f => ({ ...f, pdf_url: '' }))}
              className="p-1 hover:bg-red-100 rounded-lg transition-colors">
              <X className="w-3.5 h-3.5 text-red-400" />
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => pdfInputRef.current?.click()}
            disabled={pdfUpload.uploading}
            className="w-full flex items-center justify-center gap-2 py-6 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-red-300 hover:text-red-400 transition-colors disabled:opacity-50">
            {pdfUpload.uploading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> 업로드 중...</>
              : <><Upload className="w-4 h-4" /> PDF 파일 선택 (최대 50MB)</>}
          </button>
        )}
        {pdfUpload.error && <p className="text-xs text-red-500 mt-1">{pdfUpload.error}</p>}
      </div>

      {/* Cover Image Upload */}
      <div>
        <label className="text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-blue-500" /> 표지 이미지 (선택)
        </label>
        <input ref={imgInputRef} type="file" accept="image/*" className="hidden"
          onChange={async e => {
            const file = e.target.files?.[0];
            if (!file) return;
            const url = await imgUpload.upload(file);
            if (url) { setForm(f => ({ ...f, image_url: url })); setImagePreview(url); }
            e.target.value = '';
          }} />
        {imagePreview ? (
          <div className="relative mt-1 w-24 h-32 rounded-xl overflow-hidden border border-gray-200">
            <img src={imagePreview} alt="표지" className="w-full h-full object-cover" onError={() => setImagePreview('')} />
            <button type="button"
              onClick={() => { setImagePreview(''); setForm(f => ({ ...f, image_url: '' })); }}
              className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-black/70">
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => imgInputRef.current?.click()}
            disabled={imgUpload.uploading}
            className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-blue-300 hover:text-blue-400 transition-colors disabled:opacity-50">
            {imgUpload.uploading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> 업로드 중...</>
              : <><Upload className="w-4 h-4" /> 표지 이미지 선택 (최대 10MB)</>}
          </button>
        )}
        {imgUpload.error && <p className="text-xs text-red-500 mt-1">{imgUpload.error}</p>}
      </div>
    </div>
  );

  if (showForm) {
    return (
      <ContentEditorLayout
        title={editing ? '주보 수정' : '주보 등록'}
        onBack={handleBack}
        saveButton={
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? '저장 중...' : editing ? '수정' : '등록'}
          </button>
        }
      >
        {formFields}
      </ContentEditorLayout>
    );
  }

  return (
    <>
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-medium">
          {toast}
        </div>
      )}

      <PageLayout
        header={{ title: '주보', description: '예배 순서와 주간 소식을 확인하세요.' }}
        addButton={{ label: '주보 등록', onClick: openNew }}
        toolbar={{ search: { value: search, onChange: setSearch, placeholder: '주보 검색...' } }}
        loading={loading}
        skeletonCount={4}
        empty={{ icon: <FileText size={28} />, title: tab === 'archived' ? '보관된 주보가 없습니다' : '등록된 주보가 없습니다' }}
      >
        {!loading && (
          <>
            {/* Latest Highlight */}
            {latest && tab === 'active' && (
              <div className="bg-gradient-to-r from-primary-500 to-accent-500 rounded-2xl p-5 text-white mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-full">이번 주 주보</span>
                    <h3 className="text-lg font-bold mt-2">{latest.title}</h3>
                    <p className="text-sm opacity-80 mt-0.5">{latest.bulletin_date} · 조회 {latest.view_count}회</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {latest.pdf_url && <a href={latest.pdf_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-2 rounded-xl text-xs font-medium"><ExternalLink className="w-3.5 h-3.5" /> PDF 열기</a>}
                    <button onClick={() => openEdit(latest)} className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-2 rounded-xl text-xs font-medium"><Edit2 className="w-3.5 h-3.5" /> 수정</button>
                  </div>
                </div>
              </div>
            )}

            {/* Tabs */}
            <TabBar
              tabs={[{ id: 'active', label: `현재 주보 (${activeCount})` }, { id: 'archived', label: `보관함 (${archivedCount})` }]}
              activeTab={tab}
              onChange={v => setTab(v as 'active' | 'archived')}
              variant="segment"
              className="mb-4"
            />

            {/* List */}
            {displayed.map(b => (
              <div key={b.id} className="bg-white rounded-card border border-gray-200 shadow-card-md overflow-hidden hover:shadow-card-hover transition-shadow mb-3">
                <div className="flex items-stretch">
                  <div className={`w-1.5 shrink-0 ${b.is_archived ? 'bg-gray-200' : 'bg-primary-400'}`} />
                  <div className="w-20 h-20 bg-primary-50 flex items-center justify-center shrink-0 self-center mx-3">
                    {b.image_url ? <img src={b.image_url} alt="" className="w-full h-full object-cover rounded-lg" /> : <FileText className="w-8 h-8 text-primary-300" />}
                  </div>
                  <div className="flex-1 min-w-0 py-3.5 pr-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                          {b.is_archived && <Badge variant="gray" size="sm" dot><Archive className="w-2.5 h-2.5" /> 보관</Badge>}
                          {b.pdf_url && <Badge variant="red" size="sm">PDF</Badge>}
                        </div>
                        <h4 className="font-bold text-gray-900 text-sm truncate">{b.title}</h4>
                        {b.description && <p className="text-xs text-gray-500 truncate mt-0.5">{b.description}</p>}
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{b.bulletin_date}</span>
                          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{b.view_count}회</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {b.pdf_url && <a href={b.pdf_url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"><Download className="w-4 h-4" /></a>}
                        <button onClick={() => handleToggleArchive(b)} title={b.is_archived ? '보관 해제' : '보관함으로'} className="p-1.5 text-gray-400 hover:text-teal-500 hover:bg-teal-50 rounded-lg transition-colors">
                          {b.is_archived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                        </button>
                        <button onClick={() => openEdit(b)} className="p-1.5 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteConfirm(b.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </PageLayout>

      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="주보 삭제"
        description="이 작업은 되돌릴 수 없습니다."
        variant="danger"
      />
    </>
  );
}


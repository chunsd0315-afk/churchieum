import { useState, useMemo, useRef } from 'react';
import { PageHeaderBar, ChurchDropdownMenu } from '../../components/common/ui';
import StatusBadge from '../../components/layout/StatusBadge';
import EmptyState from '../../components/layout/EmptyState';
import {
  Megaphone, Plus, Edit2, Trash2, X, Pin, Star,
  Calendar, Bell, ImageIcon, Paperclip, Upload,
  AlertTriangle, Download, Save, LayoutGrid, List,
  SlidersHorizontal,
} from 'lucide-react';
import {
  getAllAnnouncements, addAnnouncement, updateAnnouncement, deleteAnnouncement,
  fileToBase64, formatFileSize, ACCEPT_FILES,
  type Announcement, type AttachFile,
} from '../../services/announcementStorage';
import {
  getAllDistricts, getZones, getAllDepartments,
} from '../../services/orgData';
import { useOrgSettings } from '../../contexts/OrgSettingsContext';
import ContentEditorLayout from '../../components/layout/ContentEditorLayout';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { buildNoticeScopeBadges, type ScopeBadge } from '../../services/announcementHelpers';

type Category = Announcement['category'];
type Scope = Announcement['scope'];

const CAT_COLOR: Record<string, string> = {
  '일반공지':  'text-primary-600 bg-primary-50 border-primary-200',
  '행사안내':  'text-emerald-600 bg-emerald-50 border-emerald-200',
  '가정통신문': 'text-amber-600 bg-amber-50 border-amber-200',
  '기타':     'text-gray-600 bg-gray-50 border-gray-200',
};

const INPUT = 'w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400';
const SELECT = 'w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400 text-gray-700';

type FormData = {
  title: string; content: string;
  category: Category; customCategory: string;
  scope: Scope; scopeId: string;
  date: string; isPinned: boolean; isImportant: boolean;
  images: string[];
  files: AttachFile[];
};

const EMPTY_FORM: FormData = {
  title: '', content: '', category: '일반공지', customCategory: '',
  scope: 'all', scopeId: '', date: new Date().toISOString().split('T')[0],
  isPinned: false, isImportant: false, images: [], files: [],
};

function isFormDirty(form: FormData): boolean {
  return !!(form.title.trim() || form.content.trim() || form.images.length || form.files.length);
}

export default function AnnouncementManagementPage() {
  const { l1, l2, dept, settings } = useOrgSettings();
  const { isMobile } = useBreakpoint();
  const districts   = getAllDistricts().filter(d => d.is_active);
  const departments = getAllDepartments().filter(d => d.is_active);

  const scopeOptions: { value: Scope; label: string }[] = [
    { value: 'all',        label: '전체 공개' },
    ...(settings.level1Enabled     ? [{ value: 'level1'     as Scope, label: `${l1} 공개` }] : []),
    ...(settings.level2Enabled     ? [{ value: 'level2'     as Scope, label: `${l2} 공개` }] : []),
    ...(settings.departmentEnabled ? [{ value: 'department' as Scope, label: `${dept} 공개` }] : []),
  ];

  /* ─── List state ─────────────────────────────────────────────────── */
  const [data, setData]           = useState<Announcement[]>(() => getAllAnnouncements());
  const [viewMode, setViewMode]   = useState<'card' | 'list'>('list');
  const effectiveViewMode         = isMobile ? 'list' : viewMode;
  const [showSearch, setShowSearch] = useState(false);

  /* advanced filters */
  const [fDistrict, setFDistrict] = useState('');   // '' | 'church' | district.id
  const [fZone, setFZone]         = useState('');
  const [fDept, setFDept]         = useState('');
  const [fDate, setFDate]         = useState('');
  const [fText, setFText]         = useState('');

  /* zones for selected district */
  const zonesInDistrict = useMemo(() => {
    if (!fDistrict || fDistrict === 'church') return [];
    return getZones(fDistrict).filter(z => z.is_active);
  }, [fDistrict]);

  const resetFilters = () => {
    setFDistrict(''); setFZone(''); setFDept(''); setFDate(''); setFText('');
  };

  /* ─── Form state ─────────────────────────────────────────────────── */
  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState<Announcement | null>(null);
  const [form, setForm]           = useState<FormData>(EMPTY_FORM);
  const [showDetail, setShowDetail] = useState<Announcement | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [lightboxImg, setLightboxImg]   = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast]         = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const imgInputRef  = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scopeOrgs = useMemo(() => {
    if (form.scope === 'level1') return districts.map(d => ({ id: d.id, name: d.name }));
    if (form.scope === 'level2') return getZones().filter(z => z.is_active).map(z => ({ id: z.id, name: z.name }));
    if (form.scope === 'department') return departments.map(d => ({ id: d.id, name: d.name }));
    return [];
  }, [form.scope, districts, departments]);

  /* ─── Filter logic ─────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    return data
      .filter(a => {
        if (!fDistrict && !fDept) return true;
        if (fDistrict === 'church') return a.scope === 'all';
        if (fZone) return a.scope === 'level2' && a.scopeId === fZone;
        if (fDistrict) return a.scope === 'level1' && a.scopeId === fDistrict;
        if (fDept) return a.scope === 'department' && a.scopeId === fDept;
        return true;
      })
      .filter(a => !fDate || a.date === fDate)
      .filter(a => {
        if (!fText) return true;
        const q = fText.toLowerCase();
        return (
          a.title.toLowerCase().includes(q) ||
          a.content.toLowerCase().includes(q) ||
          a.author.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return b.date.localeCompare(a.date);
      });
  }, [data, fDistrict, fZone, fDept, fDate, fText]);

  const pinned  = filtered.filter(a => a.isPinned);
  const regular = filtered.filter(a => !a.isPinned);

  /* ─── CRUD handlers ─────────────────────────────────────────────── */
  const openNew  = () => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); };
  const openEdit = (ann: Announcement) => {
    setEditing(ann);
    setForm({
      title: ann.title, content: ann.content, category: ann.category, customCategory: '',
      scope: ann.scope, scopeId: ann.scopeId ?? '', date: ann.date,
      isPinned: ann.isPinned, isImportant: ann.isImportant,
      images: ann.images ?? [], files: ann.files ?? [],
    });
    setShowForm(true);
  };

  const handleBack = () => {
    if (isFormDirty(form) && !window.confirm('작성 중인 내용이 있습니다.\n나가시겠습니까?')) return;
    setShowForm(false); setEditing(null);
  };

  const getScopeName = (scope: Scope, scopeId: string) => {
    if (scope === 'level1') return districts.find(d => d.id === scopeId)?.name ?? '';
    if (scope === 'level2') return getZones().find(z => z.id === scopeId)?.name ?? '';
    if (scope === 'department') return departments.find(d => d.id === scopeId)?.name ?? '';
    return '';
  };

  const handleSubmit = (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    const finalCat: Category = form.category === '기타' && form.customCategory.trim()
      ? form.customCategory.trim() as Category : form.category;
    const payload: Omit<Announcement, 'id' | 'created_at'> = {
      title: form.title, content: form.content, category: finalCat,
      scope: form.scope, scopeId: form.scope !== 'all' ? form.scopeId : undefined,
      scopeName: form.scope !== 'all' ? getScopeName(form.scope, form.scopeId) : undefined,
      date: form.date, isPinned: form.isPinned, isImportant: form.isImportant,
      author: editing?.author ?? '관리자',
      images: form.images, files: form.files,
    };
    if (editing) { updateAnnouncement(editing.id, payload); } else { addAnnouncement(payload); }
    setData(getAllAnnouncements());
    setShowForm(false); setEditing(null);
  };

  const handleDelete = (id: string) => {
    deleteAnnouncement(id);
    setData(getAllAnnouncements());
    setDeleteConfirm(null);
    setShowDetail(null);
  };

  const togglePin = (id: string) => {
    const ann = data.find(a => a.id === id);
    if (!ann) return;
    updateAnnouncement(id, { ...ann, isPinned: !ann.isPinned });
    setData(getAllAnnouncements());
  };

  const toggleImportant = (id: string) => {
    const ann = data.find(a => a.id === id);
    if (!ann) return;
    updateAnnouncement(id, { ...ann, isImportant: !ann.isImportant });
    setData(getAllAnnouncements());
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    const base64s = await Promise.all(files.map(f => fileToBase64(f)));
    setForm(prev => ({ ...prev, images: [...prev.images, ...base64s] }));
    setUploading(false);
    if (imgInputRef.current) imgInputRef.current.value = '';
  };

  const removeImage = (idx: number) =>
    setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    const attached: AttachFile[] = await Promise.all(files.map(async f => ({
      name: f.name, size: formatFileSize(f.size), type: f.type, data: await fileToBase64(f),
    })));
    setForm(prev => ({ ...prev, files: [...prev.files, ...attached] }));
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (idx: number) =>
    setForm(prev => ({ ...prev, files: prev.files.filter((_, i) => i !== idx) }));

  /* ─── Form fields (unchanged) ───────────────────────────────────── */
  const formFields = (
    <div className="space-y-5">
      <div>
        <label className="text-xs font-semibold text-gray-600 mb-2 block">공지 유형</label>
        <div className="flex gap-2 flex-wrap">
          {(['일반공지','행사안내','가정통신문','기타'] as Category[]).map(cat => (
            <button type="button" key={cat}
              onClick={() => setForm(f => ({ ...f, category: cat, customCategory: '' }))}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border-2 transition-all ${
                form.category === cat
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}>{cat}</button>
          ))}
        </div>
        {form.category === '기타' && (
          <input type="text" value={form.customCategory}
            onChange={e => setForm(f => ({ ...f, customCategory: e.target.value }))}
            placeholder="카테고리 직접 입력" className={`${INPUT} mt-2`} />
        )}
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-600 mb-2 block">공개 범위</label>
        <div className="flex gap-2 flex-wrap">
          {scopeOptions.map(opt => (
            <button type="button" key={opt.value}
              onClick={() => setForm(f => ({ ...f, scope: opt.value, scopeId: '' }))}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border-2 transition-all ${
                form.scope === opt.value
                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}>{opt.label}</button>
          ))}
        </div>
        {form.scope !== 'all' && scopeOrgs.length > 0 && (
          <select value={form.scopeId} onChange={e => setForm(f => ({ ...f, scopeId: e.target.value }))}
            className={`${INPUT} mt-2`}>
            <option value="">전체 {form.scope === 'level1' ? l1 : form.scope === 'level2' ? l2 : dept}</option>
            {scopeOrgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        )}
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-600 mb-2 block">제목 *</label>
        <input type="text" value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          placeholder="공지 제목을 입력하세요" required className={INPUT} />
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-600 mb-2 block">게시일</label>
        <input type="date" value={form.date}
          onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className={INPUT} />
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-600 mb-2 block">내용 *</label>
        <textarea value={form.content}
          onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
          placeholder="공지 내용을 입력하세요" required rows={6}
          className={`${INPUT} resize-none`} />
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-gray-400" /> 이미지 첨부
        </label>
        <input ref={imgInputRef} type="file" accept="image/*" multiple className="hidden"
          onChange={handleImageUpload} />
        <button type="button" onClick={() => imgInputRef.current?.click()} disabled={uploading}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-primary-300 hover:text-primary-600 transition-colors">
          <Upload className="w-4 h-4" />
          {uploading ? '업로드 중...' : '이미지 선택 (여러 장 가능)'}
        </button>
        {form.images.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mt-3">
            {form.images.map((img, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200">
                <img src={img} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white shadow">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1.5">
          <Paperclip className="w-3.5 h-3.5 text-gray-400" /> 파일 첨부
        </label>
        <input ref={fileInputRef} type="file" accept={ACCEPT_FILES} multiple className="hidden"
          onChange={handleFileUpload} />
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-primary-300 hover:text-primary-600 transition-colors">
          <Paperclip className="w-4 h-4" />
          {uploading ? '업로드 중...' : 'PDF, HWP, DOC, XLS, PPT, ZIP 등'}
        </button>
        {form.files.length > 0 && (
          <div className="space-y-1.5 mt-2">
            {form.files.map((f, i) => (
              <div key={i} className="flex items-center gap-3 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl">
                <Paperclip className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{f.name}</p>
                  <p className="text-[10px] text-gray-400">{f.size}</p>
                </div>
                <button type="button" onClick={() => removeFile(i)}
                  className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex gap-6 pt-1">
        <Toggle label="상단 고정" color="red" icon={<Pin className="w-3.5 h-3.5 text-red-500" />}
          checked={form.isPinned} onChange={v => setForm(f => ({ ...f, isPinned: v }))} />
        <Toggle label="중요 공지" color="amber" icon={<Star className="w-3.5 h-3.5 text-amber-500" />}
          checked={form.isImportant} onChange={v => setForm(f => ({ ...f, isImportant: v }))} />
      </div>
    </div>
  );

  /* ── 작성/수정 화면 ── */
  if (showForm) {
    return (
      <ContentEditorLayout
        title={editing ? '공지사항 수정' : '공지사항 작성'}
        onBack={handleBack}
        saveButton={
          <button onClick={handleSubmit as React.MouseEventHandler}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white font-semibold transition-colors"
            style={{ background: '#2563EB', fontSize: '13px' }}>
            <Save className="w-4 h-4" />
            {editing ? '수정 완료' : '등록'}
          </button>
        }
      >
        <div className="bg-white rounded-[20px] p-6" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          {formFields}
        </div>
      </ContentEditorLayout>
    );
  }

  /* ══════════════════════════════════════════════
     목록 화면
  ══════════════════════════════════════════════ */
  return (
    <div className="space-y-5 pb-8">
      {/* Page header */}
      <PageHeaderBar
        title="공지사항"
        description="교회 소식과 안내를 확인하세요."
        action={
          <button onClick={openNew}
            className="flex items-center gap-2 text-white font-bold rounded-btn transition-colors hover:bg-primary-600"
            style={{ background: '#2563EB', height: '44px', padding: '0 18px', fontSize: '14px', gap: '8px' }}>
            <Plus className="w-4 h-4" /> 공지 작성
          </button>
        }
        mobileFab={{ label: '공지사항 등록', onClick: openNew }}
      />

      {/* Toolbar row */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => setShowSearch(s => !s)}
          className={`flex items-center gap-2 px-4 rounded-[14px] border text-sm font-semibold transition-all ${
            showSearch
              ? 'bg-primary-500 border-primary-500 text-white'
              : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
          }`}
          style={{ height: '44px' }}
        >
          <SlidersHorizontal style={{ width: '16px', height: '16px' }} />
          상세검색
        </button>

        {/* View mode toggle: PC only */}
        {!isMobile && (
          <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-[14px]">
            <button
              onClick={() => setViewMode('card')}
              title="카드 보기"
              className={`flex items-center justify-center rounded-xl transition-all ${
                viewMode === 'card' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-400 hover:text-gray-600'
              }`}
              style={{ width: '36px', height: '36px' }}
            >
              <LayoutGrid style={{ width: '18px', height: '18px' }} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              title="목록 보기"
              className={`flex items-center justify-center rounded-xl transition-all ${
                viewMode === 'list' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-400 hover:text-gray-600'
              }`}
              style={{ width: '36px', height: '36px' }}
            >
              <List style={{ width: '18px', height: '18px' }} />
            </button>
          </div>
        )}
      </div>

      {/* Advanced search panel */}
      {showSearch && (
        <div className="bg-white border border-gray-200 rounded-[20px] p-6">
          <div className="grid grid-cols-2 gap-4">
            {/* 상위조직 */}
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-2 block">{l1}</label>
              <select
                value={fDistrict}
                onChange={e => { setFDistrict(e.target.value); setFZone(''); }}
                className={SELECT}
              >
                <option value="">전체</option>
                <option value="church">교회공지</option>
                {districts.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* 하위조직 */}
            <div>
              <label className={`text-xs font-semibold mb-2 block ${
                fDistrict && fDistrict !== 'church' ? 'text-gray-600' : 'text-gray-300'
              }`}>{l2}</label>
              <select
                value={fZone}
                onChange={e => setFZone(e.target.value)}
                disabled={!fDistrict || fDistrict === 'church'}
                className={`${SELECT} disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                <option value="">전체</option>
                {zonesInDistrict.map(z => (
                  <option key={z.id} value={z.id}>{z.name}</option>
                ))}
              </select>
            </div>

            {/* 부서 */}
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-2 block">{dept}</label>
              <select value={fDept} onChange={e => setFDept(e.target.value)} className={SELECT}>
                <option value="">전체</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* 날짜 */}
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-2 block">날짜</label>
              <input
                type="date" value={fDate}
                onChange={e => setFDate(e.target.value)}
                className={SELECT}
              />
            </div>

            {/* 검색어 */}
            <div className="col-span-2">
              <label className="text-xs font-semibold text-gray-600 mb-2 block">검색어</label>
              <input
                type="text" value={fText}
                onChange={e => setFText(e.target.value)}
                placeholder="제목 또는 내용을 검색하세요."
                className={SELECT}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-gray-100">
            <button
              onClick={resetFilters}
              className="px-5 py-2 border border-gray-200 rounded-[14px] text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              초기화
            </button>
            <button
              onClick={() => setShowSearch(false)}
              className="px-5 py-2 bg-primary-500 text-white rounded-[14px] text-sm font-bold hover:bg-primary-600 transition-colors"
            >
              조회
            </button>
          </div>
        </div>
      )}

      {/* Announcement list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="공지사항이 없습니다"
          description="등록된 공지사항이 없거나 필터 조건에 맞는 글이 없습니다."
        />
      ) : (
        <div className="space-y-5">
          {pinned.length > 0 && (
            <section>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Pin className="w-3.5 h-3.5 text-red-400" /> 상단 고정 공지
              </p>
              {effectiveViewMode === 'list' ? (
                <div className="flex flex-col gap-3">
                  {pinned.map(ann => (
                    <AnnListCard key={ann.id} ann={ann} badges={buildNoticeScopeBadges(ann)}
                      onView={() => setShowDetail(ann)} onEdit={() => openEdit(ann)}
                      onDelete={() => setDeleteConfirm(ann.id)}
                      onTogglePin={() => togglePin(ann.id)} onToggleImportant={() => toggleImportant(ann.id)}
                      onNotify={() => showToast('알림이 발송되었습니다.')} />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {pinned.map(ann => (
                    <AnnGridCard key={ann.id} ann={ann} badges={buildNoticeScopeBadges(ann)}
                      onView={() => setShowDetail(ann)} onEdit={() => openEdit(ann)}
                      onDelete={() => setDeleteConfirm(ann.id)}
                      onTogglePin={() => togglePin(ann.id)} onToggleImportant={() => toggleImportant(ann.id)}
                      onNotify={() => showToast('알림이 발송되었습니다.')} />
                  ))}
                </div>
              )}
            </section>
          )}

          {regular.length > 0 && (
            <section>
              {pinned.length > 0 && (
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5" /> 일반 공지
                </p>
              )}
              {effectiveViewMode === 'list' ? (
                <div className="flex flex-col gap-3">
                  {regular.map(ann => (
                    <AnnListCard key={ann.id} ann={ann} badges={buildNoticeScopeBadges(ann)}
                      onView={() => setShowDetail(ann)} onEdit={() => openEdit(ann)}
                      onDelete={() => setDeleteConfirm(ann.id)}
                      onTogglePin={() => togglePin(ann.id)} onToggleImportant={() => toggleImportant(ann.id)}
                      onNotify={() => showToast('알림이 발송되었습니다.')} />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {regular.map(ann => (
                    <AnnGridCard key={ann.id} ann={ann} badges={buildNoticeScopeBadges(ann)}
                      onView={() => setShowDetail(ann)} onEdit={() => openEdit(ann)}
                      onDelete={() => setDeleteConfirm(ann.id)}
                      onTogglePin={() => togglePin(ann.id)} onToggleImportant={() => toggleImportant(ann.id)}
                      onNotify={() => showToast('알림이 발송되었습니다.')} />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <h3 className="font-bold text-gray-900">공지 상세</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => { setShowDetail(null); openEdit(showDetail); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-xl">
                  <Edit2 className="w-3.5 h-3.5" /> 수정
                </button>
                <button onClick={() => setDeleteConfirm(showDetail.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 rounded-xl">
                  <Trash2 className="w-3.5 h-3.5" /> 삭제
                </button>
                <button onClick={() => setShowDetail(null)} className="p-2 hover:bg-gray-100 rounded-xl">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                {buildNoticeScopeBadges(showDetail).map((b, i) => (
                  <StatusBadge key={i} label={b.label} variant={b.variant} />
                ))}
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${CAT_COLOR[showDetail.category] ?? 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                  {showDetail.category}
                </span>
                {showDetail.isPinned && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-200 flex items-center gap-1">
                    <Pin className="w-3 h-3" /> 고정
                  </span>
                )}
                {showDetail.isImportant && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center gap-1">
                    <Star className="w-3 h-3" /> 중요
                  </span>
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{showDetail.title}</h2>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {showDetail.date}</span>
                  <span>{showDetail.author}</span>
                </div>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{showDetail.content}</p>
              {showDetail.images.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5" /> 첨부 이미지 {showDetail.images.length}장
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {showDetail.images.map((img, i) => (
                      <button key={i} onClick={() => setLightboxImg(img)}
                        className="aspect-video rounded-xl overflow-hidden border border-gray-200 hover:opacity-90 transition-opacity">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {showDetail.files.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5" /> 첨부파일 {showDetail.files.length}개
                  </p>
                  {showDetail.files.map((f, i) => (
                    <a key={i} href={f.data} download={f.name}
                      className="flex items-center gap-3 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors">
                      <Paperclip className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">{f.name}</p>
                        <p className="text-[10px] text-gray-400">{f.size}</p>
                      </div>
                      <Download className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="font-bold text-gray-900">공지 삭제</p>
                <p className="text-sm text-gray-500">이 공지를 삭제하시겠습니까?</p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium">취소</button>
              <button onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600">삭제</button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxImg && (
        <div className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxImg(null)}>
          <img src={lightboxImg} alt="" className="max-w-full max-h-full rounded-2xl object-contain" />
          <button className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] pointer-events-none">
          <div
            className="flex items-center gap-2.5 px-5 py-3 bg-gray-900 text-white text-sm font-semibold shadow-xl animate-fade-in"
            style={{ borderRadius: '14px', whiteSpace: 'nowrap' }}
          >
            <Bell className="w-4 h-4 text-primary-400 shrink-0" />
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Card action menu ───────────────────────────────────────────────────── */
function CardMenu({ ann, onEdit, onDelete, onTogglePin, onNotify }: {
  ann: Announcement;
  onEdit: () => void; onDelete: () => void;
  onTogglePin: () => void; onNotify: () => void;
}) {
  return (
    <ChurchDropdownMenu
      items={[
        {
          label: '수정하기',
          icon: <Edit2 style={{ width: '15px', height: '15px' }} />,
          onClick: onEdit,
        },
        {
          label: ann.isPinned ? '상위고정 해제' : '상위고정',
          icon: <Pin style={{ width: '15px', height: '15px' }} />,
          onClick: onTogglePin,
        },
        {
          label: '알림 보내기',
          icon: <Bell style={{ width: '15px', height: '15px' }} />,
          onClick: onNotify,
        },
        {
          label: '삭제하기',
          icon: <Trash2 style={{ width: '15px', height: '15px' }} />,
          danger: true,
          onClick: onDelete,
        },
      ]}
    />
  );
}

/* ─── Toggle ─────────────────────────────────────────────────────────────── */
function Toggle({ label, color, icon, checked, onChange }: {
  label: string; color: string; icon: React.ReactNode;
  checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none" onClick={() => onChange(!checked)}>
      <div className={`w-9 h-5 rounded-full transition-colors relative ${checked ? `bg-${color}-500` : 'bg-gray-200'}`}>
        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </div>
      <span className="text-sm text-gray-700 flex items-center gap-1">{icon} {label}</span>
    </label>
  );
}

/* ─── Shared action buttons ──────────────────────────────────────────────── */
type CardActions = {
  ann: Announcement;
  badges: ScopeBadge[];
  onView: () => void; onEdit: () => void; onDelete: () => void;
  onTogglePin: () => void; onToggleImportant: () => void;
  onNotify: () => void;
};

/* ─── List Card (default) ────────────────────────────────────────────────── */
function AnnListCard({ ann, badges, onView, onEdit, onDelete, onTogglePin, onToggleImportant: _onToggleImportant, onNotify }: CardActions) {
  const hasThumb = ann.images.length > 0;
  return (
    <div
      className={`bg-white border rounded-[18px] md:rounded-[20px] transition-all hover:shadow-md cursor-pointer ${
        ann.isPinned ? 'border-l-4 border-l-red-400 border-t-gray-200 border-r-gray-200 border-b-gray-200' : 'border-gray-200'
      }`}
      style={{ boxShadow: '0 8px 24px rgba(15,23,42,.04)' }}
    >
      <div className="flex items-start gap-3 md:gap-4 p-4 md:p-5 min-h-[88px] md:min-h-[110px]">
        {/* Mobile thumbnail: 96×72 side */}
        {hasThumb && (
          <div
            className="block md:hidden shrink-0 overflow-hidden bg-gray-100 rounded-[12px] cursor-pointer"
            style={{ width: '96px', height: '72px' }}
            onClick={onView}
          >
            <img
              src={ann.images[0]}
              alt=""
              className="w-full h-full object-cover"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        )}
        {/* Desktop thumbnail: 120×80 side */}
        {hasThumb && (
          <div
            className="hidden md:block shrink-0 overflow-hidden bg-gray-100 rounded-[12px] cursor-pointer"
            style={{ width: '120px', height: '80px' }}
            onClick={onView}
          >
            <img
              src={ann.images[0]}
              alt=""
              className="w-full h-full object-cover"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        )}

        <div className="flex-1 min-w-0" onClick={onView}>
          {/* Badges row */}
          <div className="flex items-center gap-1.5 mb-1.5 md:mb-2 flex-wrap">
            {badges.map((b, i) => (
              <StatusBadge key={i} label={b.label} variant={b.variant} />
            ))}
            {ann.isPinned && (
              <span className="inline-flex items-center gap-0.5 px-2.5 font-bold bg-red-50 text-red-500 border border-red-200 text-[11px]"
                style={{ height: '22px', borderRadius: '999px' }}>
                <Pin className="w-2.5 h-2.5" /> 고정
              </span>
            )}
            {ann.isImportant && (
              <span className="inline-flex items-center gap-0.5 px-2.5 font-bold bg-amber-50 text-amber-500 border border-amber-200 text-[11px]"
                style={{ height: '22px', borderRadius: '999px' }}>
                <Star className="w-2.5 h-2.5" /> 중요
              </span>
            )}
          </div>
          {/* Title */}
          <h4 className="font-bold text-gray-900 mb-1 leading-tight line-clamp-2" style={{ fontSize: '15px' }}>{ann.title}</h4>
          {/* Summary */}
          <p className="text-sm text-gray-500 line-clamp-2 mb-1.5 md:mb-2">{ann.content.split('\n').filter(Boolean)[0]}</p>
          {/* Meta */}
          <div className="flex items-center gap-3 text-[12px] text-gray-400">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{ann.date}</span>
            <span>{ann.author}</span>
            {ann.images.length > 0 && (
              <span className="flex items-center gap-0.5"><ImageIcon className="w-3 h-3" />{ann.images.length}</span>
            )}
            {ann.files.length > 0 && (
              <span className="flex items-center gap-0.5"><Paperclip className="w-3 h-3" />{ann.files.length}</span>
            )}
          </div>
        </div>
        {/* Actions */}
        <div className="shrink-0">
          <CardMenu ann={ann} onEdit={onEdit} onDelete={onDelete} onTogglePin={onTogglePin} onNotify={onNotify} />
        </div>
      </div>
    </div>
  );
}

/* ─── Grid Card ──────────────────────────────────────────────────────────── */
function AnnGridCard({ ann, badges, onView, onEdit, onDelete, onTogglePin, onNotify }: CardActions) {
  const hasThumb = ann.images.length > 0;
  return (
    <div
      className={`bg-white border rounded-[20px] flex flex-col transition-all hover:shadow-lg hover:-translate-y-0.5 overflow-hidden ${
        ann.isPinned ? 'border-l-4 border-l-red-400 border-t-gray-200 border-r-gray-200 border-b-gray-200' : 'border-gray-200'
      }`}
      style={{ boxShadow: '0 8px 24px rgba(15,23,42,.04)' }}
    >
      {/* Top thumbnail */}
      {hasThumb && (
        <div
          className="w-full shrink-0 overflow-hidden bg-gray-100 cursor-pointer"
          style={{ height: '140px' }}
          onClick={onView}
        >
          <img
            src={ann.images[0]}
            alt=""
            className="w-full h-full object-cover"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      )}

      <div className={`flex-1 cursor-pointer ${hasThumb ? 'p-4' : 'p-5'}`} onClick={onView}>
        {/* Badges */}
        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
          {badges.map((b, i) => (
            <StatusBadge key={i} label={b.label} variant={b.variant} />
          ))}
          {ann.isPinned && (
            <span className="inline-flex items-center gap-0.5 px-2.5 font-bold bg-red-50 text-red-500 border border-red-200 text-[11px]"
              style={{ height: '22px', borderRadius: '999px' }}>
              <Pin className="w-2.5 h-2.5" /> 고정
            </span>
          )}
        </div>
        {/* Title */}
        <h4 className="font-bold text-gray-900 mb-2 leading-snug line-clamp-2" style={{ fontSize: '15px' }}>{ann.title}</h4>
        {/* Summary */}
        <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-2">{ann.content.split('\n').filter(Boolean)[0]}</p>
        {/* Author */}
        <p className="text-[12px] text-gray-400">{ann.author}</p>
      </div>
      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
        <div className="flex items-center gap-2.5 text-[12px] text-gray-400">
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{ann.date}</span>
          {(ann.images.length > 0 || ann.files.length > 0) && (
            <span className="flex items-center gap-1">
              {ann.images.length > 0 && <><ImageIcon className="w-3 h-3" />{ann.images.length}</>}
              {ann.files.length > 0 && <><Paperclip className="w-3 h-3" />{ann.files.length}</>}
            </span>
          )}
        </div>
        <CardMenu ann={ann} onEdit={onEdit} onDelete={onDelete} onTogglePin={onTogglePin} onNotify={onNotify} />
      </div>
    </div>
  );
}


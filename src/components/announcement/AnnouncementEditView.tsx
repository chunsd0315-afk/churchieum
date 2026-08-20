/**
 * 공지사항 수정 — ContentEditorLayout (은혜와 기도 수정과 동일 레이아웃)
 * 기존 announcementStorage 필드만 사용. 댓글·공감 추가 없음.
 */

import { useMemo, useRef, useState } from 'react';
import { ImageIcon, Paperclip, Upload, X, Save } from 'lucide-react';
import {
  fileToBase64,
  formatFileSize,
  ACCEPT_FILES,
  updateAnnouncement,
  getAllAnnouncements,
  type Announcement,
  type AttachFile,
} from '../../services/announcementStorage';
import {
  getAllDistricts,
  getZones,
  getAllDepartments,
} from '../../services/orgData';
import { useOrgSettings } from '../../contexts/OrgSettingsContext';
import ContentEditorLayout, { ContentFormCard } from '../layout/ContentEditorLayout';

type Category = Announcement['category'];
type Scope = Announcement['scope'];

type FormData = {
  title: string;
  content: string;
  category: Category;
  scope: Scope;
  scopeId: string;
  date: string;
  isPinned: boolean;
  isImportant: boolean;
  allowComments: boolean;
  images: string[];
  files: AttachFile[];
};

const INPUT =
  'w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400';

type Props = {
  announcementId: string;
  onBack: () => void;
  onSaved: (id: string) => void;
};

export function AnnouncementEditView({ announcementId, onBack, onSaved }: Props) {
  const existing = getAllAnnouncements().find(a => a.id === announcementId);
  const { l1, l2, dept, settings } = useOrgSettings();
  const districts = useMemo(() => getAllDistricts().filter(d => d.is_active), []);
  const departments = useMemo(() => getAllDepartments().filter(d => d.is_active), []);

  const [form, setForm] = useState<FormData>(() => ({
    title: existing?.title ?? '',
    content: existing?.content ?? '',
    category: existing?.category ?? '일반공지',
    scope: existing?.scope ?? 'all',
    scopeId: existing?.scopeId ?? '',
    date: existing?.date ?? new Date().toISOString().slice(0, 10),
    isPinned: existing?.isPinned ?? false,
    isImportant: existing?.isImportant ?? false,
    allowComments: existing?.allowComments !== false,
    images: existing?.images ?? [],
    files: existing?.files ?? [],
  }));
  const [uploading, setUploading] = useState(false);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scopeOptions: { value: Scope; label: string }[] = [
    { value: 'all', label: '전체 공개' },
    ...(settings.level1Enabled ? [{ value: 'level1' as Scope, label: `${l1} 공개` }] : []),
    ...(settings.level2Enabled ? [{ value: 'level2' as Scope, label: `${l2} 공개` }] : []),
    ...(settings.departmentEnabled ? [{ value: 'department' as Scope, label: `${dept} 공개` }] : []),
  ];

  const scopeOrgs = useMemo(() => {
    if (form.scope === 'level1') return districts.map(d => ({ id: d.id, name: d.name }));
    if (form.scope === 'level2') {
      return getZones().filter(z => z.is_active).map(z => ({ id: z.id, name: z.name }));
    }
    if (form.scope === 'department') return departments.map(d => ({ id: d.id, name: d.name }));
    return [];
  }, [form.scope, districts, departments]);

  const getScopeName = (scope: Scope, scopeId: string) => {
    if (scope === 'level1') return districts.find(d => d.id === scopeId)?.name ?? '';
    if (scope === 'level2') return getZones().find(z => z.id === scopeId)?.name ?? '';
    if (scope === 'department') return departments.find(d => d.id === scopeId)?.name ?? '';
    return '';
  };

  if (!existing) {
    return (
      <ContentEditorLayout title="공지 수정" description="공지를 수정합니다." onBack={onBack}>
        <p className="text-sm text-gray-400 text-center py-16">공지를 찾을 수 없습니다.</p>
      </ContentEditorLayout>
    );
  }

  const handleSave = () => {
    if (!form.title.trim() || !form.content.trim()) return;
    updateAnnouncement(announcementId, {
      title: form.title.trim(),
      content: form.content.trim(),
      category: form.category,
      scope: form.scope,
      scopeId: form.scope !== 'all' ? form.scopeId : undefined,
      scopeName: form.scope !== 'all' ? getScopeName(form.scope, form.scopeId) : undefined,
      date: form.date,
      isPinned: form.isPinned,
      isImportant: form.isImportant,
      allowComments: form.allowComments,
      author: existing.author,
      images: form.images,
      files: form.files,
      comments: existing.comments,
    });
    onSaved(announcementId);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    const attached: AttachFile[] = await Promise.all(
      files.map(async f => ({
        name: f.name,
        size: formatFileSize(f.size),
        type: f.type,
        data: await fileToBase64(f),
      })),
    );
    setForm(prev => ({ ...prev, files: [...prev.files, ...attached] }));
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const saveButton = (
    <button
      type="button"
      onClick={handleSave}
      disabled={!form.title.trim() || !form.content.trim()}
      className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-bold hover:bg-primary-600 disabled:opacity-40 touch-target"
    >
      <Save className="w-4 h-4" />
      저장
    </button>
  );

  return (
    <ContentEditorLayout
      title="공지 수정"
      description="공지 내용을 수정합니다."
      onBack={onBack}
      saveButton={saveButton}
    >
      <ContentFormCard className="space-y-5">
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-2 block">공지 유형</label>
          <div className="flex gap-2 flex-wrap">
            {(['일반공지', '행사안내', '가정통신문', '기타'] as Category[]).map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setForm(f => ({ ...f, category: cat }))}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold border-2 transition-all touch-target ${
                  form.category === cat
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 mb-2 block">제목</label>
          <input
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className={INPUT}
            placeholder="공지 제목"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 mb-2 block">내용</label>
          <textarea
            value={form.content}
            onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
            className={`${INPUT} min-h-[160px] resize-y`}
            placeholder="공지 내용"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 mb-2 block">게시일</label>
          <input
            type="date"
            value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            className={INPUT}
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 mb-2 block">공개범위</label>
          <div className="flex gap-2 flex-wrap mb-2">
            {scopeOptions.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setForm(f => ({ ...f, scope: opt.value, scopeId: '' }))}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold border-2 transition-all touch-target ${
                  form.scope === opt.value
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 text-gray-600'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {form.scope !== 'all' && (
            <select
              value={form.scopeId}
              onChange={e => setForm(f => ({ ...f, scopeId: e.target.value }))}
              className={INPUT}
            >
              <option value="">선택</option>
              {scopeOrgs.map(o => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          )}
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700 touch-target">
            <input
              type="checkbox"
              checked={form.isImportant}
              onChange={e => setForm(f => ({ ...f, isImportant: e.target.checked }))}
              className="rounded border-gray-300 text-primary-500 focus:ring-primary-400"
            />
            중요 공지
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700 touch-target">
            <input
              type="checkbox"
              checked={form.isPinned}
              onChange={e => setForm(f => ({ ...f, isPinned: e.target.checked }))}
              className="rounded border-gray-300 text-primary-500 focus:ring-primary-400"
            />
            상단 고정
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-gray-700 touch-target">
            <input
              type="checkbox"
              checked={form.allowComments}
              onChange={e => setForm(f => ({ ...f, allowComments: e.target.checked }))}
              className="rounded border-gray-300 text-primary-500 focus:ring-primary-400"
            />
            댓글 허용
          </label>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 mb-2 block">이미지</label>
          <input ref={imgInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
          <button
            type="button"
            onClick={() => imgInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 touch-target"
          >
            <ImageIcon className="w-4 h-4" /> 이미지 추가
          </button>
          {form.images.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-3">
              {form.images.map((img, i) => (
                <div key={i} className="relative aspect-video rounded-xl overflow-hidden bg-gray-100">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, images: f.images.filter((_, j) => j !== i) }))}
                    className="absolute top-1 right-1 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center"
                    aria-label="이미지 삭제"
                  >
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 mb-2 block">첨부파일</label>
          <input ref={fileInputRef} type="file" accept={ACCEPT_FILES} multiple className="hidden" onChange={handleFileUpload} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 touch-target"
          >
            <Upload className="w-4 h-4" /> 파일 추가
          </button>
          {form.files.length > 0 && (
            <div className="space-y-1.5 mt-3">
              {form.files.map((f, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl">
                  <Paperclip className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="flex-1 text-sm text-gray-700 truncate">{f.name}</span>
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, files: prev.files.filter((_, j) => j !== i) }))}
                    className="p-1 text-gray-400 hover:text-red-500"
                    aria-label="파일 삭제"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </ContentFormCard>
    </ContentEditorLayout>
  );
}

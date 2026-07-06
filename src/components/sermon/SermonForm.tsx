import { useState, useEffect, useRef } from 'react';
import { Paperclip, X, Save } from 'lucide-react';
import type {
  Sermon, SermonAttachment, SermonFolder, SermonStatus, SermonVisibility, WorshipType,
} from '../../types/sermon';
import {
  WORSHIP_TYPE_LABELS, WORSHIP_TAB_TYPES,
  SERMON_VISIBILITY_LABELS, SERMON_STATUS_LABELS,
} from '../../types/sermon';
import { getSelectableFolders, getYouTubeId } from '../../lib/sermonStorage';
import { saveSermonDraft, getSermonDraft, clearSermonDraft } from '../../lib/sermonEngagementStorage';
import type { AppUser } from '../../lib/permissions';

export type SermonFormData = {
  title: string;
  scripture: string;
  preacher: string;
  sermonDate: string;
  worshipType: WorshipType;
  folderId: string;
  folderName: string;
  videoUrl: string;
  youtubeVideoId: string | null;
  summary: string;
  tags: string[];
  attachments: SermonAttachment[];
  visibility: SermonVisibility;
  status: SermonStatus;
};

const INPUT = 'w-full px-4 py-3.5 text-base bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:outline-none';
const LABEL = 'block text-sm font-semibold text-gray-700 mb-2';

function emptyForm(folders: SermonFolder[]): SermonFormData {
  const f = folders[0];
  return {
    title: '', scripture: '', preacher: '',
    sermonDate: new Date().toISOString().split('T')[0],
    worshipType: f?.worshipType ?? 'sunday',
    folderId: f?.id ?? '', folderName: f?.name ?? '',
    videoUrl: '', youtubeVideoId: null,
    summary: '', tags: [], attachments: [],
    visibility: 'all', status: 'published',
  };
}

export function sermonToFormData(sermon: Sermon): SermonFormData {
  return {
    title: sermon.title,
    scripture: sermon.scripture,
    preacher: sermon.preacher,
    sermonDate: sermon.sermonDate,
    worshipType: sermon.worshipType,
    folderId: sermon.folderId,
    folderName: sermon.folderName,
    videoUrl: sermon.videoUrl,
    youtubeVideoId: sermon.youtubeVideoId,
    summary: sermon.summary,
    tags: [...sermon.tags],
    attachments: [...sermon.attachments],
    visibility: sermon.visibility,
    status: sermon.status,
  };
}

type Props = {
  editing?: Sermon | null;
  user: AppUser | null;
  onSave: (data: SermonFormData, status: SermonStatus) => void;
  onCancel: () => void;
};

export default function SermonForm({ editing, user, onSave, onCancel }: Props) {
  const folders = getSelectableFolders();
  const [form, setForm] = useState<SermonFormData>(() =>
    editing ? sermonToFormData(editing) : emptyForm(folders),
  );
  const [tagInput, setTagInput] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing && user) {
      const draft = getSermonDraft(user.id);
      if (draft?.data && typeof draft.data === 'object') {
        setForm({ ...emptyForm(folders), ...(draft.data as SermonFormData) });
      }
    }
  }, [editing, user?.id]);

  const setField = <K extends keyof SermonFormData>(k: K, v: SermonFormData[K]) => {
    setForm(p => ({ ...p, [k]: v }));
  };

  const handleFolder = (id: string) => {
    const f = folders.find(x => x.id === id);
    setForm(p => ({
      ...p,
      folderId: id,
      folderName: f?.name ?? '',
      worshipType: f?.worshipType ?? p.worshipType,
    }));
  };

  const handleWorshipType = (wt: WorshipType) => {
    const match = folders.find(f => f.worshipType === wt);
    setForm(p => ({
      ...p,
      worshipType: wt,
      folderId: match?.id ?? p.folderId,
      folderName: match?.name ?? WORSHIP_TYPE_LABELS[wt],
    }));
  };

  const handleVideo = (url: string) => {
    setForm(p => ({ ...p, videoUrl: url, youtubeVideoId: getYouTubeId(url) }));
  };

  const handleFile = (files: FileList | null) => {
    if (!files?.length || form.attachments.length >= 5) return;
    const picked = Array.from(files).slice(0, 5 - form.attachments.length);
    const next = picked.map(file => ({
      id: `sa-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      name: file.name,
      type: file.type.includes('pdf') ? 'pdf' as const
        : file.type.startsWith('image/') ? 'image' as const
        : file.type.startsWith('audio/') ? 'audio' as const
        : 'document' as const,
      url: URL.createObjectURL(file),
      size: file.size,
      createdAt: new Date().toISOString(),
    }));
    setForm(p => ({ ...p, attachments: [...p.attachments, ...next] }));
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (!t || form.tags.includes(t)) return;
    setForm(p => ({ ...p, tags: [...p.tags, t] }));
    setTagInput('');
  };

  const saveDraft = () => {
    if (user) saveSermonDraft(user.id, form);
    alert('임시저장되었습니다.');
  };

  const submit = (status: SermonStatus) => {
    if (!form.title.trim() || !form.preacher.trim() || !form.sermonDate) return;
    if (user && status === 'published') clearSermonDraft(user.id);
    onSave(form, status);
  };

  return (
    <div className="space-y-5 pb-8">
      <div>
        <label className={LABEL}>설교 제목 *</label>
        <input value={form.title} onChange={e => setField('title', e.target.value)}
          placeholder="예: 믿음의 출발" className={INPUT} />
      </div>

      <div>
        <label className={LABEL}>본문 말씀</label>
        <input value={form.scripture} onChange={e => setField('scripture', e.target.value)}
          placeholder="예: 히브리서 11:1" className={INPUT} />
      </div>

      <div>
        <label className={LABEL}>설교자 *</label>
        <input value={form.preacher} onChange={e => setField('preacher', e.target.value)}
          placeholder="예: 김성기 목사" className={INPUT} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>예배 종류</label>
          <select value={form.worshipType} onChange={e => handleWorshipType(e.target.value as WorshipType)}
            className={INPUT}>
            {[...WORSHIP_TAB_TYPES, 'other' as WorshipType].map(wt => (
              <option key={wt} value={wt}>{WORSHIP_TYPE_LABELS[wt]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL}>설교 날짜 *</label>
          <input type="date" value={form.sermonDate}
            onChange={e => setField('sermonDate', e.target.value)} className={INPUT} />
        </div>
      </div>

      <div>
        <label className={LABEL}>설교 폴더</label>
        <select value={form.folderId} onChange={e => handleFolder(e.target.value)} className={INPUT}>
          {folders.map(f => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={LABEL}>YouTube 링크 또는 영상 URL</label>
        <input value={form.videoUrl} onChange={e => handleVideo(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..." className={INPUT} />
        {form.youtubeVideoId && (
          <img src={`https://img.youtube.com/vi/${form.youtubeVideoId}/hqdefault.jpg`}
            alt="" className="mt-2 rounded-xl w-full max-w-md aspect-video object-cover" />
        )}
      </div>

      <div>
        <label className={LABEL}>설교 요약</label>
        <textarea value={form.summary} onChange={e => setField('summary', e.target.value)}
          rows={4} placeholder="설교 핵심 내용을 간단히 적어 주세요"
          className={`${INPUT} resize-none`} />
      </div>

      <div>
        <label className={LABEL}>태그</label>
        <div className="flex gap-2">
          <input value={tagInput} onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
            placeholder="태그 입력 후 추가" className={`${INPUT} flex-1`} />
          <button type="button" onClick={addTag}
            className="px-4 py-3 bg-gray-100 rounded-xl text-sm font-semibold shrink-0">추가</button>
        </div>
        {form.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {form.tags.map(tag => (
              <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm">
                #{tag}
                <button type="button" onClick={() => setForm(p => ({ ...p, tags: p.tags.filter(t => t !== tag) }))}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className={LABEL}>설교 자료 첨부 (최대 5개)</label>
        <input ref={fileRef} type="file" multiple className="hidden"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.mp3"
          onChange={e => handleFile(e.target.files)} />
        <button type="button" onClick={() => fileRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:border-primary-300 hover:text-primary-600">
          <Paperclip className="w-5 h-5" /> 파일 선택
        </button>
        {form.attachments.map(att => (
          <div key={att.id} className="flex items-center gap-2 mt-2 px-3 py-2 bg-gray-50 rounded-xl text-sm">
            <Paperclip className="w-4 h-4 text-gray-400" />
            <span className="flex-1 truncate">{att.name}</span>
            <button type="button" onClick={() => setForm(p => ({
              ...p, attachments: p.attachments.filter(a => a.id !== att.id),
            }))}>
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        ))}
      </div>

      <div>
        <label className={LABEL}>공개 설정</label>
        <select value={form.visibility} onChange={e => setField('visibility', e.target.value as SermonVisibility)}
          className={INPUT}>
          {(Object.keys(SERMON_VISIBILITY_LABELS) as SermonVisibility[]).map(v => (
            <option key={v} value={v}>{SERMON_VISIBILITY_LABELS[v]}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button type="button" onClick={onCancel}
          className="flex-1 py-4 border border-gray-200 text-gray-600 font-bold rounded-2xl text-base">
          취소
        </button>
        {!editing && (
          <button type="button" onClick={saveDraft}
            className="flex-1 py-4 bg-gray-100 text-gray-700 font-bold rounded-2xl text-base flex items-center justify-center gap-2">
            <Save className="w-5 h-5" /> 임시저장
          </button>
        )}
        <button type="button" onClick={() => submit('draft')}
          className="flex-1 py-4 bg-amber-100 text-amber-800 font-bold rounded-2xl text-base">
          {SERMON_STATUS_LABELS.draft}
        </button>
        <button type="button" onClick={() => submit('published')}
          className="flex-1 py-4 bg-primary-500 text-white font-bold rounded-2xl text-base hover:bg-primary-600">
          {editing ? '수정 저장' : '등록'}
        </button>
      </div>
    </div>
  );
}

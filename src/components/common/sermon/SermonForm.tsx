import { useState, useEffect, useRef } from 'react';
import { Paperclip, X, Save } from 'lucide-react';
import type {
  Sermon, SermonAttachment, SermonFolder, SermonStatus, SermonVisibility, WorshipType,
} from '../../../types/sermon';
import {
  SERMON_VISIBILITY_LABELS, SERMON_STATUS_LABELS,
} from '../../../types/sermon';
import { getSelectableFolders, getYouTubeId } from '../../../services/sermonStorage';
import { saveSermonDraft, getSermonDraft, clearSermonDraft } from '../../../services/sermonEngagementStorage';
import type { AppUser } from '../../../services/permissions';
import { useBreakpoint } from '../../../hooks/useBreakpoint';
import {
  sermonInputClass, sermonTextareaClass, sermonLabelClass,
  sermonPrimaryBtnClass, sermonSecondaryBtnClass,
} from './sermonDesign';

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
    title: sermon.title, scripture: sermon.scripture, preacher: sermon.preacher,
    sermonDate: sermon.sermonDate, worshipType: sermon.worshipType,
    folderId: sermon.folderId, folderName: sermon.folderName,
    videoUrl: sermon.videoUrl, youtubeVideoId: sermon.youtubeVideoId,
    summary: sermon.summary, tags: [...sermon.tags], attachments: [...sermon.attachments],
    visibility: sermon.visibility, status: sermon.status,
  };
}

type Props = {
  editing?: Sermon | null;
  user: AppUser | null;
  onSave: (data: SermonFormData, status: SermonStatus) => void;
  onCancel: () => void;
};

export default function SermonForm({ editing, user, onSave, onCancel }: Props) {
  const { isMobile } = useBreakpoint();
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
    setForm(p => ({ ...p, folderId: id, folderName: f?.name ?? '', worshipType: f?.worshipType ?? p.worshipType }));
  };

  const handleFile = (files: FileList | null) => {
    if (!files?.length || form.attachments.length >= 5) return;
    const next = Array.from(files).slice(0, 5 - form.attachments.length).map(file => ({
      id: `sa-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      name: file.name,
      type: (file.type.includes('pdf') ? 'pdf' : file.type.startsWith('image/') ? 'image' : file.type.startsWith('audio/') ? 'audio' : 'document') as SermonAttachment['type'],
      url: URL.createObjectURL(file), size: file.size, createdAt: new Date().toISOString(),
    }));
    setForm(p => ({ ...p, attachments: [...p.attachments, ...next] }));
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

  const actionBar = (
    <div className={`flex flex-wrap justify-end gap-3 ${isMobile ? 'flex-col' : ''}`}>
      <button type="button" onClick={onCancel} className={`${sermonSecondaryBtnClass} ${isMobile ? 'w-full' : ''}`}>
        취소
      </button>
      {!editing && (
        <button type="button" onClick={saveDraft}
          className={`${sermonSecondaryBtnClass} ${isMobile ? 'w-full' : ''}`}>
          <Save className="w-5 h-5" /> 임시저장
        </button>
      )}
      <button type="button" onClick={() => submit('draft')}
        className={`h-12 px-6 rounded-[14px] bg-amber-50 border border-amber-200 text-amber-800 font-bold text-base hover:bg-amber-100 ${isMobile ? 'w-full' : ''}`}>
        {SERMON_STATUS_LABELS.draft}
      </button>
      <button type="button" onClick={() => submit('published')}
        className={`${sermonPrimaryBtnClass} ${isMobile ? 'w-full' : ''}`}>
        {editing ? '수정 저장' : '등록'}
      </button>
    </div>
  );

  return (
    <div className={isMobile ? 'pb-28' : 'pb-4'}>
      <div className="space-y-6">
        <div>
          <label className={sermonLabelClass}>설교 제목 *</label>
          <input value={form.title} onChange={e => setField('title', e.target.value)} placeholder="예: 믿음의 출발" className={sermonInputClass} />
        </div>
        <div>
          <label className={sermonLabelClass}>본문 말씀</label>
          <input value={form.scripture} onChange={e => setField('scripture', e.target.value)} placeholder="예: 히브리서 11:1" className={sermonInputClass} />
        </div>
        <div>
          <label className={sermonLabelClass}>설교자 *</label>
          <input value={form.preacher} onChange={e => setField('preacher', e.target.value)} placeholder="예: 김성기 목사" className={sermonInputClass} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={sermonLabelClass}>예배 종류 *</label>
            <select value={form.folderId} onChange={e => handleFolder(e.target.value)} className={sermonInputClass}>
              {folders.length === 0 && <option value="">등록된 예배 폴더가 없습니다</option>}
              {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div>
            <label className={sermonLabelClass}>설교 날짜 *</label>
            <input type="date" value={form.sermonDate} onChange={e => setField('sermonDate', e.target.value)} className={sermonInputClass} />
          </div>
        </div>
        <div>
          <label className={sermonLabelClass}>YouTube 링크 또는 영상 URL</label>
          <input value={form.videoUrl}
            onChange={e => {
              const url = e.target.value;
              setForm(p => ({ ...p, videoUrl: url, youtubeVideoId: getYouTubeId(url) }));
            }}
            placeholder="https://www.youtube.com/watch?v=..." className={sermonInputClass} />
          {form.youtubeVideoId && (
            <img src={`https://img.youtube.com/vi/${form.youtubeVideoId}/hqdefault.jpg`} alt=""
              className="mt-3 rounded-[14px] w-full max-w-md aspect-video object-cover border border-[#E5E7EB]" />
          )}
        </div>
        <div>
          <label className={sermonLabelClass}>설교 요약</label>
          <textarea value={form.summary} onChange={e => setField('summary', e.target.value)}
            placeholder="설교 핵심 내용을 간단히 적어 주세요" className={sermonTextareaClass} />
        </div>
        <div>
          <label className={sermonLabelClass}>태그</label>
          <div className="flex gap-2">
            <input value={tagInput} onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), tagInput.trim() && !form.tags.includes(tagInput.trim()) && (setForm(p => ({ ...p, tags: [...p.tags, tagInput.trim()] })), setTagInput('')))}
              placeholder="태그 입력 후 추가" className={`${sermonInputClass} flex-1`} />
            <button type="button" onClick={() => { const t = tagInput.trim(); if (t && !form.tags.includes(t)) { setForm(p => ({ ...p, tags: [...p.tags, t] })); setTagInput(''); } }}
              className={sermonSecondaryBtnClass}>추가</button>
          </div>
          {form.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {form.tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full text-sm font-semibold">
                  #{tag}
                  <button type="button" onClick={() => setForm(p => ({ ...p, tags: p.tags.filter(t => t !== tag) }))}><X className="w-4 h-4" /></button>
                </span>
              ))}
            </div>
          )}
        </div>
        <div>
          <label className={sermonLabelClass}>설교 자료 첨부 (최대 5개)</label>
          <input ref={fileRef} type="file" multiple className="hidden" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.mp3" onChange={e => handleFile(e.target.files)} />
          <button type="button" onClick={() => fileRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 min-h-[56px] border-2 border-dashed border-[#E5E7EB] rounded-[14px] text-[15px] font-semibold text-[#6B7280] hover:border-primary-300 hover:text-primary-600 bg-[#F7F9FB]">
            <Paperclip className="w-5 h-5" /> 파일 선택
          </button>
          {form.attachments.map(att => (
            <div key={att.id} className="flex items-center gap-2 mt-2 px-4 py-3 bg-[#F7F9FB] border border-[#E5E7EB] rounded-[14px] text-[15px]">
              <Paperclip className="w-4 h-4 text-gray-400" />
              <span className="flex-1 truncate font-medium">{att.name}</span>
              <button type="button" onClick={() => setForm(p => ({ ...p, attachments: p.attachments.filter(a => a.id !== att.id) }))}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          ))}
        </div>
        <div>
          <label className={sermonLabelClass}>공개 설정</label>
          <select value={form.visibility} onChange={e => setField('visibility', e.target.value as SermonVisibility)} className={sermonInputClass}>
            {(Object.keys(SERMON_VISIBILITY_LABELS) as SermonVisibility[]).map(v => (
              <option key={v} value={v}>{SERMON_VISIBILITY_LABELS[v]}</option>
            ))}
          </select>
        </div>

        {!isMobile && <div className="pt-4 border-t border-[#E5E7EB]">{actionBar}</div>}
      </div>

      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-white/95 backdrop-blur-md border-t border-[#E5E7EB] shadow-[0_-8px_24px_rgba(15,23,42,.06)]">
          {actionBar}
        </div>
      )}
    </div>
  );
}

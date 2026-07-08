import { useState, useRef } from 'react';
import { ImagePlus, Video, X, Save } from 'lucide-react';
import type {
  Sermon, SermonFolder, SermonStatus, SermonVisibility, WorshipType,
} from '../../../types/sermon';
import { getSelectableFolders, getYouTubeId } from '../../../services/sermonStorage';
import { useBreakpoint } from '../../../hooks/useBreakpoint';
import {
  sermonInputClass, sermonLabelClass,
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
  thumbnailUrl: string;
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
    thumbnailUrl: '',
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
    thumbnailUrl: sermon.thumbnailUrl ?? '',
    visibility: sermon.visibility,
    status: sermon.status,
  };
}

type Props = {
  editing?: Sermon | null;
  onSave: (data: SermonFormData, status: SermonStatus) => void;
  onCancel: () => void;
};

export default function SermonForm({ editing, onSave, onCancel }: Props) {
  const { isMobile } = useBreakpoint();
  const folders = getSelectableFolders();
  const [form, setForm] = useState<SermonFormData>(() =>
    editing ? sermonToFormData(editing) : emptyForm(folders),
  );
  const thumbRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

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

  const handleThumbnail = (files: FileList | null) => {
    const file = files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setField('thumbnailUrl', URL.createObjectURL(file));
  };

  const handleVideoFile = (files: FileList | null) => {
    const file = files?.[0];
    if (!file || !file.type.startsWith('video/')) return;
    const url = URL.createObjectURL(file);
    setForm(p => ({ ...p, videoUrl: url, youtubeVideoId: null }));
  };

  const saveDraft = () => {
    onSave(form, 'draft');
  };

  const publish = () => {
    if (!form.title.trim() || !form.preacher.trim() || !form.sermonDate) return;
    onSave(form, 'published');
  };

  const actionBar = (
    <div className={`flex gap-3 ${isMobile ? 'flex-col' : 'flex-row justify-end'}`}>
      <button type="button" onClick={onCancel} className={`${sermonSecondaryBtnClass} ${isMobile ? 'w-full' : ''}`}>
        취소
      </button>
      <button
        type="button"
        onClick={saveDraft}
        className={`${sermonSecondaryBtnClass} ${isMobile ? 'w-full' : ''}`}
      >
        <Save className="w-5 h-5" /> 임시저장
      </button>
      <button
        type="button"
        onClick={publish}
        className={`${sermonPrimaryBtnClass} ${isMobile ? 'w-full' : ''}`}
      >
        {editing ? (editing.status === 'draft' ? '등록' : '저장') : '등록'}
      </button>
    </div>
  );

  return (
    <div className={isMobile ? undefined : 'pb-4'}>
      <div
        className="space-y-6"
        style={isMobile ? { paddingBottom: 'calc(14rem + env(safe-area-inset-bottom, 0px))' } : undefined}
      >
        <div>
          <label className={sermonLabelClass}>예배 종류 *</label>
          <select value={form.folderId} onChange={e => handleFolder(e.target.value)} className={sermonInputClass}>
            {folders.length === 0 && <option value="">등록된 예배 폴더가 없습니다</option>}
            {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </div>

        <div>
          <label className={sermonLabelClass}>설교 제목 *</label>
          <input
            value={form.title}
            onChange={e => setField('title', e.target.value)}
            placeholder="예: 믿음의 출발"
            className={sermonInputClass}
          />
        </div>

        <div>
          <label className={sermonLabelClass}>설교자 *</label>
          <input
            value={form.preacher}
            onChange={e => setField('preacher', e.target.value)}
            placeholder="예: 김성기 목사"
            className={sermonInputClass}
          />
        </div>

        <div>
          <label className={sermonLabelClass}>성경 본문</label>
          <input
            value={form.scripture}
            onChange={e => setField('scripture', e.target.value)}
            placeholder="예: 히브리서 11:1"
            className={sermonInputClass}
          />
        </div>

        <div>
          <label className={sermonLabelClass}>설교 날짜 *</label>
          <input
            type="date"
            value={form.sermonDate}
            onChange={e => setField('sermonDate', e.target.value)}
            className={sermonInputClass}
          />
        </div>

        <div>
          <label className={sermonLabelClass}>썸네일 이미지</label>
          <input
            ref={thumbRef}
            type="file"
            className="hidden"
            accept="image/jpeg,image/png,image/webp"
            onChange={e => handleThumbnail(e.target.files)}
          />
          {form.thumbnailUrl ? (
            <div className="relative rounded-[14px] overflow-hidden border border-[#E5E7EB] max-w-md">
              <img src={form.thumbnailUrl} alt="설교 썸네일 미리보기" className="w-full aspect-video object-cover" />
              <button
                type="button"
                onClick={() => setField('thumbnailUrl', '')}
                className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70"
                aria-label="썸네일 제거"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => thumbRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 min-h-[56px] border-2 border-dashed border-[#E5E7EB] rounded-[14px] text-[15px] font-semibold text-[#6B7280] hover:border-primary-300 hover:text-primary-600 bg-[#F7F9FB]"
            >
              <ImagePlus className="w-5 h-5" /> 이미지 선택
            </button>
          )}
          {!form.thumbnailUrl && form.youtubeVideoId && (
            <p className="mt-2 text-[13px] text-[#6B7280]">YouTube 영상 썸네일이 자동으로 사용됩니다.</p>
          )}
        </div>

        <div>
          <label className={sermonLabelClass}>설교 영상 (URL 또는 업로드)</label>
          <input
            value={form.videoUrl.startsWith('blob:') ? '' : form.videoUrl}
            onChange={e => {
              const url = e.target.value;
              setForm(p => ({ ...p, videoUrl: url, youtubeVideoId: getYouTubeId(url) }));
            }}
            placeholder="https://www.youtube.com/watch?v=..."
            className={sermonInputClass}
          />
          <input
            ref={videoRef}
            type="file"
            className="hidden"
            accept="video/mp4,video/webm,video/quicktime"
            onChange={e => handleVideoFile(e.target.files)}
          />
          <button
            type="button"
            onClick={() => videoRef.current?.click()}
            className="mt-3 w-full flex items-center justify-center gap-2 min-h-[48px] border border-[#E5E7EB] rounded-[14px] text-[15px] font-semibold text-[#6B7280] hover:border-primary-300 hover:text-primary-600 bg-white"
          >
            <Video className="w-5 h-5" /> 영상 파일 선택
          </button>
          {form.videoUrl.startsWith('blob:') && (
            <p className="mt-2 text-[13px] text-primary-600 font-semibold">로컬 영상 파일이 선택되었습니다.</p>
          )}
          {form.youtubeVideoId && !form.thumbnailUrl && (
            <img
              src={`https://img.youtube.com/vi/${form.youtubeVideoId}/hqdefault.jpg`}
              alt=""
              className="mt-3 rounded-[14px] w-full max-w-md aspect-video object-cover border border-[#E5E7EB]"
            />
          )}
        </div>

        {!isMobile && <div className="pt-4 border-t border-[#E5E7EB]">{actionBar}</div>}
      </div>

      {isMobile && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 px-4 pt-4 bg-white/95 backdrop-blur-md border-t border-[#E5E7EB] shadow-[0_-8px_24px_rgba(15,23,42,.06)]"
          style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
        >
          {actionBar}
        </div>
      )}
    </div>
  );
}

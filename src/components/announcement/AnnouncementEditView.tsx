/**
 * 공지사항 작성·수정 — 제목 / 내용 / 첨부 / 공개범위 / 댓글 허용만
 * 공지 유형·게시일 입력 없음. createdAt 자동 저장.
 */

import { useMemo, useRef, useState } from 'react';
import { ImageIcon, Paperclip, Upload, X, Save } from 'lucide-react';
import {
  fileToBase64,
  formatFileSize,
  ACCEPT_FILES,
  addAnnouncement,
  updateAnnouncement,
  getAllAnnouncements,
  type Announcement,
  type AttachFile,
} from '../../services/announcementStorage';
import { useAuth } from '../../contexts/AuthContext';
import { getOrganizationPathLabel } from '../../services/userOrganizationTree';
import ContentEditorLayout, { ContentFormCard } from '../layout/ContentEditorLayout';
import {
  AnnouncementVisibilitySelector,
  defaultAnnouncementVisibility,
  type AnnouncementVisibilityValue,
} from './AnnouncementVisibilitySelector';

const INPUT =
  'w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400';

function visibilityFromAnnouncement(ann: Announcement): AnnouncementVisibilityValue {
  if (ann.scope === 'organizations') {
    return defaultAnnouncementVisibility({
      mode: 'organization_share',
      sharedOrganizationIds: ann.sharedOrganizationIds ?? [],
    });
  }
  if (ann.scope === 'level1' || ann.scope === 'level2' || ann.scope === 'department') {
    const ids = [
      ...(ann.sharedOrganizationIds ?? []),
      ...(ann.scopeId ? [ann.scopeId] : []),
    ];
    return defaultAnnouncementVisibility({
      mode: 'organization_share',
      sharedOrganizationIds: ids,
    });
  }
  return defaultAnnouncementVisibility({ mode: 'all' });
}

function buildScopeFields(vis: AnnouncementVisibilityValue): Pick<
  Announcement,
  'scope' | 'scopeId' | 'scopeName' | 'sharedOrganizationIds'
> {
  if (vis.mode === 'organization_share') {
    const ids = vis.sharedOrganizationIds;
    const names = ids.map(id => getOrganizationPathLabel(id)).filter(Boolean);
    return {
      scope: 'organizations',
      scopeId: ids[0],
      scopeName: names.length === 1 ? names[0] : names.length > 1 ? `조직 ${ids.length}곳` : undefined,
      sharedOrganizationIds: ids,
    };
  }
  return {
    scope: 'all',
    scopeId: undefined,
    scopeName: undefined,
    sharedOrganizationIds: [],
  };
}

type Props = {
  /** 없으면 신규 작성 */
  announcementId?: string | null;
  onBack: () => void;
  onSaved: (id: string) => void;
  /** 작성자 표시명 오버라이드 (없으면 로그인 사용자) */
  authorOverride?: string;
};

export function AnnouncementEditView({
  announcementId,
  onBack,
  onSaved,
  authorOverride,
}: Props) {
  const { user } = useAuth();
  const isCreate = !announcementId;
  const existing = announcementId
    ? getAllAnnouncements().find(a => a.id === announcementId)
    : undefined;

  const [title, setTitle] = useState(() => existing?.title ?? '');
  const [content, setContent] = useState(() => existing?.content ?? '');
  const [visibility, setVisibility] = useState<AnnouncementVisibilityValue>(() =>
    existing ? visibilityFromAnnouncement(existing) : defaultAnnouncementVisibility(),
  );
  const [allowComments, setAllowComments] = useState(() => existing?.allowComments !== false);
  const [images, setImages] = useState<string[]>(() => existing?.images ?? []);
  const [files, setFiles] = useState<AttachFile[]>(() => existing?.files ?? []);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const imgInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const authorName = useMemo(() => {
    if (authorOverride) return authorOverride;
    if (existing?.author) return existing.author;
    if (!user) return '작성자';
    const pos = user.position ? ` ${user.position}` : '';
    return `${user.name}${pos}`.trim();
  }, [authorOverride, existing?.author, user]);

  if (!isCreate && !existing) {
    return (
      <ContentEditorLayout title="공지 수정" description="공지를 수정합니다." onBack={onBack}>
        <p className="text-sm text-gray-400 text-center py-16">공지를 찾을 수 없습니다.</p>
      </ContentEditorLayout>
    );
  }

  const canSubmit =
    title.trim().length > 0 &&
    content.trim().length > 0 &&
    (visibility.mode === 'all' || visibility.sharedOrganizationIds.length > 0);

  const handleSave = () => {
    setError('');
    if (!title.trim()) {
      setError('제목을 입력해 주세요.');
      return;
    }
    if (!content.trim()) {
      setError('내용을 입력해 주세요.');
      return;
    }
    if (visibility.mode === 'organization_share' && visibility.sharedOrganizationIds.length === 0) {
      setError('공유할 조직을 하나 이상 선택해 주세요.');
      return;
    }

    const scopeFields = buildScopeFields(visibility);

    if (isCreate) {
      const created = addAnnouncement({
        title: title.trim(),
        content: content.trim(),
        category: '일반공지',
        ...scopeFields,
        isPinned: false,
        isImportant: false,
        allowComments,
        author: authorName,
        images,
        files,
        comments: [],
      });
      onSaved(created.id);
      return;
    }

    if (!existing) return;
    updateAnnouncement(existing.id, {
      title: title.trim(),
      content: content.trim(),
      ...scopeFields,
      allowComments,
      author: existing.author,
      images,
      files,
      comments: existing.comments,
      // 레거시 플래그·유형 유지 (작성 UI에서는 변경하지 않음)
      category: existing.category,
      isPinned: existing.isPinned,
      isImportant: existing.isImportant,
    });
    onSaved(existing.id);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    if (!picked.length) return;
    setUploading(true);
    const base64s = await Promise.all(picked.map(f => fileToBase64(f)));
    setImages(prev => [...prev, ...base64s]);
    setUploading(false);
    if (imgInputRef.current) imgInputRef.current.value = '';
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    if (!picked.length) return;
    setUploading(true);
    const attached: AttachFile[] = await Promise.all(
      picked.map(async f => ({
        name: f.name,
        size: formatFileSize(f.size),
        type: f.type,
        data: await fileToBase64(f),
      })),
    );
    setFiles(prev => [...prev, ...attached]);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const saveButton = (
    <button
      type="button"
      onClick={handleSave}
      disabled={!canSubmit}
      className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-500 text-white rounded-xl text-sm font-bold hover:bg-primary-600 disabled:opacity-40 touch-target"
    >
      <Save className="w-4 h-4" />
      {isCreate ? '등록' : '저장'}
    </button>
  );

  return (
    <ContentEditorLayout
      title={isCreate ? '공지사항 작성' : '공지 수정'}
      description={isCreate ? '교회 소식을 등록합니다.' : '공지 내용을 수정합니다.'}
      onBack={onBack}
      saveButton={saveButton}
    >
      <ContentFormCard className="space-y-5">
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-2 block">제목</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className={INPUT}
            placeholder="공지 제목"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 mb-2 block">내용</label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            className={`${INPUT} min-h-[160px] resize-y`}
            placeholder="공지 내용"
          />
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
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-3">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-video rounded-xl overflow-hidden bg-gray-100">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
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
          {files.length > 0 && (
            <div className="space-y-1.5 mt-3">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl">
                  <Paperclip className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="flex-1 text-sm text-gray-700 truncate">{f.name}</span>
                  <button
                    type="button"
                    onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}
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

        <AnnouncementVisibilitySelector value={visibility} onChange={setVisibility} />

        <label className="inline-flex items-center gap-3 text-sm text-gray-700 touch-target min-h-[48px]">
          <span className="font-semibold text-gray-800">댓글 허용</span>
          <button
            type="button"
            role="switch"
            aria-checked={allowComments}
            onClick={() => setAllowComments(v => !v)}
            className={`relative w-12 h-7 rounded-full transition-colors ${
              allowComments ? 'bg-primary-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform ${
                allowComments ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </label>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>
        )}
      </ContentFormCard>
    </ContentEditorLayout>
  );
}

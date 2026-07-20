import { useState } from 'react';
import ContentEditorLayout, { ContentFormCard } from '../layout/ContentEditorLayout';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../common/ui';
import {
  PrayerShareSelector,
  defaultPrayerShareState,
  prayerShareToSaveFields,
} from './PrayerShareSelector';

export type PrayerWriteFormProps = {
  onBack: () => void;
  onSave: (payload: {
    title: string;
    content: string;
    visibility: ReturnType<typeof prayerShareToSaveFields>['visibility'];
    sharedPastorIds: string[];
    sharedOrganizationIds: string[];
  }) => void | Promise<void>;
  saving?: boolean;
};

export function PrayerWriteForm({ onBack, onSave, saving = false }: PrayerWriteFormProps) {
  const { user } = useAuth();
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [share, setShare] = useState(defaultPrayerShareState());

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('기도제목을 입력해 주세요.');
      return;
    }
    if (!content.trim()) {
      toast.error('기도 내용을 입력해 주세요.');
      return;
    }
    if (share.visibility === 'pastor_share' && share.sharedPastorIds.length === 0) {
      toast.error('공유할 담당 교역자를 선택해 주세요.');
      return;
    }
    if (share.visibility === 'organization_share' && share.sharedOrganizationIds.length === 0) {
      toast.error('공유할 교구·부서를 선택해 주세요.');
      return;
    }

    const fields = prayerShareToSaveFields(share);
    await onSave({
      title: title.trim(),
      content: content.trim(),
      ...fields,
    });
  };

  return (
    <ContentEditorLayout
      title="기도작성"
      description="기도제목과 내용, 공개범위를 입력하세요."
      onBack={onBack}
      saveButton={
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !user}
          className="px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-bold disabled:opacity-50 touch-target"
        >
          {saving ? '저장 중…' : '기도 저장'}
        </button>
      }
      footer={
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !user}
          className="w-full btn-primary text-sm font-bold touch-target"
        >
          {saving ? '저장 중…' : '기도 저장'}
        </button>
      }
    >
      <ContentFormCard className="space-y-5">
        <div>
          <label htmlFor="prayer-title" className="block text-sm font-bold text-gray-800 mb-2">
            기도제목
          </label>
          <input
            id="prayer-title"
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="기도제목을 입력하세요."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white focus:border-primary-400 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="prayer-content" className="block text-sm font-bold text-gray-800 mb-2">
            기도 내용
          </label>
          <textarea
            id="prayer-content"
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="기도 내용을 입력하세요."
            rows={6}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm bg-white resize-none focus:border-primary-400 focus:outline-none"
          />
        </div>

        <PrayerShareSelector value={share} onChange={setShare} />
      </ContentFormCard>
    </ContentEditorLayout>
  );
}

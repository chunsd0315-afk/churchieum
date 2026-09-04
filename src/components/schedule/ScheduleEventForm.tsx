import { useState, type FormEvent } from 'react';
import ContentEditorLayout from '../layout/ContentEditorLayout';
import type { ContentScope } from '../../services/permissions';
import type { ScheduleEvent } from '../../services/eventHelpers';
import { EVENT_TYPE_OPTIONS } from '../../services/eventHelpers';
import {
  VisibilitySelector,
  validateContentVisibility,
  type ContentVisibilityValue,
} from '../common/shared-content/VisibilitySelector';
import {
  contentScopeToContentVisibility,
  contentVisibilityToContentScope,
} from '../../services/contentVisibilityScope';

type Props = {
  editing: ScheduleEvent | null;
  initialDate?: string;
  availableScopes: ContentScope[];
  saving?: boolean;
  onSave: (payload: {
    event: Omit<ScheduleEvent, 'id' | 'created_at' | 'is_recurring'>;
    scope: ContentScope & { sharedOrganizationIds?: string[] };
  }) => void;
  onBack: () => void;
};

export function ScheduleEventForm({
  editing,
  initialDate,
  availableScopes: _availableScopes,
  saving = false,
  onSave,
  onBack,
}: Props) {
  void _availableScopes;
  const [title, setTitle] = useState(editing?.title ?? '');
  const [date, setDate] = useState(editing?.event_date ?? initialDate ?? new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(editing?.event_time?.slice(0, 5) ?? '');
  const [location, setLocation] = useState(editing?.location ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [eventType, setEventType] = useState(editing?.event_type ?? 'worship');
  const [visibility, setVisibility] = useState<ContentVisibilityValue>(() =>
    contentScopeToContentVisibility({
      visibility_type: editing?.visibility_type,
      scope_id: editing?.scope_id,
      scope_name: editing?.scope_name,
      sharedOrganizationIds: editing?.sharedOrganizationIds,
    }),
  );

  const visError = validateContentVisibility(visibility);

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    if (!title.trim() || !date) return;
    if (visError) return;
    const scope = contentVisibilityToContentScope(visibility);
    onSave({
      event: {
        title: title.trim(),
        description: description || undefined,
        event_date: date,
        event_time: time || undefined,
        location: location || undefined,
        event_type: eventType,
        end_date: editing?.end_date,
        end_time: editing?.end_time,
        recurrence_pattern: editing?.recurrence_pattern,
        is_recurring: editing?.is_recurring ?? false,
      },
      scope,
    });
  };

  return (
    <ContentEditorLayout
      title={editing ? '일정 수정' : '일정 작성'}
      onBack={onBack}
      saveButton={
        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={saving || !title.trim() || !!visError}
          className="inline-flex items-center gap-1.5 h-12 px-5 bg-primary-500 hover:bg-primary-600 text-[#1A1A1A] rounded-[18px] text-sm font-bold disabled:opacity-50 transition-colors"
        >
          {saving ? '저장 중...' : editing ? '수정' : '등록'}
        </button>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 max-w-[900px] mx-auto">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">제목 *</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            placeholder="일정 제목"
            className="w-full px-3.5 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl min-h-[48px] focus:border-primary-400 focus:outline-none"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">날짜 *</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
              className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl min-h-[48px] focus:border-primary-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">시간</label>
            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl min-h-[48px] focus:border-primary-400 focus:outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">장소</label>
          <input
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="장소"
            className="w-full px-3.5 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl min-h-[48px] focus:border-primary-400 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">설명</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            placeholder="일정 설명"
            className="w-full px-3.5 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:outline-none resize-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">일정 종류</label>
          <select
            value={eventType}
            onChange={e => setEventType(e.target.value)}
            className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl min-h-[48px] focus:border-primary-400 focus:outline-none"
          >
            {EVENT_TYPE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <VisibilitySelector
          preset="broadcast"
          value={visibility}
          onChange={setVisibility}
        />
      </form>
    </ContentEditorLayout>
  );
}

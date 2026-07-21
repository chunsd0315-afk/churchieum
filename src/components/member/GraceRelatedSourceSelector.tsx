import { ChevronRight, BookOpen, Mic } from 'lucide-react';
import type { GraceNote, GraceNoteType } from '../../data/graceNotes';
import type { ReadingEditorCtx, SermonEditorCtx } from './GraceNoteEditor';

const RELATED_MIN_H = 'min-h-[88px]';

type Props = {
  noteType: GraceNoteType;
  existing?: GraceNote | null;
  readingCtx?: ReadingEditorCtx | null;
  readingRef: string;
  onReadingRefChange: (v: string) => void;
  onPickReading?: () => void;
  sermonCtx?: SermonEditorCtx | null;
  linked: boolean;
  editSermonTitle: string;
  editPreacher: string;
  editSermonDate: string;
  editBibleRef: string;
  onEditSermonTitle: (v: string) => void;
  onEditPreacher: (v: string) => void;
  onEditSermonDate: (v: string) => void;
  onEditBibleRef: (v: string) => void;
};

function RelatedCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-2xl border border-gray-200 bg-gray-50/80 px-4 py-3.5 ${RELATED_MIN_H}`}>
      <p className="text-xs font-bold text-gray-500 mb-2">{label}</p>
      {children}
    </div>
  );
}

/** 유형별 관련 기록 선택/표시 — 카드 높이 통일 */
export function GraceRelatedSourceSelector({
  noteType,
  existing,
  readingCtx,
  readingRef,
  onReadingRefChange,
  onPickReading,
  sermonCtx,
  linked,
  editSermonTitle,
  editPreacher,
  editSermonDate,
  editBibleRef,
  onEditSermonTitle,
  onEditPreacher,
  onEditSermonDate,
  onEditBibleRef,
}: Props) {
  if (noteType === 'reading') {
    const planName = readingCtx?.planName ?? existing?.planName;
    const day = readingCtx?.day ?? existing?.day;
    const hasReading = Boolean(planName || readingRef.trim() || existing?.sourceId);

    return (
      <RelatedCard label="관련 성경통독">
        {hasReading ? (
          <button
            type="button"
            onClick={onPickReading}
            className="w-full flex items-center justify-between gap-2 text-left touch-target group"
          >
            <div className="min-w-0">
              {planName && (
                <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-emerald-600 shrink-0" />
                  {planName}{day ? ` · ${day}일차` : ''}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1 truncate">
                {readingRef.trim() || '성경 본문을 입력해 주세요'}
              </p>
            </div>
            {onPickReading && <ChevronRight className="w-4 h-4 text-gray-400 shrink-0 group-hover:text-primary-500" />}
          </button>
        ) : (
          <button
            type="button"
            onClick={onPickReading}
            className="w-full flex items-center justify-between gap-2 text-sm text-gray-500 touch-target"
          >
            <span>성경통독 기록을 선택해 주세요</span>
            <ChevronRight className="w-4 h-4 shrink-0" />
          </button>
        )}
        {hasReading && (
          <input
            type="text"
            value={readingRef}
            onChange={e => onReadingRefChange(e.target.value)}
            placeholder="예: 요한복음 15장"
            className="mt-2 w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400"
          />
        )}
      </RelatedCard>
    );
  }

  if (noteType === 'sermon') {
    const title = linked ? sermonCtx?.sermonTitle : editSermonTitle;
    const preacher = linked ? sermonCtx?.sermonPreacher : editPreacher;
    const ref = linked ? sermonCtx?.bibleReference : editBibleRef;
    const date = linked ? sermonCtx?.sermonDate : editSermonDate;
    const hasSermon = Boolean(title?.trim() || ref?.trim() || existing?.sourceId);

    return (
      <RelatedCard label="관련 설교">
        {linked && sermonCtx?.thumbnailUrl && (
          <img src={sermonCtx.thumbnailUrl} alt="" className="w-full h-28 object-cover rounded-xl mb-2" />
        )}
        {linked ? (
          hasSermon ? (
            <div>
              <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                <Mic className="w-4 h-4 text-blue-600 shrink-0" />
                {title}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {[ref, preacher, date?.replace(/-/g, '.')].filter(Boolean).join(' · ')}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">설교를 선택해 주세요</p>
          )
        ) : (
          <div className="space-y-2">
            <input
              type="text"
              value={editSermonTitle}
              onChange={e => onEditSermonTitle(e.target.value)}
              placeholder="설교 제목"
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={editPreacher}
                onChange={e => onEditPreacher(e.target.value)}
                placeholder="설교자"
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400"
              />
              <input
                type="date"
                value={editSermonDate}
                onChange={e => onEditSermonDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400"
              />
            </div>
            <input
              type="text"
              value={editBibleRef}
              onChange={e => onEditBibleRef(e.target.value)}
              placeholder="예: 요한복음 15:1-11"
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary-400"
            />
          </div>
        )}
      </RelatedCard>
    );
  }

  return null;
}

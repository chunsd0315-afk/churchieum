/**
 * 진행 중인 성경통독 선택 (복수 통독 지원)
 */

import { BookOpen } from 'lucide-react';
import type { ReadingProgress } from '../../data/readingPlans';
import { getProgressPercent, getPlanColor } from '../../data/readingPlans';
import ContentEditorLayout, { ContentFormCard } from '../layout/ContentEditorLayout';
import { GRACE_FORM_HEADERS } from './GraceNotesView';

type Props = {
  progresses: ReadingProgress[];
  onSelect: (progress: ReadingProgress) => void;
  onBack: () => void;
};

export function ReadingProgressPicker({ progresses, onSelect, onBack }: Props) {
  return (
    <ContentEditorLayout
      title={GRACE_FORM_HEADERS.reading.title}
      description="진행 중인 통독을 선택하세요"
      onBack={onBack}
      mobileHeaderVariant="subpage"
    >
      <ContentFormCard className="space-y-3">
        {progresses.map(prog => {
          const pct = getProgressPercent(prog);
          const planColor = getPlanColor(prog.planId);
          return (
            <button
              key={prog.id}
              onClick={() => onSelect(prog)}
              className="w-full text-left bg-gray-50 rounded-2xl border border-gray-100 p-5 hover:bg-primary-50/40 hover:border-primary-200 transition-colors touch-target"
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${planColor} flex items-center justify-center shrink-0`}>
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-base">{prog.planName}</p>
                  <p className="text-sm text-gray-500 mt-0.5">진행률 {pct}% · {prog.currentDay}일차</p>
                  <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </ContentFormCard>
    </ContentEditorLayout>
  );
}

export function buildReadingFormCtx(prog: ReadingProgress, editId?: string) {
  return {
    progressId: prog.id,
    planId: prog.planId,
    planName: prog.planName,
    planColor: getPlanColor(prog.planId),
    day: prog.currentDay,
    readingReferences: '',
    editId,
  };
}

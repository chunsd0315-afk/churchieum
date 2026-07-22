/**
 * 진행 중인 성경통독 선택 (복수 통독 지원)
 */

import { BookOpen } from 'lucide-react';
import type { ReadingProgress } from '../../data/readingPlans';
import { getProgressPercent, getPlanColor } from '../../data/readingPlans';
import ContentEditorLayout, { ContentFormCard } from '../layout/ContentEditorLayout';

type ListProps = {
  progresses?: ReadingProgress[];
  onSelect: (progress: ReadingProgress) => void;
};

/** 작성 화면 본문에 임베드하는 진행 중 통독 목록 */
export function ReadingProgressList({ progresses, onSelect }: ListProps) {
  const list = Array.isArray(progresses) ? progresses : [];

  if (list.length === 0) {
    return (
      <div className="py-12 text-center">
        <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
        <p className="font-semibold text-gray-600 text-sm">연결할 성경통독 기록이 없습니다.</p>
        <p className="text-xs text-gray-400 mt-1 leading-relaxed">
          성경통독센터에서 플랜에 참여하면 이곳에서 선택할 수 있습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {list.map(prog => {
        const pct = getProgressPercent(prog);
        const planColor = getPlanColor(prog.planId);
        return (
          <button
            key={prog.id}
            type="button"
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
    </div>
  );
}

type Props = {
  progresses?: ReadingProgress[];
  onSelect: (progress: ReadingProgress) => void;
  onBack: () => void;
};

export function ReadingProgressPicker({ progresses, onSelect, onBack }: Props) {
  return (
    <ContentEditorLayout
      title="은혜와 기도 작성"
      description="진행 중인 통독을 선택하세요"
      onBack={onBack}
      mobileHeaderVariant="subpage"
    >
      <ContentFormCard>
        <ReadingProgressList progresses={progresses} onSelect={onSelect} />
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

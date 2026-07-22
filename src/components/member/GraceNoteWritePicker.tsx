/**
 * 은혜와 기도 — 유형 선택 첫 화면
 */

import { BookOpen, Mic, HandHeart } from 'lucide-react';
import ContentEditorLayout, { ContentFormCard } from '../layout/ContentEditorLayout';

const TYPE_CARDS = [
  {
    id: 'reading' as const,
    label: '성경통독',
    description: '말씀을 통해 받은 은혜를 기록합니다.',
    icon: BookOpen,
    iconClass: 'text-emerald-600 bg-emerald-50',
  },
  {
    id: 'sermon' as const,
    label: '설교',
    description: '설교를 통해 받은 은혜를 기록합니다.',
    icon: Mic,
    iconClass: 'text-blue-600 bg-blue-50',
  },
  {
    id: 'prayer' as const,
    label: '기도',
    description: '기도 제목과 내용을 기록합니다.',
    icon: HandHeart,
    iconClass: 'text-violet-600 bg-violet-50',
  },
];

type Props = {
  onBack: () => void;
  onSelectReading: () => void;
  onSelectSermon: () => void;
  onSelectPrayer: () => void;
};

export function GraceNoteWritePicker({
  onBack,
  onSelectReading,
  onSelectSermon,
  onSelectPrayer,
}: Props) {
  const handlers = {
    reading: onSelectReading,
    sermon: onSelectSermon,
    prayer: onSelectPrayer,
  };

  return (
    <ContentEditorLayout
      title="은혜와 기도"
      description="하나님의 은혜와 기도를 기록하고 함께 나눕니다."
      onBack={onBack}
      mobileHeaderVariant="subpage"
    >
      <ContentFormCard className="space-y-3">
        {TYPE_CARDS.map(card => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              type="button"
              onClick={handlers[card.id]}
              className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-100 bg-white hover:border-primary-200 hover:bg-primary-50/30 transition-colors touch-target text-left"
            >
              <span className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${card.iconClass}`}>
                <Icon className="w-6 h-6" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-base font-bold text-gray-900">{card.label}</span>
                <span className="block text-xs text-gray-500 mt-0.5">{card.description}</span>
              </span>
            </button>
          );
        })}
      </ContentFormCard>
    </ContentEditorLayout>
  );
}

import type { ReactNode } from 'react';
import { MobileFullScreenPage } from '../../layout/ContentEditorLayout';

export type SharedContentDetailSettingsPageProps = {
  onBack: () => void;
  onReset: () => void;
  onApply: () => void;
  children: ReactNode;
  description?: string;
};

export function SharedContentDetailSettingsPage({
  onBack,
  onReset,
  onApply,
  children,
  description = '조건에 맞는 기록을 찾아보세요.',
}: SharedContentDetailSettingsPageProps) {
  return (
    <MobileFullScreenPage
      title="상세설정"
      description={description}
      onBack={onBack}
      saveButton={
        <button
          type="button"
          onClick={onReset}
          className="text-sm font-semibold text-gray-600 px-2 py-2 touch-target shrink-0"
        >
          상세설정 초기화
        </button>
      }
      footer={
        <button
          type="button"
          onClick={onApply}
          className="w-full btn-primary text-sm font-bold touch-target"
        >
          상세설정 적용
        </button>
      }
    >
      <div className="space-y-5">{children}</div>
    </MobileFullScreenPage>
  );
}

import { useState, type ReactNode } from 'react';
import { DetailSettingsButton } from '../common/ui/DetailSettingsButton';

export type ContentEditorDetailSettingsProps = {
  children: ReactNode;
  /** 닫힌 상태에서 버튼 배지에 표시할 활성 설정 개수 */
  activeCount?: number;
  /** 수정 화면 등 — 비기본 설정이 있으면 처음부터 펼침 */
  defaultOpen?: boolean;
  className?: string;
};

/**
 * 작성/수정 화면 — 공개범위·댓글 등 상세설정 접기/펼치기
 */
export function ContentEditorDetailSettings({
  children,
  activeCount = 0,
  defaultOpen = false,
  className = '',
}: ContentEditorDetailSettingsProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={className}>
      <DetailSettingsButton
        onClick={() => setOpen(prev => !prev)}
        active={open}
        activeCount={open ? 0 : activeCount}
        aria-expanded={open}
      />
      {open && <div className="mt-4 space-y-5">{children}</div>}
    </div>
  );
}

import type { GraceNote } from '../../data/graceNotes';
import { formatGraceNoteAuthorLine } from '../../services/graceNoteAuthorDisplay';
import {
  getGraceNoteListTitle,
  graceRecordTypeLabel,
  graceShareBadgeClass,
  graceTypeBadgeClass,
  GRACE_BADGE_BASE,
} from '../../services/graceNoteDisplay';
import { ChurchDropdownMenu } from '../common/ui/ChurchDropdownMenu';

export type GraceNoteListRowMenuItem = {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
};

type Props = {
  note: GraceNote;
  shareBadge?: string | null;
  menuItems?: GraceNoteListRowMenuItem[];
  onClick: () => void;
  compact?: boolean;
};

/**
 * 은혜와 기도 목록 공통 행
 * 배지 → 제목 → 내용 미리보기 → 작성자·작성일 → (우측) 더보기
 */
export function GraceNoteListRow({
  note,
  shareBadge,
  menuItems,
  onClick,
  compact = false,
}: Props) {
  const title = getGraceNoteListTitle(note);
  const authorLine = formatGraceNoteAuthorLine(note);
  const contentPreview = note.graceContent?.trim() ?? '';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="church-list-row cursor-pointer min-h-[132px]"
    >
      <div className="flex gap-3 items-start">
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex flex-wrap items-center gap-1.5 mb-2">
            <span className={`${GRACE_BADGE_BASE} ${graceTypeBadgeClass(note.type)}`}>
              {graceRecordTypeLabel(note.type)}
            </span>
            {shareBadge && (
              <span className={`${GRACE_BADGE_BASE} ${graceShareBadgeClass(shareBadge)}`}>
                {shareBadge}
              </span>
            )}
          </div>

          <p className="text-[15px] font-bold text-gray-900 line-clamp-2 mb-1.5 leading-snug">
            {title}
          </p>

          {!compact && (
            <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 min-h-[2.5rem] mb-2">
              {contentPreview || '\u00A0'}
            </p>
          )}

          <p className="text-[13px] font-medium text-gray-500 truncate mt-auto">
            {authorLine}
          </p>
        </div>

        {menuItems && menuItems.length > 0 && (
          <div
            className="flex items-center shrink-0 self-center"
            onClick={e => e.stopPropagation()}
            onKeyDown={e => e.stopPropagation()}
          >
            <ChurchDropdownMenu
              items={menuItems}
              layer="belowPlayer"
              ariaLabel="기록 더보기"
            />
          </div>
        )}
      </div>
    </div>
  );
}

/** 공통 목록 컴포넌트 별칭 */
export { GraceNoteListRow as GraceRecordListItem };

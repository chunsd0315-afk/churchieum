import { Star } from 'lucide-react';
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
 * 은혜기록 목록 공통 행
 * 배지 → 제목 → 내용 미리보기 → 작성자·작성일 → (우측) 즐겨찾기·더보기
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

        <div
          className="flex flex-col items-center gap-1 shrink-0 pt-0.5"
          onClick={e => e.stopPropagation()}
          onKeyDown={e => e.stopPropagation()}
        >
          <span
            className={`touch-target flex items-center justify-center w-10 h-10 ${
              note.isFavorite ? 'text-amber-500' : 'text-gray-300'
            }`}
            aria-label={note.isFavorite ? '즐겨찾기 선택됨' : '즐겨찾기'}
          >
            <Star
              className={`w-5 h-5 ${note.isFavorite ? 'fill-amber-400 text-amber-500' : ''}`}
            />
          </span>
          {menuItems && menuItems.length > 0 && (
            <ChurchDropdownMenu items={menuItems} layer="belowPlayer" />
          )}
        </div>
      </div>
    </div>
  );
}

/** 공통 목록 컴포넌트 별칭 */
export { GraceNoteListRow as GraceRecordListItem };

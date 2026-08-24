import type { GraceNote } from '../../data/graceNotes';
import {
  formatGraceNoteAuthorLine,
  resolveGraceNoteAuthorDisplay,
} from '../../services/graceNoteAuthorDisplay';
import { formatGraceNoteListDate } from '../../services/graceNoteAuthorDisplay';
import {
  getGraceNoteListTitle,
  graceRecordTypeLabel,
  graceShareBadgeClass,
  graceTypeBadgeClass,
  GRACE_BADGE_BASE,
} from '../../services/graceNoteDisplay';
import { ChurchDropdownMenu } from '../common/ui/ChurchDropdownMenu';
import type { GraceNoteListRowMenuItem } from './GraceNoteListRow';

type Props = {
  note: GraceNote;
  shareBadge?: string | null;
  menuItems?: GraceNoteListRowMenuItem[];
  onClick: () => void;
};

/**
 * 은혜와 기도 카드보기 — 공지사항 카드와 동일한 Soft-3D 카드 레이아웃
 */
export function GraceNoteGridCard({
  note,
  shareBadge,
  menuItems,
  onClick,
}: Props) {
  const title = getGraceNoteListTitle(note);
  const contentPreview = note.graceContent?.trim() ?? '';
  const author = resolveGraceNoteAuthorDisplay(note);
  const date = formatGraceNoteListDate(note.createdAt);

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
      className="w-full text-left border border-gray-200 rounded-[20px] flex flex-col
        bg-white transition-all hover:shadow-lg hover:-translate-y-0.5 overflow-hidden cursor-pointer"
      style={{ boxShadow: '0 8px 24px rgba(15,23,42,.04)' }}
    >
      <div className="flex-1 p-4 flex flex-col min-h-[180px]">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex flex-wrap gap-1.5 min-w-0">
            <span className={`${GRACE_BADGE_BASE} ${graceTypeBadgeClass(note.type)}`}>
              {graceRecordTypeLabel(note.type)}
            </span>
            {shareBadge && (
              <span className={`${GRACE_BADGE_BASE} ${graceShareBadgeClass(shareBadge)}`}>
                {shareBadge}
              </span>
            )}
          </div>
          {menuItems && menuItems.length > 0 && (
            <div
              className="shrink-0"
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

        <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 mb-1.5">
          {title}
        </h3>
        {contentPreview && (
          <p className="text-xs text-gray-500 line-clamp-3 mb-3 leading-snug flex-1">
            {contentPreview}
          </p>
        )}
        <div className="mt-auto pt-2 text-[11px] text-gray-400 space-y-0.5">
          <p className="font-medium text-gray-500 truncate">{author.label}</p>
          {date && <p>{date}</p>}
        </div>
      </div>
    </div>
  );
}

/** 미사용 방지 — 목록과 동일한 author line 포맷이 필요할 때 */
export function graceNoteCardAuthorLine(note: GraceNote): string {
  return formatGraceNoteAuthorLine(note);
}

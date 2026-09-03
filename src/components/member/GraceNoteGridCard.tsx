/**
 * 은혜와 기도 카드보기 — 기록·말씀·기도 내용 중심 (가짜 썸네일 없음)
 */

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
import { CONTENT_CARD_CLASS } from '../common/ui/ContentListToolbar';
import { ChurchDropdownMenu } from '../common/ui/ChurchDropdownMenu';
import type { GraceNoteListRowMenuItem } from './GraceNoteListRow';

type Props = {
  note: GraceNote;
  shareBadge?: string | null;
  menuItems?: GraceNoteListRowMenuItem[];
  onClick: () => void;
};

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
    <article className={CONTENT_CARD_CLASS}>
      <div className="p-4 sm:p-5 flex flex-col min-h-[180px]">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex flex-wrap gap-1.5 min-w-0">
            <span className={`${GRACE_BADGE_BASE} ${graceTypeBadgeClass(note.type)}`}>
              {graceRecordTypeLabel(note.type)}
            </span>
            {shareBadge ? (
              <span className={`${GRACE_BADGE_BASE} ${graceShareBadgeClass(shareBadge)}`}>
                {shareBadge}
              </span>
            ) : null}
          </div>
          {menuItems && menuItems.length > 0 ? (
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
          ) : null}
        </div>

        <button type="button" onClick={onClick} className="w-full text-left flex-1 flex flex-col touch-target">
          <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-primary-800 transition-colors">
            {title}
          </h3>
          {contentPreview ? (
            <p className="text-xs text-gray-500 line-clamp-3 mt-2 leading-relaxed flex-1">
              {contentPreview}
            </p>
          ) : (
            <div className="flex-1" />
          )}
          <div className="mt-4 pt-1 text-xs space-y-0.5">
            <p className="font-medium text-gray-500 truncate">{author.label}</p>
            {date ? <p className="text-gray-400">{date}</p> : null}
          </div>
        </button>
      </div>
    </article>
  );
}

export function graceNoteCardAuthorLine(note: GraceNote): string {
  return formatGraceNoteAuthorLine(note);
}

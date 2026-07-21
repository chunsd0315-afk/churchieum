import { Star } from 'lucide-react';
import type { GraceNote } from '../../data/graceNotes';
import {
  formatGraceNoteListDate,
  resolveGraceNoteAuthorDisplay,
} from '../../services/graceNoteAuthorDisplay';
import {
  getGraceNoteListTitle,
  getGraceNoteRelatedLine,
  graceRecordTypeLabel,
  graceShareBadgeClass,
  graceTypeBadgeClass,
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

/** 은혜기록 목록 공통 행 — 배지 → 제목 → 내용 → 작성자 → 관련정보 */
export function GraceNoteListRow({
  note,
  shareBadge,
  menuItems,
  onClick,
  compact = false,
}: Props) {
  const title = getGraceNoteListTitle(note);
  const author = resolveGraceNoteAuthorDisplay(note);
  const dateText = formatGraceNoteListDate(note.createdAt);
  const relatedLine = getGraceNoteRelatedLine(note);

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
      className="church-list-row cursor-pointer flex flex-col min-h-[168px]"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0 flex-1">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${graceTypeBadgeClass(note.type)}`}>
            {graceRecordTypeLabel(note.type)}
          </span>
          {shareBadge && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${graceShareBadgeClass(shareBadge)}`}>
              {shareBadge}
            </span>
          )}
          {note.isFavorite && (
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0" aria-label="즐겨찾기" />
          )}
        </div>
        {menuItems && menuItems.length > 0 && (
          <ChurchDropdownMenu items={menuItems} />
        )}
      </div>

      <p className="text-[15px] font-bold text-gray-900 line-clamp-2 mb-2">{title}</p>

      {!compact && (
        <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 mb-2 flex-1">
          {note.graceContent}
        </p>
      )}

      <p
        className="text-[13px] font-medium truncate mb-1"
        style={{ color: '#6B7280' }}
      >
        {author.label}
        <span className="text-gray-300 mx-1.5">·</span>
        {dateText}
      </p>

      <p className="text-[12px] text-gray-500 line-clamp-1">{relatedLine}</p>
    </div>
  );
}

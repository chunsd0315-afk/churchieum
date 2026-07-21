import { User } from 'lucide-react';
import type { GraceNote, GraceNoteType } from '../../data/graceNotes';
import {
  formatGraceNoteListDate,
  resolveGraceNoteAuthorDisplay,
} from '../../services/graceNoteAuthorDisplay';
import { ChurchDropdownMenu } from '../common/ui/ChurchDropdownMenu';

function graceRecordTypeLabel(type: GraceNoteType): string {
  return type === 'reading' ? '성경통독' : type === 'sermon' ? '설교' : '자유';
}

function formatTypeLine(note: GraceNote): string {
  const type = graceRecordTypeLabel(note.type);
  if (note.type === 'sermon') {
    const ref = note.bibleReference ?? (note.graceTitle ? null : note.sermonTitle);
    return ref ? `${type} · ${ref}` : type;
  }
  if (note.type === 'reading') {
    const ref = note.bibleReference ?? note.planName;
    return ref ? `${type} · ${ref}` : type;
  }
  if (note.bibleReference) return `${type} · ${note.bibleReference}`;
  return type;
}

function typeBadgeClass(type: GraceNoteType): string {
  return type === 'reading'
    ? 'bg-green-50 text-green-700'
    : type === 'sermon'
      ? 'bg-blue-50 text-blue-700'
      : 'bg-amber-50 text-amber-700';
}

function shareBadgeClass(label: string): string {
  if (label.includes('나만')) return 'bg-gray-100 text-gray-600';
  if (label.includes('전체 공개')) return 'bg-violet-50 text-violet-700';
  if (label.includes('교역자')) return 'bg-blue-50 text-blue-700';
  return 'bg-emerald-50 text-emerald-700';
}

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

/** 은혜기록 목록 공통 행 — 제목 → 작성자·날짜 → 유형·말씀 → 공개 태그 */
export function GraceNoteListRow({
  note,
  shareBadge,
  menuItems,
  onClick,
  compact = false,
}: Props) {
  const title =
    note.graceTitle
    || (note.type === 'sermon' ? note.sermonTitle : null)
    || (note.type === 'reading' ? note.bibleReference : null)
    || note.graceContent.slice(0, 28);

  const author = resolveGraceNoteAuthorDisplay(note);
  const dateText = formatGraceNoteListDate(note.createdAt);
  const typeLine = formatTypeLine(note);

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
      className="church-list-row cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p className="text-[15px] font-bold text-gray-900 line-clamp-2 flex-1 min-w-0">{title}</p>
        {menuItems && menuItems.length > 0 && (
          <ChurchDropdownMenu items={menuItems} />
        )}
      </div>

      <div className="flex items-center gap-1.5 mb-1 min-w-0">
        <User className="w-3.5 h-3.5 text-gray-400 shrink-0" aria-hidden />
        <span
          className="text-[13px] font-medium truncate"
          style={{ color: '#6B7280' }}
        >
          {author.label}
          <span className="text-gray-300 mx-1.5">·</span>
          {dateText}
        </span>
      </div>

      <p className="text-[12px] text-gray-500 line-clamp-1 mb-2">{typeLine}</p>

      {!compact && (
        <p className="text-sm text-gray-600 leading-relaxed line-clamp-2 mb-2">{note.graceContent}</p>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${typeBadgeClass(note.type)}`}>
          {graceRecordTypeLabel(note.type)}
        </span>
        {shareBadge && (
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${shareBadgeClass(shareBadge)}`}>
            {shareBadge}
          </span>
        )}
      </div>
    </div>
  );
}

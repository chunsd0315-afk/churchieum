import { BookOpen, ChevronRight } from 'lucide-react';
import type { GraceNote } from '../../data/graceNotes';
import {
  PENDING_SERMON_OPEN_KEY,
  resolveGraceRelatedReading,
  resolveGraceRelatedSermon,
} from '../../services/graceNoteRelatedDisplay';

type Props = {
  note: GraceNote;
  /** 연결된 설교로 이동 (설교 메뉴) */
  onOpenSermon?: (sermonId: string) => void;
};

function RelatedCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-gray-50/80 px-4 py-3.5">
      <h3 className="text-xs font-bold text-gray-500 mb-2">{label}</h3>
      {children}
    </section>
  );
}

/** 상세 화면 — 관련 성경통독·설교 (작성 화면과 동일 레이블, 읽기 전용) */
export function GraceRelatedSourceDetail({ note, onOpenSermon }: Props) {
  if (note.type === 'reading') {
    const related = resolveGraceRelatedReading(note);
    if (!related) {
      return (
        <RelatedCard label="관련 성경통독">
          <p className="text-sm text-gray-500">연결된 성경통독이 없습니다.</p>
        </RelatedCard>
      );
    }
    return (
      <RelatedCard label="관련 성경통독">
        <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-emerald-600 shrink-0" />
          {related.planName}
          {related.day ? ` · ${related.day}일차` : ''}
        </p>
        <p className="text-xs text-gray-600 mt-2 font-medium">{related.reference}</p>
        <p className="text-sm text-gray-700 mt-3 leading-relaxed whitespace-pre-wrap">
          {related.readingContent}
        </p>
      </RelatedCard>
    );
  }

  if (note.type === 'sermon') {
    const related = resolveGraceRelatedSermon(note);
    if (!related || related.notFound) {
      return (
        <RelatedCard label="관련 설교">
          <p className="text-sm text-gray-500">연결된 설교를 찾을 수 없습니다.</p>
        </RelatedCard>
      );
    }

    const metaLine = [related.preacher, related.scripture].filter(Boolean).join(' · ');
    const dateWorship = [related.dateLabel, related.worshipLabel].filter(Boolean).join(' · ');
    const canOpen = Boolean(related.sermonId && onOpenSermon);

    const body = (
      <>
        <p className="text-[15px] font-bold text-gray-900 leading-snug line-clamp-2">
          {related.title}
        </p>
        {metaLine ? (
          <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{metaLine}</p>
        ) : null}
        {dateWorship ? (
          <p className="text-xs text-gray-500 mt-2 font-medium">{dateWorship}</p>
        ) : null}
      </>
    );

    if (canOpen && related.sermonId) {
      return (
        <section>
          <h3 className="text-xs font-bold text-gray-500 mb-2">관련 설교</h3>
          <button
            type="button"
            onClick={() => {
              try {
                sessionStorage.setItem(PENDING_SERMON_OPEN_KEY, related.sermonId!);
              } catch { /* ignore */ }
              onOpenSermon?.(related.sermonId!);
            }}
            className="w-full text-left rounded-2xl border border-primary-100 bg-primary-50/40 hover:bg-primary-50 hover:border-primary-200 px-4 py-3.5 transition-colors touch-target min-h-[48px] flex items-start gap-2"
            aria-label={`${related.title} 설교로 이동`}
          >
            <div className="flex-1 min-w-0">{body}</div>
            <ChevronRight className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" aria-hidden />
          </button>
        </section>
      );
    }

    return (
      <RelatedCard label="관련 설교">
        {body}
      </RelatedCard>
    );
  }

  return null;
}

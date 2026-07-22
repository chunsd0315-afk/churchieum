import { BookOpen } from 'lucide-react';
import type { GraceNote } from '../../data/graceNotes';
import {
  resolveGraceRelatedReading,
  resolveGraceRelatedSermon,
} from '../../services/graceNoteRelatedDisplay';

type Props = {
  note: GraceNote;
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

/** 상세 화면 — 관련 성경통독·설교 (읽기 전용 정보 카드, 클릭·이동 없음) */
export function GraceRelatedSourceDetail({ note }: Props) {
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
          <p className="text-sm text-gray-500">연결된 설교 정보를 찾을 수 없습니다.</p>
        </RelatedCard>
      );
    }

    const metaLine = [related.preacher, related.scripture].filter(Boolean).join(' · ');
    const dateWorship = [related.dateLabel, related.worshipLabel].filter(Boolean).join(' · ');

    return (
      <RelatedCard label="관련 설교">
        <p className="text-[15px] font-bold text-gray-900 leading-snug line-clamp-2">
          {related.title}
        </p>
        {metaLine ? (
          <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{metaLine}</p>
        ) : null}
        {dateWorship ? (
          <p className="text-xs text-gray-500 mt-2 font-medium">{dateWorship}</p>
        ) : null}
      </RelatedCard>
    );
  }

  return null;
}

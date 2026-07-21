import { BookOpen, Mic } from 'lucide-react';
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

/** 상세 화면 — 관련 성경통독·설교 (작성 화면과 동일 레이블, 읽기 전용) */
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
    if (!related) {
      return (
        <RelatedCard label="관련 설교">
          <p className="text-sm text-gray-500">연결된 설교가 없습니다.</p>
        </RelatedCard>
      );
    }
    return (
      <RelatedCard label="관련 설교">
        {related.thumbnailUrl && (
          <img
            src={related.thumbnailUrl}
            alt=""
            className="w-full h-28 object-cover rounded-xl mb-2"
          />
        )}
        <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
          <Mic className="w-4 h-4 text-blue-600 shrink-0" />
          {related.title}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {[related.scripture, related.preacher].filter(Boolean).join(' · ')}
        </p>
        {related.summary && (
          <p className="text-sm text-gray-700 mt-3 leading-relaxed">{related.summary}</p>
        )}
      </RelatedCard>
    );
  }

  return null;
}

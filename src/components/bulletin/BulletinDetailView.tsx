/**
 * 주보 상세 — 공지사항과 동일한 전체 페이지 UX
 */

import { Calendar, Download, ExternalLink, Eye, FileText, Trash2, Edit3 } from 'lucide-react';
import { MobileFullScreenPage } from '../layout/ContentEditorLayout';
import { useBreakpoint } from '../../hooks/useBreakpoint';

export type BulletinItem = {
  id: string;
  title: string;
  description?: string;
  bulletin_date: string;
  pdf_url?: string;
  image_url?: string;
  view_count: number;
  is_archived?: boolean;
};

type Props = {
  bulletin: BulletinItem;
  canManage: boolean;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

function formatDate(d: string): string {
  if (!d) return '';
  const [y, m, day] = d.slice(0, 10).split('-');
  if (!y || !m || !day) return d;
  return `${y}.${m}.${day}`;
}

export function BulletinDetailView({
  bulletin,
  canManage,
  onBack,
  onEdit,
  onDelete,
}: Props) {
  const { isMobile } = useBreakpoint();

  const actions = canManage ? (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={onEdit}
        className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 touch-target"
      >
        <Edit3 className="w-4 h-4" />
        {!isMobile && '수정'}
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 touch-target"
      >
        <Trash2 className="w-4 h-4" />
        {!isMobile && '삭제'}
      </button>
    </div>
  ) : undefined;

  return (
    <MobileFullScreenPage
      title={bulletin.title}
      description={`${formatDate(bulletin.bulletin_date)} · 조회 ${bulletin.view_count ?? 0}회`}
      onBack={onBack}
      saveButton={actions}
    >
      <div className="space-y-5 max-w-[900px] mx-auto pb-8">
        <div className="bg-white rounded-[24px] overflow-hidden border border-gray-100 shadow-sm">
          <div className="aspect-[3/4] sm:aspect-[4/3] bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center overflow-hidden">
            {bulletin.image_url ? (
              <img
                src={bulletin.image_url}
                alt={bulletin.title}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-center p-8">
                <div className="w-20 h-20 bg-primary-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-10 h-10 text-primary-500" />
                </div>
                <p className="font-bold text-gray-900">{bulletin.title}</p>
                <p className="text-sm text-gray-500 mt-1">{formatDate(bulletin.bulletin_date)}</p>
              </div>
            )}
          </div>

          <div className="p-5 space-y-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{bulletin.title}</h2>
              {bulletin.description && (
                <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{bulletin.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDate(bulletin.bulletin_date)}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  {bulletin.view_count ?? 0}회 조회
                </span>
              </div>
            </div>

            {bulletin.pdf_url ? (
              <div className="space-y-2">
                <a
                  href={bulletin.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3.5 min-h-[48px] bg-primary-500 text-[#1A1A1A] rounded-[18px] font-bold hover:bg-primary-600 transition-colors touch-target"
                >
                  <Download className="w-4 h-4" />
                  PDF 다운로드
                </a>
                <a
                  href={bulletin.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 w-full px-4 py-3 bg-red-50 border border-red-100 rounded-[16px] text-sm text-red-700 hover:bg-red-100 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  <span className="flex-1 font-medium">PDF 새 탭에서 열기</span>
                  <ExternalLink className="w-4 h-4 opacity-60" />
                </a>
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-3">등록된 PDF가 없습니다.</p>
            )}
          </div>
        </div>
      </div>
    </MobileFullScreenPage>
  );
}

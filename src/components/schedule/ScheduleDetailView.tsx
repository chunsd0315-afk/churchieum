import { Calendar, Clock, MapPin, Trash2, Edit3 } from 'lucide-react';
import { MobileFullScreenPage } from '../layout/ContentEditorLayout';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import type { ScheduleEvent } from '../../services/eventHelpers';
import {
  eventScopeBadge,
  eventTypeLabel,
  formatEventDateLong,
  formatEventTime,
} from '../../services/eventHelpers';

type Props = {
  event: ScheduleEvent;
  canManage: boolean;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function ScheduleDetailView({
  event,
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
      title={event.title}
      description={formatEventDateLong(event.event_date)}
      onBack={onBack}
      saveButton={actions}
    >
      <div className="max-w-[900px] mx-auto space-y-5 pb-8">
        <div className="flex flex-wrap gap-2">
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-primary-50 text-primary-800 border border-primary-200">
            [{eventTypeLabel(event.event_type)}]
          </span>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-gray-50 text-gray-700 border border-gray-200">
            [{eventScopeBadge(event)}]
          </span>
        </div>

        <div className="bg-white rounded-[24px] border border-gray-100 p-5 space-y-3 shadow-sm">
          {event.event_time && (
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <Clock className="w-4 h-4 text-gray-400 shrink-0" />
              <span>{formatEventTime(event.event_time)}</span>
            </div>
          )}
          <div className="flex items-center gap-3 text-sm text-gray-700">
            <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
            <span>{formatEventDateLong(event.event_date)}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
              <span>{event.location}</span>
            </div>
          )}
        </div>

        {event.description && (
          <div className="bg-white rounded-[24px] border border-gray-100 p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-700 mb-2">내용</h3>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {event.description}
            </p>
          </div>
        )}
      </div>
    </MobileFullScreenPage>
  );
}

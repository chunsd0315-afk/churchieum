import { Clock, MapPin, Plus } from 'lucide-react';
import { Soft3DIcon } from '../common/icons/Soft3DIcons';
import type { ScheduleEvent } from '../../services/eventHelpers';
import {
  eventScopeBadge,
  eventTypeLabel,
  formatEventDateLong,
  formatEventTime,
} from '../../services/eventHelpers';

type Props = {
  dateKey: string;
  events: ScheduleEvent[];
  canWrite: boolean;
  onSelectEvent: (event: ScheduleEvent) => void;
  onAdd?: () => void;
  className?: string;
};

export function ScheduleDayPanel({
  dateKey,
  events,
  canWrite,
  onSelectEvent,
  onAdd,
  className = '',
}: Props) {
  const sorted = [...events].sort((a, b) =>
    (a.event_time ?? '').localeCompare(b.event_time ?? ''),
  );

  return (
    <div
      className={`bg-white rounded-[24px] border border-[#ECECEC] p-4 md:p-5 flex flex-col ${className}`}
      style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}
    >
      <div className="mb-4">
        <h3 className="text-base font-bold text-gray-900">{formatEventDateLong(dateKey)}</h3>
        <p className="text-sm text-gray-500 mt-0.5">일정 {sorted.length}개</p>
      </div>

      {sorted.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
          <Soft3DIcon iconKey="schedule" size={56} className="mb-4 opacity-90" />
          <p className="text-sm text-gray-500">등록된 일정이 없습니다.</p>
          {canWrite && onAdd && (
            <button
              type="button"
              onClick={onAdd}
              className="mt-4 inline-flex items-center gap-1.5 h-11 px-4 rounded-[18px] bg-primary-500 text-[#1A1A1A] text-sm font-bold hover:bg-primary-600 transition-colors touch-target"
            >
              <Plus className="w-4 h-4" />
              일정 추가
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3 flex-1 overflow-y-auto overscroll-contain max-h-[60vh] lg:max-h-[calc(100vh-280px)]">
          {sorted.map((ev, idx) => (
            <div key={ev.id}>
              {idx > 0 && <div className="border-t border-gray-100 mb-3" />}
              <button
                type="button"
                onClick={() => onSelectEvent(ev)}
                className="w-full text-left rounded-[16px] p-3 hover:bg-primary-50/60 border border-transparent hover:border-primary-100 transition-colors touch-target"
              >
                {ev.event_time && (
                  <p className="text-xs font-bold text-primary-700 mb-1">
                    {formatEventTime(ev.event_time)}
                  </p>
                )}
                <p className="text-sm font-bold text-gray-900">{ev.title}</p>
                {ev.location && (
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 shrink-0" />
                    {ev.location}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    [{eventTypeLabel(ev.event_type)}]
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary-50 text-primary-800">
                    [{eventScopeBadge(ev)}]
                  </span>
                  {!ev.event_time && (
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      시간 미정
                    </span>
                  )}
                </div>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

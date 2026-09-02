import type { ScheduleEvent } from '../../services/eventHelpers';
import { eventTypeLabel } from '../../services/eventHelpers';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

type Props = {
  year: number;
  month: number;
  selectedDate: string;
  todayKey: string;
  eventsByDate: Map<string, ScheduleEvent[]>;
  compact?: boolean;
  onSelectDate: (dateKey: string) => void;
};

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function ScheduleMonthCalendar({
  year,
  month,
  selectedDate,
  todayKey,
  eventsByDate,
  compact = false,
  onSelectDate,
}: Props) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  return (
    <div
      className="bg-white rounded-[24px] border border-[#ECECEC] p-4 md:p-5"
      style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}
    >
      <div className="grid grid-cols-7 mb-2">
        {WEEKDAYS.map((d, i) => (
          <div
            key={d}
            className={`text-center text-xs font-semibold py-2 ${
              i === 0 ? 'text-red-400/80' : i === 6 ? 'text-blue-400/80' : 'text-gray-400'
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      <div className={`grid grid-cols-7 ${compact ? 'gap-1' : 'gap-1.5'}`}>
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`pad-${i}`} className={compact ? 'min-h-[52px]' : 'min-h-[88px] md:min-h-[96px]'} />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateKey = `${year}-${pad(month + 1)}-${pad(day)}`;
          const dayEvents = eventsByDate.get(dateKey) ?? [];
          const isToday = dateKey === todayKey;
          const isSelected = dateKey === selectedDate;
          const dow = new Date(year, month, day).getDay();
          const overflow = dayEvents.length > (compact ? 0 : 2);

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => onSelectDate(dateKey)}
              className={[
                'rounded-[14px] text-left transition-all touch-target flex flex-col',
                compact ? 'min-h-[52px] p-1.5' : 'min-h-[88px] md:min-h-[96px] p-2',
                isSelected
                  ? 'bg-primary-50 border-2 border-primary-500 shadow-sm'
                  : isToday
                  ? 'bg-[#FFF7D6] border border-primary-200 hover:border-primary-300'
                  : 'border border-transparent hover:bg-gray-50 hover:border-gray-100',
              ].join(' ')}
            >
              <div className="flex items-center gap-1">
                <span
                  className={[
                    'text-sm leading-none',
                    isSelected ? 'font-bold text-primary-900' : 'font-medium text-gray-800',
                    dow === 0 && !isSelected ? 'text-red-500/90' : '',
                    dow === 6 && !isSelected ? 'text-blue-500/90' : '',
                  ].join(' ')}
                >
                  {day}
                </span>
                {isToday && (
                  <span className="text-[10px] font-bold text-primary-700 bg-primary-100 px-1.5 py-0.5 rounded-md">
                    오늘
                  </span>
                )}
              </div>

              {compact ? (
                dayEvents.length > 0 && (
                  <div className="flex gap-0.5 mt-1 justify-center flex-wrap">
                    {dayEvents.slice(0, 3).map(ev => (
                      <span
                        key={ev.id}
                        className="w-1.5 h-1.5 rounded-full bg-primary-500"
                        aria-hidden
                      />
                    ))}
                  </div>
                )
              ) : (
                <div className="mt-1 space-y-0.5 flex-1 min-h-0 overflow-hidden">
                  {dayEvents.slice(0, 2).map(ev => (
                    <p
                      key={ev.id}
                      className="text-[10px] md:text-[11px] leading-tight text-gray-700 truncate font-medium"
                    >
                      {ev.title}
                    </p>
                  ))}
                  {overflow && (
                    <p className="text-[10px] font-bold text-primary-700">
                      +{dayEvents.length - 2}
                    </p>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {!compact && (
        <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-gray-100">
          {['worship', 'meeting', 'event'].map(type => (
            <span key={type} className="text-[11px] text-gray-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-primary-400" />
              {eventTypeLabel(type)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

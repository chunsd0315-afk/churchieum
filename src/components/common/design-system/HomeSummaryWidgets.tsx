import type { ReactNode } from 'react';
import type { NoticeItem, ScheduleItem } from '../home/HomeDashboard';
import { Soft3DIcon } from '../icons/Soft3DIcons';
import { DS } from './tokens';

type Props = {
  schedules: ScheduleItem[];
  notices: NoticeItem[];
  onSchedulesMore?: () => void;
  onNoticesMore?: () => void;
  showSchedules?: boolean;
  showNotices?: boolean;
  /** 참석 현황 자리에 오늘의 말씀 안내 — 기존 3열 유지용 */
  showTodayWord?: boolean;
};

function WidgetCard({
  title,
  icon,
  children,
  onMore,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  onMore?: () => void;
}) {
  return (
    <div
      style={{
        background: DS.colors.bgSurface,
        border: `1px solid ${DS.colors.borderCard}`,
        borderRadius: DS.radius.card,
        boxShadow: DS.shadow.card,
        padding: 22,
        flex: 1,
        minWidth: 0,
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center shrink-0">{icon}</div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: DS.colors.textPrimary }}>{title}</h3>
        </div>
        {onMore && (
          <button
            type="button"
            onClick={onMore}
            className="text-xs font-semibold transition-colors"
            style={{ color: '#B45309' }}
          >
            더보기
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <p style={{ fontSize: 13, color: DS.colors.textMuted, padding: '8px 0', fontWeight: 400 }}>{text}</p>
  );
}

/** PC 홈 하단 — 일정 · 공지 · 현황 위젯 */
export function HomeSummaryWidgets({
  schedules,
  notices,
  onSchedulesMore,
  onNoticesMore,
  showSchedules = true,
  showNotices = true,
  showTodayWord = true,
}: Props) {
  const attendanceData = [
    { label: '주일예배', value: 128, color: DS.colors.accentBlue },
    { label: '새벽기도', value: 42, color: DS.colors.accentGreen },
    { label: '수요예배', value: 86, color: DS.colors.accentPurple },
  ];
  const total = attendanceData.reduce((s, d) => s + d.value, 0);
  const visibleCount = [showSchedules, showNotices, showTodayWord].filter(Boolean).length;
  if (visibleCount === 0) return null;

  return (
    <div
      className="w-full"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${Math.min(visibleCount, 3)}, 1fr)`,
        gap: DS.spacing.gridGapDesktop,
        marginTop: DS.spacing.sectionGap,
      }}
    >
      {showSchedules && (
      <WidgetCard
        title="이번 주 일정"
        icon={<Soft3DIcon iconKey="schedule" size={36} />}
        onMore={onSchedulesMore}
      >
        {schedules.length === 0 ? (
          <EmptyHint text="등록된 일정이 없습니다" />
        ) : (
          <ul className="space-y-3">
            {schedules.slice(0, 4).map(s => (
              <li key={s.id} className="flex items-start justify-between gap-2">
                <span style={{ fontSize: 13, fontWeight: 600, color: DS.colors.textPrimary }} className="truncate">
                  {s.title}
                </span>
                <span style={{ fontSize: 12, color: DS.colors.textMuted, fontWeight: 400 }} className="shrink-0">
                  {s.time ? `${s.date} ${s.time}` : s.date}
                </span>
              </li>
            ))}
          </ul>
        )}
      </WidgetCard>
      )}

      {showNotices && (
      <WidgetCard
        title="최근 공지"
        icon={<Soft3DIcon iconKey="announcement" size={36} />}
        onMore={onNoticesMore}
      >
        {notices.length === 0 ? (
          <EmptyHint text="등록된 공지가 없습니다" />
        ) : (
          <ul className="space-y-3">
            {notices.slice(0, 4).map(n => (
              <li key={n.id} className="flex items-start justify-between gap-2">
                <span style={{ fontSize: 13, fontWeight: 600, color: DS.colors.textPrimary }} className="truncate">
                  {n.isPinned ? '📌 ' : ''}{n.title}
                </span>
                <span style={{ fontSize: 12, color: DS.colors.textMuted, fontWeight: 400 }} className="shrink-0">{n.date}</span>
              </li>
            ))}
          </ul>
        )}
      </WidgetCard>
      )}

      {showTodayWord && (
      <WidgetCard
        title="참석 현황"
        icon={<Soft3DIcon iconKey="statistics" size={36} />}
      >
        <div className="flex items-center gap-4">
          <div className="relative shrink-0" style={{ width: 72, height: 72 }}>
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              {(() => {
                let offset = 0;
                return attendanceData.map(d => {
                  const pct = (d.value / total) * 100;
                  const dash = `${pct} ${100 - pct}`;
                  const el = (
                    <circle
                      key={d.label}
                      cx="18"
                      cy="18"
                      r="14"
                      fill="none"
                      stroke={d.color}
                      strokeWidth="4"
                      strokeDasharray={dash}
                      strokeDashoffset={-offset}
                      strokeLinecap="round"
                    />
                  );
                  offset += pct;
                  return el;
                });
              })()}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span style={{ fontSize: 14, fontWeight: 800, color: DS.colors.textPrimary }}>{total}</span>
            </div>
          </div>
          <ul className="space-y-1.5 flex-1 min-w-0">
            {attendanceData.map(d => (
              <li key={d.label} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                <span style={{ fontSize: 12, color: DS.colors.textSecondary, fontWeight: 400 }} className="truncate">{d.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: DS.colors.textPrimary }} className="ml-auto">{d.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </WidgetCard>
      )}
    </div>
  );
}

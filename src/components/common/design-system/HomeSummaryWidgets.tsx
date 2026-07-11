import { Calendar, Megaphone, Users } from 'lucide-react';
import type { NoticeItem, ScheduleItem } from '../home/HomeDashboard';
import { DS } from './tokens';

type Props = {
  schedules: ScheduleItem[];
  notices: NoticeItem[];
  onSchedulesMore?: () => void;
  onNoticesMore?: () => void;
};

function WidgetCard({
  title,
  icon,
  iconBg,
  children,
  onMore,
}: {
  title: string;
  icon: React.ReactNode;
  iconBg: string;
  children: React.ReactNode;
  onMore?: () => void;
}) {
  return (
    <div
      style={{
        background: DS.colors.bgSurface,
        border: `1px solid ${DS.colors.borderCard}`,
        borderRadius: DS.radius.card,
        boxShadow: DS.shadow.card,
        padding: 20,
        flex: 1,
        minWidth: 0,
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center rounded-xl"
            style={{ width: 36, height: 36, background: iconBg }}
          >
            {icon}
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: DS.colors.textPrimary }}>{title}</h3>
        </div>
        {onMore && (
          <button
            type="button"
            onClick={onMore}
            className="text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors"
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
    <p style={{ fontSize: 13, color: DS.colors.textMuted, padding: '8px 0' }}>{text}</p>
  );
}

/** PC 홈 하단 — 일정 · 공지 · 현황 위젯 */
export function HomeSummaryWidgets({ schedules, notices, onSchedulesMore, onNoticesMore }: Props) {
  const attendanceData = [
    { label: '주일예배', value: 128, color: '#3B82F6' },
    { label: '새벽기도', value: 42, color: '#22C55E' },
    { label: '수요예배', value: 86, color: '#A855F7' },
  ];
  const total = attendanceData.reduce((s, d) => s + d.value, 0);

  return (
    <div
      className="w-full"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: DS.spacing.gridGapDesktop,
        marginTop: DS.spacing.sectionGap,
      }}
    >
      <WidgetCard
        title="이번 주 일정"
        icon={<Calendar className="w-4 h-4 text-red-500" />}
        iconBg="#FEF2F2"
        onMore={onSchedulesMore}
      >
        {schedules.length === 0 ? (
          <EmptyHint text="등록된 일정이 없습니다" />
        ) : (
          <ul className="space-y-2.5">
            {schedules.slice(0, 4).map(s => (
              <li key={s.id} className="flex items-start justify-between gap-2">
                <span style={{ fontSize: 13, fontWeight: 600, color: DS.colors.textPrimary }} className="truncate">
                  {s.title}
                </span>
                <span style={{ fontSize: 12, color: DS.colors.textMuted }} className="shrink-0">
                  {s.time ? `${s.date} ${s.time}` : s.date}
                </span>
              </li>
            ))}
          </ul>
        )}
      </WidgetCard>

      <WidgetCard
        title="최근 공지"
        icon={<Megaphone className="w-4 h-4 text-orange-500" />}
        iconBg="#FFF7ED"
        onMore={onNoticesMore}
      >
        {notices.length === 0 ? (
          <EmptyHint text="등록된 공지가 없습니다" />
        ) : (
          <ul className="space-y-2.5">
            {notices.slice(0, 4).map(n => (
              <li key={n.id} className="flex items-start justify-between gap-2">
                <span style={{ fontSize: 13, fontWeight: 600, color: DS.colors.textPrimary }} className="truncate">
                  {n.isPinned ? '📌 ' : ''}{n.title}
                </span>
                <span style={{ fontSize: 12, color: DS.colors.textMuted }} className="shrink-0">{n.date}</span>
              </li>
            ))}
          </ul>
        )}
      </WidgetCard>

      <WidgetCard
        title="참석 현황"
        icon={<Users className="w-4 h-4 text-blue-500" />}
        iconBg="#EFF6FF"
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
                <span style={{ fontSize: 12, color: DS.colors.textSecondary }} className="truncate">{d.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: DS.colors.textPrimary }} className="ml-auto">{d.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </WidgetCard>
    </div>
  );
}

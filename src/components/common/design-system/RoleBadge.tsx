import { DS } from './tokens';

export type RoleBadgeMode = 'admin' | 'pastor' | 'member';

const BADGE_STYLES: Record<RoleBadgeMode, { bg: string; color: string }> = {
  member: { bg: DS.colors.badgeMemberBg, color: DS.colors.badgeMemberText },
  pastor: { bg: DS.colors.badgePastorBg, color: DS.colors.badgePastorText },
  admin: { bg: DS.colors.badgeAdminBg, color: DS.colors.badgeAdminText },
};

type Props = {
  label: string;
  mode: RoleBadgeMode;
  className?: string;
};

/** 역할 구분용 소형 배지 — 앱 전체 컬러는 블루 통일, 배지만 역할별 */
export function RoleBadge({ label, mode, className = '' }: Props) {
  const style = BADGE_STYLES[mode];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${className}`}
      style={{ background: style.bg, color: style.color }}
    >
      {label}
    </span>
  );
}

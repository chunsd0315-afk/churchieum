import { BannerSceneIllustration } from './BannerSceneIllustration';
import { RoleBadge } from './RoleBadge';
import { DS } from './tokens';

type Props = {
  userName?: string;
  roleLabel?: string;
  position?: string;
  churchName?: string;
  mode: 'admin' | 'pastor' | 'member';
};

function honorificName(name?: string, position?: string): string {
  if (!name) return '';
  const pos = position?.trim();
  if (pos && !name.includes(pos)) return `${name} ${pos}님`;
  return `${name}님`;
}

const SUBTITLE: Record<Props['mode'], string> = {
  admin: '우리 교회를 사랑으로 이어요',
  pastor: '말씀과 기도로 함께합니다',
  member: '오늘도 주님 안에서 평안하세요',
};

/** 홈 상단 환영 배너 — 블루 통일, 3D 교회 일러스트 */
export function RoleGreetingBanner({
  userName,
  roleLabel,
  position,
  churchName,
  mode,
}: Props) {
  const displayHonorific = honorificName(userName, position);
  const subtitle = SUBTITLE[mode];

  return (
    <div
      className="relative overflow-hidden w-full"
      style={{
        minHeight: DS.layout.bannerHeight,
        background: DS.colors.bannerGradient,
        borderRadius: DS.radius.banner,
        border: `1px solid ${DS.colors.borderCard}`,
        boxShadow: DS.shadow.banner,
        marginBottom: DS.spacing.sectionGap,
      }}
    >
      <div
        className="absolute -right-6 -top-6 rounded-full pointer-events-none"
        style={{
          width: 180,
          height: 180,
          background: 'radial-gradient(circle, rgba(167,216,255,0.35) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 flex items-center min-h-[168px] px-5 py-5 sm:px-8">
        <div className="flex-1 min-w-0 pr-3 sm:max-w-[55%]">
          {roleLabel && (
            <RoleBadge label={roleLabel} mode={mode} className="mb-2.5" />
          )}
          <h2
            className="font-bold leading-snug"
            style={{
              fontSize: DS.typography.bannerTitle.size,
              fontWeight: DS.typography.bannerTitle.weight,
              color: DS.colors.textPrimary,
              marginBottom: 6,
              letterSpacing: '-0.02em',
            }}
          >
            {displayHonorific ? (
              <>
                <span style={{ color: DS.colors.primary }}>{displayHonorific}</span>
              </>
            ) : (
              subtitle
            )}
          </h2>
          {displayHonorific && (
            <p
              style={{
                fontSize: DS.typography.caption.size,
                color: DS.colors.textSecondary,
                lineHeight: 1.5,
                fontWeight: 500,
              }}
            >
              {subtitle}
            </p>
          )}
          {churchName && !displayHonorific && (
            <p style={{ fontSize: DS.typography.caption.size, color: DS.colors.textMuted, marginTop: 4 }}>
              {churchName}
            </p>
          )}
        </div>

        <div
          className="hidden sm:flex items-end justify-end shrink-0"
          style={{ width: '44%', height: 140 }}
        >
          <BannerSceneIllustration />
        </div>

        <div
          className="sm:hidden absolute right-1 bottom-0 pointer-events-none opacity-90"
          style={{ width: 120, height: 88 }}
        >
          <BannerSceneIllustration />
        </div>
      </div>
    </div>
  );
}

/** @deprecated RoleGreetingBanner 사용 */
export const HomeGreetingBanner = RoleGreetingBanner;

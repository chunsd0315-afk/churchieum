import { BannerSceneIllustration } from './BannerSceneIllustration';
import { DS } from './tokens';

type Props = {
  userName?: string;
  roleLabel?: string;
  churchName?: string;
  mode: 'admin' | 'pastor' | 'member';
};

const ROLE_COPY: Record<Props['mode'], { title: string; subtitle: string }> = {
  admin: {
    title: '우리 교회를 사랑으로 이어요',
    subtitle: '교회 공동체를 섬기는 모든 메뉴를 한곳에서',
  },
  pastor: {
    title: '말씀과 기도로 함께합니다',
    subtitle: '교역자님, 오늘도 은혜로운 하루 되세요',
  },
  member: {
    title: '오늘도 주님 안에서 평안하세요',
    subtitle: '말씀, 기도, 교제로 믿음을 이어가요',
  },
};

/** 홈 상단 인사 배너 — 시안 스타일 풍성한 3D 일러스트 */
export function RoleGreetingBanner({ userName, roleLabel, churchName, mode }: Props) {
  const copy = ROLE_COPY[mode];
  const displayName = userName ? `${userName}님` : '';

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
      {/* 배경 장식 원 */}
      <div
        className="absolute -right-8 -top-8 rounded-full pointer-events-none"
        style={{
          width: 200,
          height: 200,
          background: 'radial-gradient(circle, rgba(147,197,253,0.25) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute right-24 bottom-0 rounded-full pointer-events-none"
        style={{
          width: 120,
          height: 120,
          background: 'radial-gradient(circle, rgba(134,239,172,0.2) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 flex items-center min-h-[190px] px-7 py-6 sm:px-9">
        {/* 왼쪽: 인사말 */}
        <div className="flex-1 min-w-0 pr-4 sm:max-w-[52%]">
          {roleLabel && (
            <span
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold mb-3"
              style={{ background: 'rgba(37,99,235,0.12)', color: '#1D4ED8' }}
            >
              {roleLabel}
            </span>
          )}
          <h1
            className="font-bold leading-snug"
            style={{ fontSize: 24, color: DS.colors.textPrimary, marginBottom: 8, letterSpacing: '-0.02em' }}
          >
            {displayName && mode === 'member' ? (
              <>
                <span style={{ color: '#2563EB' }}>{displayName}</span>
                <br />
                {copy.title}
              </>
            ) : (
              copy.title
            )}
          </h1>
          <p style={{ fontSize: 14, color: DS.colors.textMuted, lineHeight: 1.55 }}>
            {churchName && (
              <span className="font-semibold" style={{ color: DS.colors.textSecondary }}>
                {churchName}
              </span>
            )}
            {churchName && ' · '}
            {copy.subtitle}
          </p>
        </div>

        {/* 오른쪽: 3D 일러스트 (높이 70%+) */}
        <div
          className="hidden sm:flex items-end justify-end shrink-0"
          style={{ width: '46%', height: 150, maxHeight: '78%' }}
        >
          <BannerSceneIllustration />
        </div>

        {/* 모바일: 우측 하단 미니 일러스트 */}
        <div
          className="sm:hidden absolute right-2 bottom-1 pointer-events-none opacity-75"
          style={{ width: 110, height: 80 }}
        >
          <BannerSceneIllustration />
        </div>
      </div>
    </div>
  );
}

/** @deprecated RoleGreetingBanner 사용 */
export const HomeGreetingBanner = RoleGreetingBanner;

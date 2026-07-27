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

const TODAY_WORD: Record<Props['mode'], { verse: string; ref: string }> = {
  member: {
    verse: '여호와는 나의 목자시니 내게 부족함이 없으리로다',
    ref: '시편 23:1',
  },
  pastor: {
    verse: '너는 말씀을 전파하라 때를 얻든지 못 얻든지 항상 힘쓰라',
    ref: '디모데후서 4:2',
  },
  admin: {
    verse: '모든 것을 품위 있게 하고 질서 있게 하라',
    ref: '고린도전서 14:40',
  },
};

/** 홈 Hero Card — 오늘의 말씀 · 환영 · Soft-3D 일러스트 */
export function RoleGreetingBanner({
  userName,
  roleLabel,
  position,
  churchName,
  mode,
}: Props) {
  const displayHonorific = honorificName(userName, position);
  const subtitle = SUBTITLE[mode];
  const word = TODAY_WORD[mode];

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
        className="absolute -right-8 -top-8 rounded-full pointer-events-none"
        style={{
          width: 200,
          height: 200,
          background: 'radial-gradient(circle, rgba(255,205,0,0.22) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 flex items-center min-h-[180px] px-5 py-5 sm:px-8">
        <div className="flex-1 min-w-0 pr-3 sm:max-w-[58%]">
          <div className="flex items-center gap-2 mb-2.5 flex-wrap">
            {roleLabel && <RoleBadge label={roleLabel} mode={mode} />}
            <span
              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold"
              style={{
                background: DS.colors.primary,
                color: DS.colors.textOnYellow,
              }}
            >
              오늘의 말씀
            </span>
          </div>

          <h2
            className="font-bold leading-snug"
            style={{
              fontSize: DS.typography.bannerTitle.size,
              fontWeight: DS.typography.bannerTitle.weight,
              color: DS.colors.textPrimary,
              marginBottom: 8,
              letterSpacing: '-0.02em',
            }}
          >
            {displayHonorific ? (
              <>
                안녕하세요,{' '}
                <span style={{ color: '#B45309' }}>{displayHonorific}</span>
              </>
            ) : (
              subtitle
            )}
          </h2>

          <p
            style={{
              fontSize: 15,
              color: DS.colors.textPrimary,
              lineHeight: 1.55,
              fontWeight: 500,
              marginBottom: 4,
            }}
          >
            “{word.verse}”
          </p>
          <p
            style={{
              fontSize: 12,
              color: DS.colors.textMuted,
              fontWeight: 400,
            }}
          >
            {word.ref}
            {churchName ? ` · ${churchName}` : ''}
          </p>
        </div>

        <div
          className="hidden sm:flex items-end justify-end shrink-0"
          style={{ width: '42%', height: 148 }}
        >
          <BannerSceneIllustration />
        </div>

        <div
          className="sm:hidden absolute right-0 bottom-0 pointer-events-none opacity-90"
          style={{ width: 128, height: 96 }}
        >
          <BannerSceneIllustration />
        </div>
      </div>
    </div>
  );
}

/** @deprecated RoleGreetingBanner 사용 */
export const HomeGreetingBanner = RoleGreetingBanner;

import { ChevronRight, type LucideIcon } from 'lucide-react';

export type FeatureNavigationCardProps = {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  onClick: () => void;
  badge?: string | number;
  disabled?: boolean;
};

/**
 * 메뉴 허브 기능 이동 카드
 * - 모바일: 가로형 (아이콘 | 제목·설명 | >)
 * - PC: 가로형 유지, 2열 그리드에서 사용 (화살표 표시)
 */
export function FeatureNavigationCard({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  description,
  onClick,
  badge,
  disabled,
}: FeatureNavigationCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`${title} — ${description}`}
      className="w-full flex items-center gap-3.5 px-4 py-4 min-h-[88px]
        bg-white rounded-[18px] border border-[#E5E7EB]
        shadow-[0_2px_8px_rgba(0,0,0,0.05)]
        hover:bg-gray-50/60 active:bg-gray-50 active:scale-[0.98]
        transition-all cursor-pointer touch-target text-left
        focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
    >
      <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
        <Icon className={`w-5 h-5 ${iconColor}`} aria-hidden />
      </div>
      <div className="flex-1 min-w-0 pr-1">
        <div className="flex items-center gap-2">
          <p className="font-bold text-gray-900 text-[15px] leading-snug">{title}</p>
          {badge != null && badge !== '' && (
            <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded-full shrink-0">
              {badge}
            </span>
          )}
        </div>
        <p className="text-[12px] md:text-[13px] text-[#6B7280] leading-snug mt-0.5">{description}</p>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-300 shrink-0" aria-hidden />
    </button>
  );
}

/** @deprecated alias — MobileFeatureNavigationCard */
export const MobileFeatureNavigationCard = FeatureNavigationCard;

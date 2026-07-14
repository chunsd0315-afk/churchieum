import type { ReactNode } from 'react';
import { PageHeaderBar } from '../ui/PageLayout';
import { FeatureNavigationCard } from './FeatureNavigationCard';
import { filterFeaturesByRole, type FeatureHubViewer } from './filterFeaturesByRole';
import type { FeatureCardConfig } from './types';

export type FeatureHubPageProps = {
  title: string;
  description: string;
  features: FeatureCardConfig[];
  viewer: FeatureHubViewer;
  onSelect: (featureId: string) => void;
  /** 카드 목록 아래 추가 콘텐츠 (최근 목록 등) */
  children?: ReactNode;
  /** PC 그리드 열 수 (기본 2) */
  columns?: 1 | 2 | 3;
};

/**
 * 메뉴 허브 페이지 셸
 * 메뉴명 + 메뉴설명 + 역할별 기능 카드 + (선택) 하단 콘텐츠
 */
export function FeatureHubPage({
  title,
  description,
  features,
  viewer,
  onSelect,
  children,
  columns = 2,
}: FeatureHubPageProps) {
  const visible = filterFeaturesByRole(features, viewer);
  const gridClass =
    columns === 3
      ? 'grid grid-cols-1 md:grid-cols-3 gap-3'
      : columns === 1
        ? 'flex flex-col gap-3'
        : 'grid grid-cols-1 md:grid-cols-2 gap-3';

  return (
    <div className="pb-10 bg-white">
      <PageHeaderBar title={title} description={description} />
      <div className={`${gridClass} mb-8`}>
        {visible.map(f => (
          <FeatureNavigationCard
            key={f.id}
            icon={f.icon}
            iconBg={f.iconBg}
            iconColor={f.iconColor}
            title={f.title}
            description={f.description}
            badge={f.badge}
            disabled={f.disabled}
            onClick={() => onSelect(f.id)}
          />
        ))}
      </div>
      {children}
    </div>
  );
}

/** @deprecated alias */
export const DesktopFeatureNavigationGrid = FeatureHubPage;

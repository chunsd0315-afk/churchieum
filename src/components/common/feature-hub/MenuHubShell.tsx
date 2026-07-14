/**
 * 메뉴 허브 → 상세 콘텐츠 전환 헬퍼
 * App.tsx 상태 라우팅을 유지한 채 페이지 내부 hub 패턴을 적용한다.
 */

import { useState, type ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { FeatureHubPage } from './FeatureHubPage';
import type { FeatureHubPageConfig } from './types';
import { useAuth } from '../../../contexts/AuthContext';

type Props = {
  hub: FeatureHubPageConfig;
  /** feature id → content. return null to stay on hub */
  renderContent: (featureId: string, goHub: () => void) => ReactNode;
  /** 허브 하단(최근 콘텐츠 등) */
  hubFooter?: ReactNode;
};

/**
 * FeatureHub와 하위 콘텐츠를 전환하는 공통 셸.
 * 하위 콘텐츠에 별도 헤더가 없을 때 간단 오버레이 뒤로가기를 제공한다.
 */
export function MenuHubShell({ hub, renderContent, hubFooter }: Props) {
  const { isPastor, isAdmin, user } = useAuth();
  const [featureId, setFeatureId] = useState<string | null>(null);

  const goHub = () => setFeatureId(null);

  if (featureId) {
    const content = renderContent(featureId, goHub);
    if (content != null) return <>{content}</>;
  }

  return (
    <FeatureHubPage
      title={hub.title}
      description={hub.description}
      features={hub.features}
      viewer={{ isPastor, isAdmin, role: user?.role }}
      onSelect={id => setFeatureId(id)}
    >
      {hubFooter}
    </FeatureHubPage>
  );
}

/** 허브에서 들어간 하위 화면에 넣을 간단 뒤로 헤더 */
export function HubBackBar({ title, description, onBack }: {
  title: string;
  description?: string;
  onBack: () => void;
}) {
  return (
    <div className="mb-4 flex items-start gap-2">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 px-2 py-2 hover:bg-gray-100 rounded-[10px] text-gray-600 touch-target shrink-0"
      >
        <ChevronLeft className="w-5 h-5" />
        <span className="text-sm font-medium">뒤로</span>
      </button>
      <div className="min-w-0 pt-1">
        <h2 className="text-[19px] md:text-[22px] font-bold text-[#111827] leading-[1.2]">{title}</h2>
        {description && (
          <p className="mt-1 text-[12px] md:text-[13px] text-[#6B7280] leading-[1.4]">{description}</p>
        )}
      </div>
    </div>
  );
}

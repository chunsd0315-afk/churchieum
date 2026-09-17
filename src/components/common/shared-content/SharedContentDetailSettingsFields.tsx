import type { ReceivedShareType, VisibilityFilter, VisibilityType } from '../../../types/sharedContent';
import { getAuthorRoleFilterOptions } from '../../../services/orgTerminology';
import { getVisibilityFilterOptions } from '../../../services/visibilityRolePolicy';
import { useAuth } from '../../../contexts/AuthContext';
import { useOrgSettings } from '../../../contexts/OrgSettingsContext';
import { SharedContentSegmentButtons } from './SharedContentSegmentButtons';
import type { SharedContentShareTypeFilterOption } from '../../../services/sharedContentShareTypeFilterLabels';

/** 내 기록 공개범위 필터 — 역할 정책과 같은 이름을 사용한다 */
export function SharedContentVisibilityFilterSection({
  value,
  onChange,
}: {
  value: VisibilityFilter;
  onChange: (next: VisibilityFilter) => void;
}) {
  const { user } = useAuth();
  const { settings, terminologyVersion } = useOrgSettings();
  void terminologyVersion;
  const options = getVisibilityFilterOptions(user, settings) as {
    id: VisibilityFilter;
    label: string;
  }[];

  return (
    <SharedContentSegmentButtons
      title="공개범위"
      options={options}
      value={value}
      onChange={onChange}
      layout="wrap"
    />
  );
}

export function SharedContentShareTypeFilterSection({
  options,
  value,
  onChange,
}: {
  options: SharedContentShareTypeFilterOption[];
  value: ReceivedShareType;
  onChange: (next: ReceivedShareType) => void;
}) {
  return (
    <SharedContentSegmentButtons
      title="공유유형"
      options={options.map(o => ({
        id: o.id,
        label: o.label,
        description: o.description,
        ariaLabel: o.ariaLabel,
      }))}
      value={value}
      onChange={onChange}
      layout={options.length === 1 ? 'wrap' : 'grid-2'}
      variant="share"
    />
  );
}

export function SharedContentAuthorRoleFilterSection({
  value,
  onChange,
  includeSuperAdmin = false,
  description,
}: {
  value: 'all' | 'member' | 'pastor' | 'super_admin';
  onChange: (next: 'all' | 'member' | 'pastor' | 'super_admin') => void;
  includeSuperAdmin?: boolean;
  description?: string;
}) {
  const { settings, terminologyVersion } = useOrgSettings();
  void terminologyVersion;
  const authorRoleOptions = getAuthorRoleFilterOptions(settings);
  const options = includeSuperAdmin
    ? [
        ...authorRoleOptions,
        { id: 'super_admin' as const, label: '최고관리자' },
      ]
    : authorRoleOptions;

  return (
    <div>
      <SharedContentSegmentButtons
        title="작성자 구분"
        options={options}
        value={value}
        onChange={onChange}
        layout="wrap"
      />
      {description ? (
        <p className="text-[12px] text-gray-500 mt-2 leading-snug">{description}</p>
      ) : null}
    </div>
  );
}

export function SharedContentAuthorQueryField({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div>
      <p className="text-sm font-bold text-gray-800 mb-2">작성자</p>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="작성자 이름"
        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50"
      />
    </div>
  );
}

export function SharedContentPrayerStatusFilterSection({
  value,
  onChange,
}: {
  value: 'all' | 'praying' | 'answered';
  onChange: (next: 'all' | 'praying' | 'answered') => void;
}) {
  return (
    <SharedContentSegmentButtons
      title="기도 상태"
      options={[
        { id: 'all', label: '전체' },
        { id: 'praying', label: '기도 중' },
        { id: 'answered', label: '응답받음' },
      ]}
      value={value}
      onChange={onChange}
      layout="grid-2"
    />
  );
}

export type { VisibilityType };

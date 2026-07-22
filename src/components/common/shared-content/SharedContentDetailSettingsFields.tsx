import type { ReceivedShareType, VisibilityFilter, VisibilityType } from '../../../types/sharedContent';
import { VISIBILITY_LABELS } from '../../../types/sharedContent';
import { SharedContentSegmentButtons } from './SharedContentSegmentButtons';
import type { SharedContentShareTypeFilterOption } from '../../../services/sharedContentShareTypeFilterLabels';

const VISIBILITY_OPTIONS: { id: VisibilityFilter; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'private', label: VISIBILITY_LABELS.private },
  { id: 'pastor_share', label: VISIBILITY_LABELS.pastor_share },
  { id: 'organization_share', label: VISIBILITY_LABELS.organization_share },
];

const AUTHOR_ROLE_OPTIONS = [
  { id: 'all' as const, label: '전체 작성자' },
  { id: 'member' as const, label: '성도' },
  { id: 'pastor' as const, label: '교역자' },
];

export function SharedContentVisibilityFilterSection({
  value,
  onChange,
}: {
  value: VisibilityFilter;
  onChange: (next: VisibilityFilter) => void;
}) {
  return (
    <SharedContentSegmentButtons
      title="공개범위"
      options={VISIBILITY_OPTIONS}
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
  const options = includeSuperAdmin
    ? [
        ...AUTHOR_ROLE_OPTIONS,
        { id: 'super_admin' as const, label: '최고관리자' },
      ]
    : AUTHOR_ROLE_OPTIONS;

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

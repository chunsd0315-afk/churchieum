import { useMemo, useState } from 'react';
import { Search, User, Check } from 'lucide-react';
import type { OrganizationAssigneeType, OrgPersonCandidate } from '../../../types/organization';
import { searchPersonCandidates } from '../../../services/orgPeopleCatalog';
import { isAlreadyAssignee } from '../../../services/orgAssigneeStorage';
import { TabBar } from '../../common/ui/TabBar';
import { MobileFullScreenPage } from '../../layout/ContentEditorLayout';
import { useBreakpoint } from '../../../hooks/useBreakpoint';

type Filter = 'all' | OrganizationAssigneeType;

type Props = {
  organizationId: string;
  open: boolean;
  onClose: () => void;
  onSelect: (person: OrgPersonCandidate) => void;
};

function PersonRow({
  person,
  registered,
  onSelect,
}: {
  person: OrgPersonCandidate;
  registered: boolean;
  onSelect: () => void;
}) {
  const isPastor = person.assigneeType === 'pastor';
  return (
    <button
      type="button"
      disabled={registered}
      onClick={onSelect}
      className={[
        'w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors',
        registered
          ? 'bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed'
          : 'bg-white border-gray-200 hover:bg-primary-50 hover:border-primary-200',
      ].join(' ')}
    >
      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary-500 to-indigo-500 flex items-center justify-center shrink-0 overflow-hidden">
        {person.profileImage ? (
          <img src={person.profileImage} alt="" className="w-full h-full object-cover" />
        ) : (
          <User className="w-5 h-5 text-white" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[15px] font-bold text-gray-900 truncate">{person.name}</span>
          <span className={[
            'text-[11px] font-bold px-2 py-0.5 rounded-full',
            isPastor ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700',
          ].join(' ')}>
            {isPastor ? '교역자' : '성도'}
          </span>
          {registered && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600 flex items-center gap-0.5">
              <Check className="w-3 h-3" /> 등록됨
            </span>
          )}
        </div>
        <p className="text-[13px] text-gray-600 mt-0.5 truncate">{person.titleLabel}</p>
        {person.orgSummary && (
          <p className="text-[12px] text-gray-400 mt-0.5 truncate">{person.orgSummary}</p>
        )}
      </div>
    </button>
  );
}

function PickerBody({
  organizationId,
  onSelect,
}: {
  organizationId: string;
  onSelect: (person: OrgPersonCandidate) => void;
}) {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const list = useMemo(
    () => searchPersonCandidates(query, filter),
    [query, filter],
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-4 pt-3 space-y-3 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="이름, 직분, 소속 검색"
            className="w-full pl-10 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:outline-none"
          />
        </div>
        <TabBar
          tabs={[
            { id: 'all', label: '전체' },
            { id: 'pastor', label: '교역자' },
            { id: 'member', label: '성도' },
          ]}
          activeTab={filter}
          onChange={id => setFilter(id as Filter)}
          variant="segment"
        />
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {list.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">검색 결과가 없습니다.</p>
        ) : (
          list.map(p => (
            <PersonRow
              key={`${p.assigneeType}-${p.userId}`}
              person={p}
              registered={isAlreadyAssignee(organizationId, p.userId)}
              onSelect={() => onSelect(p)}
            />
          ))
        )}
      </div>
    </div>
  );
}

export function OrgAssigneePicker({ organizationId, open, onClose, onSelect }: Props) {
  const { isMobile } = useBreakpoint();
  if (!open) return null;

  const handleSelect = (person: OrgPersonCandidate) => {
    onSelect(person);
    onClose();
  };

  if (isMobile) {
    return (
      <MobileFullScreenPage
        title="담당자 선택"
        description="교역자 또는 성도를 선택하세요."
        onBack={onClose}
      >
        <div className="h-[calc(100vh-8rem)] bg-white">
          <PickerBody organizationId={organizationId} onSelect={handleSelect} />
        </div>
      </MobileFullScreenPage>
    );
  }

  return (
    <div className="fixed inset-0 z-popover flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="닫기" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-[20px] shadow-overlay overflow-hidden flex flex-col"
        style={{ maxHeight: '85vh' }}>
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-[17px] font-bold text-gray-900">담당자 선택</h3>
            <p className="text-[13px] text-gray-500 mt-0.5">교역자 또는 성도를 선택하세요.</p>
          </div>
          <button type="button" onClick={onClose} className="text-sm font-semibold text-gray-500 hover:text-gray-800 px-3 py-2">
            닫기
          </button>
        </div>
        <div className="flex-1 min-h-0" style={{ height: 480 }}>
          <PickerBody organizationId={organizationId} onSelect={handleSelect} />
        </div>
      </div>
    </div>
  );
}

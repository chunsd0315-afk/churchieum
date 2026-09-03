import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Search, Settings, Save, Check, X, ChevronDown } from 'lucide-react';
import { PageHeaderBar } from '../../components/common/ui';
import { useOrgSettings } from '../../contexts/OrgSettingsContext';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { MobileFullScreenPage } from '../../components/layout/ContentEditorLayout';
import {
  buildOrgTree,
  getAllOrganizations,
  getAncestorIds,
  ORG_TREE_CHANGED_EVENT,
} from '../../services/organizationStorage';
import { getAssigneesForOrg } from '../../services/orgAssigneeStorage';
import { OrgTreePanel } from '../../components/admin/organization/OrgTreePanel';
import { OrgDetailPanel } from '../../components/admin/organization/OrgDetailPanel';
import { OrgSummaryPanel } from '../../components/admin/organization/OrgSummaryPanel';
import type { AdminPage } from '../../components/admin/Layout';
import DistrictManagementPage from './DistrictManagementPage';
import ZoneManagementPage from './ZoneManagementPage';
import DepartmentManagementPage from './DepartmentManagementPage';

type LegacyTab = 'district' | 'zone' | 'department';

type Props = {
  onNavigate?: (page: AdminPage) => void;
};

function computeOrgSearch(query: string): { matched: Set<string>; expand: Set<string> } {
  const q = query.trim().toLowerCase();
  const matched = new Set<string>();
  const expand = new Set<string>();
  if (!q) return { matched, expand };

  const orgs = getAllOrganizations();
  for (const org of orgs) {
    const nameHit = org.name.toLowerCase().includes(q);
    const typeHit = org.type.toLowerCase().includes(q);
    let assigneeHit = false;
    if (!nameHit && !typeHit) {
      const assignees = getAssigneesForOrg(org.id);
      assigneeHit = assignees.some(a =>
        a.userName.toLowerCase().includes(q)
        || a.titleLabel.toLowerCase().includes(q)
        || (a.roleLabel ?? '').toLowerCase().includes(q),
      );
    }
    if (nameHit || typeHit || assigneeHit) {
      matched.add(org.id);
      expand.add(org.id);
      getAncestorIds(org.id).forEach(id => expand.add(id));
    }
  }
  return { matched, expand };
}

export default function OrganizationManagementPage({ onNavigate }: Props) {
  const { settings, updateSettings, l1, l2, dept, pastorLabel, terminologyVersion } = useOrgSettings();
  const { isMobile } = useBreakpoint();

  const [searchQuery, setSearchQuery] = useState('');
  const [showTerminology, setShowTerminology] = useState(false);
  const [showLegacy, setShowLegacy] = useState(false);
  const [legacyTab, setLegacyTab] = useState<LegacyTab>('district');

  const [l1Draft, setL1Draft] = useState(settings.level1Label);
  const [l2Draft, setL2Draft] = useState(settings.level2Label);
  const [deptDraft, setDeptDraft] = useState(settings.departmentLabel);
  const [pastorDraft, setPastorDraft] = useState(settings.pastorLabel);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [draftParentId, setDraftParentId] = useState<string | null>(null);
  const [treeTick, setTreeTick] = useState(0);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  const refreshTree = useCallback(() => setTreeTick(t => t + 1), []);
  const tree = buildOrgTree(true);
  void treeTick;
  void terminologyVersion;

  useEffect(() => {
    const handler = () => refreshTree();
    window.addEventListener(ORG_TREE_CHANGED_EVENT, handler);
    return () => window.removeEventListener(ORG_TREE_CHANGED_EVENT, handler);
  }, [refreshTree]);

  const searchResult = useMemo(() => computeOrgSearch(searchQuery), [searchQuery, treeTick, terminologyVersion]);

  useEffect(() => {
    setL1Draft(settings.level1Label);
    setL2Draft(settings.level2Label);
    setDeptDraft(settings.departmentLabel);
    setPastorDraft(settings.pastorLabel);
  }, [settings.level1Label, settings.level2Label, settings.departmentLabel, settings.pastorLabel]);

  useEffect(() => {
    if (!selectedId && tree[0] && !creating) {
      setSelectedId(tree[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, creating, treeTick, terminologyVersion, tree[0]?.id]);

  const handleSaveLabels = async () => {
    if (saving) return;
    setSaveError(null);
    setSaving(true);
    setSaved(false);
    try {
      const result = await updateSettings({
        level1Label: l1Draft.trim(),
        level2Label: l2Draft.trim(),
        departmentLabel: deptDraft.trim(),
        pastorLabel: pastorDraft.trim(),
      });
      if (!result.ok) {
        setSaveError(result.error);
        return;
      }
      refreshTree();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const openCreate = (parentId: string | null) => {
    setDraftParentId(parentId);
    setCreating(true);
    setSelectedId(null);
    if (isMobile) setMobileDetailOpen(true);
  };

  const openSelect = (id: string) => {
    setCreating(false);
    setSelectedId(id);
    if (isMobile) setMobileDetailOpen(true);
  };

  const goMembers = () => {
    try {
      if (selectedId) sessionStorage.setItem('org_filter', selectedId);
    } catch { /* ignore */ }
    onNavigate?.('members');
  };

  const goClergy = () => {
    try {
      if (selectedId) sessionStorage.setItem('org_filter_clergy', selectedId);
    } catch { /* ignore */ }
    onNavigate?.('clergy');
  };

  const detail = (
    <OrgDetailPanel
      key={creating ? 'creating' : (selectedId ?? 'none')}
      orgId={creating ? null : selectedId}
      draftParentId={draftParentId}
      creating={creating}
      onCancelCreate={() => {
        setCreating(false);
        if (isMobile) setMobileDetailOpen(false);
      }}
      onSaved={id => {
        setCreating(false);
        setSelectedId(id);
        refreshTree();
        if (isMobile) setMobileDetailOpen(false);
      }}
      onDeleted={() => {
        setSelectedId(null);
        refreshTree();
        if (isMobile) setMobileDetailOpen(false);
      }}
    />
  );

  const treePanel = (
    <OrgTreePanel
      tree={tree}
      selectedId={creating ? null : selectedId}
      onSelect={openSelect}
      onAddChild={openCreate}
      onTreeMoved={refreshTree}
      onRenamed={refreshTree}
      matchedIds={searchQuery.trim() ? searchResult.matched : undefined}
      forceExpandIds={searchQuery.trim() ? searchResult.expand : undefined}
    />
  );

  return (
    <div className="space-y-4 pb-8 max-w-[1400px]">
      <PageHeaderBar
        title="조직관리"
        description="교회의 모든 조직과 담당자, 소속 인원을 관리합니다."
        action={
          <button
            type="button"
            onClick={() => openCreate(null)}
            className="inline-flex items-center gap-2 h-12 px-4 rounded-[18px] bg-primary-500 text-[#1A1A1A] text-sm font-bold hover:bg-primary-600 active:bg-primary-700 active:scale-[0.98] transition-all touch-target"
          >
            <Plus className="w-4 h-4" />
            조직 추가
          </button>
        }
        mobileFab={{ label: '조직 추가', onClick: () => openCreate(null) }}
      />

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" aria-hidden />
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="조직명, 담당자 검색"
          className="w-full h-12 min-h-[48px] pl-12 pr-12 rounded-[18px] border border-[#ECECEC] text-sm bg-white focus:border-primary-400 focus:outline-none"
        />
        {searchQuery ? (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 touch-target"
            aria-label="검색어 지우기"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        ) : null}
      </div>

      {searchQuery.trim() && (
        <p className="text-xs text-gray-500 px-1">
          검색 결과 <strong className="text-gray-800">{searchResult.matched.size}</strong>개 조직
        </p>
      )}

      {/* PC 3단 */}
      <div
        className="hidden lg:grid gap-4"
        style={{ gridTemplateColumns: 'minmax(260px, 30%) minmax(0, 1fr) minmax(220px, 24%)', minHeight: 560 }}
      >
        <div className="min-h-0 h-[min(70vh,720px)]">{treePanel}</div>
        <div className="min-h-0 h-[min(70vh,720px)] overflow-hidden flex flex-col">{detail}</div>
        <div className="min-h-0 h-[min(70vh,720px)]">
          <OrgSummaryPanel
            orgId={creating ? null : selectedId}
            tick={treeTick}
            onGoMembers={onNavigate ? goMembers : undefined}
            onGoClergy={onNavigate ? goClergy : undefined}
          />
        </div>
      </div>

      {/* 태블릿: 트리 + 상세 */}
      <div className="hidden md:grid lg:hidden md:grid-cols-[300px_1fr] gap-4" style={{ minHeight: 520 }}>
        {treePanel}
        <div className="space-y-4 min-h-0 overflow-hidden flex flex-col">
          {detail}
          <OrgSummaryPanel
            orgId={creating ? null : selectedId}
            tick={treeTick}
            onGoMembers={onNavigate ? goMembers : undefined}
            onGoClergy={onNavigate ? goClergy : undefined}
          />
        </div>
      </div>

      {/* 모바일: 트리 → Full Screen 상세 */}
      <div className="md:hidden space-y-3" style={{ minHeight: 360 }}>
        <div className="h-[60vh]">{treePanel}</div>
        {mobileDetailOpen && (
          <MobileFullScreenPage
            title={creating ? '조직 추가' : (getAllOrganizations().find(o => o.id === selectedId)?.name ?? '조직 상세')}
            description="기본정보·담당자·소속인원·종류·직분을 관리합니다."
            onBack={() => {
              setMobileDetailOpen(false);
              setCreating(false);
            }}
          >
            <div className="space-y-4">
              {detail}
              {!creating && (
                <OrgSummaryPanel
                  orgId={selectedId}
                  tick={treeTick}
                  onGoMembers={onNavigate ? goMembers : undefined}
                  onGoClergy={onNavigate ? goClergy : undefined}
                />
              )}
            </div>
          </MobileFullScreenPage>
        )}
      </div>

      {/* 기본 용어 설정 — 접이식 유지 */}
      <div className="bg-white border border-[#ECECEC] rounded-[20px] shadow-[0_8px_30px_rgba(0,0,0,0.06)] overflow-hidden">
        <button
          type="button"
          onClick={() => setShowTerminology(v => !v)}
          className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left touch-target"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Settings className="w-4 h-4 text-primary-500 shrink-0" />
            <div className="min-w-0">
              <p className="font-bold text-gray-900 text-sm">기본 용어 설정</p>
              <p className="text-xs text-gray-400 truncate">조직명·교역자 표시명 · 저장 시 전체 앱에 반영</p>
            </div>
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showTerminology ? 'rotate-180' : ''}`} />
        </button>
        {showTerminology && (
          <div className="px-5 pb-5 border-t border-gray-100 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">상위조직 이름</label>
                <input
                  value={l1Draft}
                  onChange={e => setL1Draft(e.target.value)}
                  placeholder="예: 교구"
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:outline-none"
                />
                <p className="text-[11px] text-gray-400 mt-1">현재: <strong>{l1}</strong></p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">하위조직 이름</label>
                <input
                  value={l2Draft}
                  onChange={e => setL2Draft(e.target.value)}
                  placeholder="예: 구역"
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:outline-none"
                />
                <p className="text-[11px] text-gray-400 mt-1">현재: <strong>{l2}</strong></p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">부서 이름</label>
                <input
                  value={deptDraft}
                  onChange={e => setDeptDraft(e.target.value)}
                  placeholder="예: 부서"
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:outline-none"
                />
                <p className="text-[11px] text-gray-400 mt-1">현재: <strong>{dept}</strong></p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">교역자 표시명</label>
                <input
                  value={pastorDraft}
                  onChange={e => setPastorDraft(e.target.value)}
                  placeholder="예: 교역자"
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:outline-none"
                />
                <p className="text-[11px] text-gray-400 mt-1">현재: <strong>{pastorLabel}</strong></p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                {saveError ? <p className="text-xs text-red-600 font-semibold">{saveError}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => void handleSaveLabels()}
                disabled={saving}
                className={`flex items-center gap-1.5 h-11 px-4 rounded-[18px] text-sm font-bold transition-all disabled:opacity-60 ${
                  saved
                    ? 'bg-green-500 text-white'
                    : 'bg-primary-500 hover:bg-primary-600 text-[#1A1A1A]'
                }`}
              >
                {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saving ? '저장 중…' : saved ? '저장됨' : '용어 저장'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 기존 분류 — 접이식 유지 */}
      <div className="bg-white border border-[#ECECEC] rounded-[20px] overflow-hidden">
        <button
          type="button"
          onClick={() => setShowLegacy(v => !v)}
          className="w-full flex items-center justify-between gap-3 px-5 py-3.5 text-left touch-target"
        >
          <p className="text-sm font-semibold text-gray-600">기존 분류 ({l1}/{l2}/{dept})</p>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showLegacy ? 'rotate-180' : ''}`} />
        </button>
        {showLegacy && (
          <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-3">
            <p className="text-[13px] text-gray-500">
              기존 {l1}/{l2}/{dept} 관리 화면입니다. 트리에서 수정한 내용은 가능하면 여기에 동기화됩니다.
            </p>
            <div className="flex flex-wrap gap-2">
              {([
                { id: 'district' as const, label: l1 },
                { id: 'zone' as const, label: l2 },
                { id: 'department' as const, label: dept },
              ]).map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setLegacyTab(t.id)}
                  className={`px-3 py-2 rounded-xl text-sm font-semibold touch-target ${
                    legacyTab === t.id
                      ? 'bg-primary-500 text-[#1A1A1A]'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {legacyTab === 'district' && <DistrictManagementPage />}
            {legacyTab === 'zone' && <ZoneManagementPage />}
            {legacyTab === 'department' && <DepartmentManagementPage />}
          </div>
        )}
      </div>
    </div>
  );
}

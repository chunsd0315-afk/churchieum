import { useCallback, useEffect, useState } from 'react';
import { Settings, Save, Check } from 'lucide-react';
import { PageHeaderBar, TabBar } from '../../components/common/ui';
import { useOrgSettings } from '../../contexts/OrgSettingsContext';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { MobileFullScreenPage } from '../../components/layout/ContentEditorLayout';
import { buildOrgTree } from '../../services/organizationStorage';
import { OrgTreePanel } from '../../components/admin/organization/OrgTreePanel';
import { OrgDetailPanel } from '../../components/admin/organization/OrgDetailPanel';
import { OrgMetaSettings } from '../../components/admin/organization/OrgMetaSettings';
import DistrictManagementPage from './DistrictManagementPage';
import ZoneManagementPage from './ZoneManagementPage';
import DepartmentManagementPage from './DepartmentManagementPage';

type MainTab = 'tree' | 'meta' | 'legacy';
type LegacyTab = 'district' | 'zone' | 'department';

export default function OrganizationManagementPage() {
  const { settings, updateSettings, l1, l2, dept } = useOrgSettings();
  const { isMobile } = useBreakpoint();
  const [mainTab, setMainTab] = useState<MainTab>('tree');
  const [legacyTab, setLegacyTab] = useState<LegacyTab>('district');

  const [l1Draft, setL1Draft] = useState(settings.level1Label);
  const [l2Draft, setL2Draft] = useState(settings.level2Label);
  const [deptDraft, setDeptDraft] = useState(settings.departmentLabel);
  const [saved, setSaved] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [draftParentId, setDraftParentId] = useState<string | null>(null);
  const [treeTick, setTreeTick] = useState(0);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

  const refreshTree = useCallback(() => setTreeTick(t => t + 1), []);
  const tree = buildOrgTree(true);
  void treeTick;

  useEffect(() => {
    if (!selectedId && tree[0] && !creating) {
      setSelectedId(tree[0].id);
    }
    // tree 배열 참조가 매 렌더 바뀌므로 길이·첫 id만 의존
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, creating, treeTick, tree[0]?.id]);

  const handleSaveLabels = () => {
    updateSettings({
      level1Label: l1Draft.trim() || '교구',
      level2Label: l2Draft.trim() || '구역',
      departmentLabel: deptDraft.trim() || '부서',
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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

  return (
    <div className="space-y-4 pb-8 max-w-[1100px]">
      <PageHeaderBar
        title="조직관리"
        description="교회의 모든 기능이 연결되는 조직 체계를 관리합니다."
      />

      {/* 조직명(레거시 라벨) 설정 — 기존 기능 유지 */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-4 h-4 text-primary-500" />
          <h3 className="font-bold text-gray-900 text-sm">기본 조직명 설정</h3>
          <span className="text-xs text-gray-400 ml-1">기존 화면(성도·초대 등)에 표시되는 이름</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
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
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-gray-400">변경하면 기존 화면에 즉시 반영됩니다.</p>
          <button
            type="button"
            onClick={handleSaveLabels}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              saved ? 'bg-green-500 text-white' : 'bg-primary-500 hover:bg-primary-600 text-white'
            }`}
          >
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? '저장됨' : '조직명 저장'}
          </button>
        </div>
      </div>

      <TabBar
        tabs={[
          { id: 'tree', label: '조직 트리' },
          { id: 'meta', label: '종류·직분' },
          { id: 'legacy', label: '기존 분류' },
        ]}
        activeTab={mainTab}
        onChange={v => setMainTab(v as MainTab)}
        variant="segment"
      />

      {mainTab === 'tree' && (
        <>
          {/* PC: 좌우 레이아웃 */}
          <div className="hidden md:grid md:grid-cols-[320px_1fr] gap-4" style={{ minHeight: 520 }}>
            <OrgTreePanel
              tree={tree}
              selectedId={creating ? null : selectedId}
              onSelect={openSelect}
              onAddChild={openCreate}
            />
            {detail}
          </div>

          {/* 모바일: 트리 목록 → Full Screen 상세 */}
          <div className="md:hidden space-y-3" style={{ minHeight: 360 }}>
            <div className="h-[60vh]">
              <OrgTreePanel
                tree={tree}
                selectedId={creating ? null : selectedId}
                onSelect={openSelect}
                onAddChild={openCreate}
              />
            </div>
            {mobileDetailOpen && (
              <MobileFullScreenPage
                title={creating ? '조직 추가' : '조직 상세'}
                description="기본정보·담당자·소속인원을 관리합니다."
                onBack={() => {
                  setMobileDetailOpen(false);
                  setCreating(false);
                }}
              >
                {detail}
              </MobileFullScreenPage>
            )}
          </div>
        </>
      )}

      {mainTab === 'meta' && <OrgMetaSettings />}

      {mainTab === 'legacy' && (
        <div className="space-y-3">
          <p className="text-[13px] text-gray-500">
            기존 {l1}/{l2}/{dept} 관리 화면입니다. 트리에서 수정한 내용은 가능하면 여기에 동기화됩니다.
          </p>
          <TabBar
            tabs={[
              { id: 'district', label: l1 },
              { id: 'zone', label: l2 },
              { id: 'department', label: dept },
            ]}
            activeTab={legacyTab}
            onChange={v => setLegacyTab(v as LegacyTab)}
            variant="segment"
          />
          {legacyTab === 'district' && <DistrictManagementPage />}
          {legacyTab === 'zone' && <ZoneManagementPage />}
          {legacyTab === 'department' && <DepartmentManagementPage />}
        </div>
      )}
    </div>
  );
}

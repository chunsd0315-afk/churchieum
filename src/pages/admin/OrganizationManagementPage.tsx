import { useState } from 'react';
import { Settings, Save, Check } from 'lucide-react';
import { PageHeaderBar, TabBar } from '../../components/common/ui';
import { useOrgSettings } from '../../contexts/OrgSettingsContext';
import DistrictManagementPage from './DistrictManagementPage';
import ZoneManagementPage from './ZoneManagementPage';
import DepartmentManagementPage from './DepartmentManagementPage';

type Tab = 'district' | 'zone' | 'department';

export default function OrganizationManagementPage() {
  const { settings, updateSettings, l1, l2, dept } = useOrgSettings();
  const [tab, setTab] = useState<Tab>('district');

  // Label editor state — initialized from context
  const [l1Draft, setL1Draft] = useState(settings.level1Label);
  const [l2Draft, setL2Draft] = useState(settings.level2Label);
  const [deptDraft, setDeptDraft] = useState(settings.departmentLabel);
  const [saved, setSaved] = useState(false);

  const handleSaveLabels = () => {
    updateSettings({
      level1Label: l1Draft.trim() || '교구',
      level2Label: l2Draft.trim() || '구역',
      departmentLabel: deptDraft.trim() || '부서',
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4 max-w-6xl pb-8">
      <PageHeaderBar title="조직관리" description="상위조직, 하위조직, 부서를 관리합니다." />

      {/* ── 조직명 설정 ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-4 h-4 text-primary-500" />
          <h3 className="font-bold text-gray-900 text-sm">조직명 설정</h3>
          <span className="text-xs text-gray-400 ml-1">교회 용어에 맞게 이름을 변경하세요</span>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">상위조직 이름</label>
            <input
              value={l1Draft}
              onChange={e => setL1Draft(e.target.value)}
              placeholder="예: 교구, 권역, 대그룹"
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:outline-none"
            />
            <p className="text-[11px] text-gray-400 mt-1">현재: <strong>{l1}</strong></p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">하위조직 이름</label>
            <input
              value={l2Draft}
              onChange={e => setL2Draft(e.target.value)}
              placeholder="예: 구역, 셀, 목장"
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:outline-none"
            />
            <p className="text-[11px] text-gray-400 mt-1">현재: <strong>{l2}</strong></p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">부서 이름</label>
            <input
              value={deptDraft}
              onChange={e => setDeptDraft(e.target.value)}
              placeholder="예: 부서, 사역팀, 공동체"
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:outline-none"
            />
            <p className="text-[11px] text-gray-400 mt-1">현재: <strong>{dept}</strong></p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">변경하면 모든 화면에 즉시 반영됩니다.</p>
          <button
            onClick={handleSaveLabels}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              saved
                ? 'bg-green-500 text-white'
                : 'bg-primary-500 hover:bg-primary-600 text-white'
            }`}
          >
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? '저장됨' : '조직명 저장'}
          </button>
        </div>
      </div>

      {/* ── 조직 관리 탭 ── */}
      <TabBar
        tabs={[
          { id: 'district', label: l1 },
          { id: 'zone', label: l2 },
          { id: 'department', label: dept },
        ]}
        activeTab={tab}
        onChange={v => setTab(v as Tab)}
        variant="segment"
      />

      {tab === 'district' && <DistrictManagementPage />}
      {tab === 'zone' && <ZoneManagementPage />}
      {tab === 'department' && <DepartmentManagementPage />}
    </div>
  );
}

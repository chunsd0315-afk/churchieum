import { useState } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';
import type { ChurchRole, OrgTypeDef } from '../../../types/organization';
import {
  deleteChurchRole,
  deleteOrgType,
  getChurchRoles,
  getOrgTypes,
  upsertChurchRole,
  upsertOrgType,
} from '../../../services/organizationStorage';
import { ChurchButton } from '../../common/ui/ChurchButton';
import { TabBar } from '../../common/ui/TabBar';
import { useToast } from '../../common/ui';
import { CHURCH_LIST_CLASS, CHURCH_LIST_ROW_CLASS } from '../../common/ui/ChurchList';

type MetaTab = 'types' | 'roles';

export function OrgMetaSettings() {
  const toast = useToast();
  const [tab, setTab] = useState<MetaTab>('types');
  const [tick, setTick] = useState(0);
  const refresh = () => setTick(t => t + 1);
  void tick;

  const types = getOrgTypes();
  const roles = getChurchRoles();
  const [typeName, setTypeName] = useState('');
  const [roleName, setRoleName] = useState('');

  const inputClass = 'w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:outline-none';

  const addType = () => {
    const name = typeName.trim();
    if (!name) return;
    const row: OrgTypeDef = {
      id: `t-${Date.now().toString(36)}`,
      name,
      sortOrder: types.length + 1,
      isActive: true,
      isSystem: false,
    };
    upsertOrgType(row);
    setTypeName('');
    toast.success('조직 종류가 추가되었습니다.');
    refresh();
  };

  const addRole = () => {
    const name = roleName.trim();
    if (!name) return;
    const row: ChurchRole = {
      id: `r-${Date.now().toString(36)}`,
      name,
      sortOrder: roles.length + 1,
      isActive: true,
      isSystem: false,
    };
    upsertChurchRole(row);
    setRoleName('');
    toast.success('직분이 추가되었습니다.');
    refresh();
  };

  return (
    <div className="bg-white rounded-[20px] border border-gray-200 shadow-sm p-4 space-y-4">
      <TabBar
        tabs={[
          { id: 'types', label: '조직 종류' },
          { id: 'roles', label: '직분' },
        ]}
        activeTab={tab}
        onChange={id => setTab(id as MetaTab)}
        variant="segment"
      />

      {tab === 'types' && (
        <div className="space-y-3">
          <p className="text-[13px] text-gray-500">교구·부서·기관 등 조직 종류를 자유롭게 추가합니다.</p>
          <div className="flex gap-2">
            <input className={inputClass} value={typeName} onChange={e => setTypeName(e.target.value)} placeholder="새 종류 이름" />
            <ChurchButton icon={<Plus size={18} />} size="sm" onClick={addType}>추가</ChurchButton>
          </div>
          <ul className={CHURCH_LIST_CLASS}>
            {types.map(t => (
              <li key={t.id} className={`${CHURCH_LIST_ROW_CLASS} flex items-center justify-between`}>
                <span className="text-sm font-semibold text-gray-900">
                  {t.name}
                  {t.isSystem && <span className="ml-2 text-[11px] text-gray-400">기본</span>}
                </span>
                {!t.isSystem && (
                  <button
                    type="button"
                    aria-label="삭제"
                    onClick={() => {
                      if (deleteOrgType(t.id)) { toast.success('삭제되었습니다.'); refresh(); }
                      else toast.error('기본 종류는 삭제할 수 없습니다.');
                    }}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'roles' && (
        <div className="space-y-3">
          <p className="text-[13px] text-gray-500">직분은 조직과 별도로 관리하며, 성도 소속 역할에 사용합니다.</p>
          <div className="flex gap-2">
            <input className={inputClass} value={roleName} onChange={e => setRoleName(e.target.value)} placeholder="새 직분 이름" />
            <ChurchButton icon={<Save size={18} />} size="sm" onClick={addRole}>추가</ChurchButton>
          </div>
          <ul className={CHURCH_LIST_CLASS}>
            {roles.map(r => (
              <li key={r.id} className={`${CHURCH_LIST_ROW_CLASS} flex items-center justify-between`}>
                <span className="text-sm font-semibold text-gray-900">
                  {r.name}
                  {r.isSystem && <span className="ml-2 text-[11px] text-gray-400">기본</span>}
                </span>
                {!r.isSystem && (
                  <button
                    type="button"
                    aria-label="삭제"
                    onClick={() => {
                      if (deleteChurchRole(r.id)) { toast.success('삭제되었습니다.'); refresh(); }
                      else toast.error('기본 직분은 삭제할 수 없습니다.');
                    }}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

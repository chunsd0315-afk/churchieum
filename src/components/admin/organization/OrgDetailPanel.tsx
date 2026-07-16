import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Save, Trash2, UserPlus, Users, Settings2, X, Pencil, Search, Star,
} from 'lucide-react';
import {
  assigneeRoleLabel,
  type OrganizationAssignee,
  type OrganizationAssigneeType,
  type OrgPersonCandidate,
} from '../../../types/organization';
import {
  addMembership,
  createOrganization,
  deleteOrganization,
  getAllOrganizations,
  getChurchRoles,
  getDemoMemberCandidates,
  getMembershipsForOrg,
  getOrgTypes,
  removeMembership,
  upsertOrganization,
  wouldCreateCycle,
} from '../../../services/organizationStorage';
import {
  getAssigneesForOrg,
  removeAssignee,
} from '../../../services/orgAssigneeStorage';
import { countAssigneePermissions } from '../../../services/orgPermissionHelpers';
import { ChurchButton } from '../../common/ui/ChurchButton';
import { TabBar } from '../../common/ui/TabBar';
import { CHURCH_LIST_CLASS, CHURCH_LIST_ROW_CLASS } from '../../common/ui/ChurchList';
import { useToast } from '../../common/ui';
import { OrgAssigneePicker } from './OrgAssigneePicker';
import { OrgAssigneeEditor } from './OrgAssigneeEditor';

type DetailTab = 'info' | 'assignees' | 'members' | 'roles';
type AssigneeFilter = 'all' | OrganizationAssigneeType;

type Props = {
  orgId: string | null;
  draftParentId: string | null;
  creating: boolean;
  onCancelCreate: () => void;
  onSaved: (id: string) => void;
  onDeleted: () => void;
};

export function OrgDetailPanel({
  orgId, draftParentId, creating, onCancelCreate, onSaved, onDeleted,
}: Props) {
  const toast = useToast();
  const allOrgs = getAllOrganizations();
  const org = orgId ? allOrgs.find(o => o.id === orgId) ?? null : null;
  const [tab, setTab] = useState<DetailTab>('info');
  const types = getOrgTypes().filter(t => t.isActive);
  const roles = getChurchRoles().filter(r => r.isActive);
  const candidates = useMemo(() => getDemoMemberCandidates(), []);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState(types[0]?.name ?? '기타');
  const [parentId, setParentId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState(1);
  const [isActive, setIsActive] = useState(true);
  const [tick, setTick] = useState(0);
  const [memberPick, setMemberPick] = useState(candidates[0]?.id ?? '');
  const [memberRoleId, setMemberRoleId] = useState(roles[0]?.id ?? '');

  const [assigneeFilter, setAssigneeFilter] = useState<AssigneeFilter>('all');
  const [assigneeQuery, setAssigneeQuery] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [pickedPerson, setPickedPerson] = useState<OrgPersonCandidate | null>(null);
  const [editingAssignee, setEditingAssignee] = useState<OrganizationAssignee | null>(null);

  useEffect(() => {
    const typesNow = getOrgTypes().filter(t => t.isActive);
    if (creating) {
      setName('');
      setCode('');
      setType(typesNow[0]?.name ?? '기타');
      setParentId(draftParentId);
      setDescription('');
      setSortOrder(1);
      setIsActive(true);
      setTab('info');
      return;
    }
    const current = orgId ? getAllOrganizations().find(o => o.id === orgId) : null;
    if (current) {
      setName(current.name);
      setCode(current.code);
      setType(current.type);
      setParentId(current.parentId);
      setDescription(current.description);
      setSortOrder(current.sortOrder);
      setIsActive(current.isActive);
    }
  }, [orgId, creating, draftParentId]);

  const refresh = () => setTick(t => t + 1);
  void tick;

  const assignees = orgId ? getAssigneesForOrg(orgId) : [];
  const members = orgId ? getMembershipsForOrg(orgId) : [];
  const parentOptions = allOrgs.filter(o => !creating && org ? o.id !== org.id : true);

  const filteredAssignees = useMemo(() => {
    const q = assigneeQuery.trim().toLowerCase();
    return assignees.filter(a => {
      if (assigneeFilter !== 'all' && a.assigneeType !== assigneeFilter) return false;
      if (!q) return true;
      return (
        a.userName.toLowerCase().includes(q)
        || a.titleLabel.toLowerCase().includes(q)
        || (a.roleLabel ?? '').toLowerCase().includes(q)
        || assigneeRoleLabel(a.role, a.roleLabel).toLowerCase().includes(q)
      );
    });
  }, [assignees, assigneeFilter, assigneeQuery]);

  const membersByRole = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of members) {
      map.set(m.roleLabel, (map.get(m.roleLabel) ?? 0) + 1);
    }
    return map;
  }, [members]);

  if (!creating && !org) {
    return (
      <div className="h-full flex items-center justify-center bg-white rounded-[20px] border border-gray-200 shadow-sm p-8">
        <p className="text-[15px] text-gray-500 text-center">
          왼쪽에서 조직을 선택하거나<br />새 조직을 추가하세요.
        </p>
      </div>
    );
  }

  const handleSaveInfo = () => {
    if (!name.trim()) {
      toast.error('조직명을 입력해주세요.');
      return;
    }
    if (creating) {
      const created = createOrganization({
        name,
        type,
        parentId,
        description,
        code: code || undefined,
      });
      toast.success('조직이 추가되었습니다.');
      onSaved(created.id);
      return;
    }
    if (!org) return;
    if (wouldCreateCycle(org.id, parentId)) {
      toast.error('상위 조직을 자기 자신이나 하위 조직으로 지정할 수 없습니다.');
      return;
    }
    upsertOrganization({
      ...org,
      name: name.trim(),
      code: code.trim() || org.code,
      type,
      parentId,
      description,
      sortOrder: Number(sortOrder) || 0,
      isActive,
    });
    toast.success('조직 정보가 저장되었습니다.');
    onSaved(org.id);
    refresh();
  };

  const handleDelete = () => {
    if (!org) return;
    if (!window.confirm(`「${org.name}」과 하위 조직을 삭제할까요?`)) return;
    deleteOrganization(org.id, true);
    toast.success('조직이 삭제되었습니다.');
    onDeleted();
  };

  const addMemberRow = () => {
    if (!orgId) return;
    const cand = candidates.find(c => c.id === memberPick);
    if (!cand) return;
    const role = roles.find(r => r.id === memberRoleId);
    addMembership({
      organizationId: orgId,
      memberId: cand.id,
      memberName: cand.name,
      roleId: memberRoleId,
      roleLabel: role?.name ?? '성도',
    });
    toast.success('소속 인원이 추가되었습니다.');
    refresh();
  };

  const openAddAssignee = () => {
    setPickedPerson(null);
    setEditingAssignee(null);
    setPickerOpen(true);
  };

  const onPersonPicked = (person: OrgPersonCandidate) => {
    setPickedPerson(person);
    setEditingAssignee(null);
    setEditorOpen(true);
  };

  const openEditAssignee = (a: OrganizationAssignee) => {
    setEditingAssignee(a);
    setPickedPerson(null);
    setEditorOpen(true);
  };

  const inputClass = 'w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:outline-none';

  return (
    <div className="h-full flex flex-col min-h-0 bg-white rounded-[20px] border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-[17px] font-bold text-gray-900 truncate">
            {creating ? '새 조직 추가' : org?.name}
          </h3>
          <p className="text-[13px] text-gray-500 mt-0.5">
            {creating ? '조직 정보를 입력한 뒤 저장하세요.' : `${org?.type} · ${org?.code}`}
          </p>
        </div>
        {creating && (
          <button type="button" onClick={onCancelCreate} className="p-2 rounded-xl hover:bg-gray-100" aria-label="취소">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      {!creating && (
        <div className="px-3 pt-2">
          <TabBar
            tabs={[
              { id: 'info', label: '기본정보' },
              { id: 'assignees', label: '담당자' },
              { id: 'members', label: '소속인원' },
              { id: 'roles', label: '직분/역할' },
            ]}
            activeTab={tab}
            onChange={id => setTab(id as DetailTab)}
            variant="segment"
          />
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {(creating || tab === 'info') && (
          <div className="space-y-3">
            <Field label="조직명">
              <input className={inputClass} value={name} onChange={e => setName(e.target.value)} placeholder="예: 1교구" />
            </Field>
            <Field label="조직코드">
              <input className={inputClass} value={code} onChange={e => setCode(e.target.value)} placeholder="자동 생성 가능" />
            </Field>
            <Field label="조직종류">
              <select className={inputClass} value={type} onChange={e => setType(e.target.value)}>
                {types.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
              </select>
            </Field>
            <Field label="상위조직">
              <select
                className={inputClass}
                value={parentId ?? ''}
                onChange={e => setParentId(e.target.value || null)}
              >
                <option value="">(없음 — 최상위)</option>
                {parentOptions.map(o => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </Field>
            <Field label="설명">
              <textarea
                className={`${inputClass} min-h-[80px] resize-y`}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="조직 소개"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="정렬순서">
                <input
                  type="number"
                  className={inputClass}
                  value={sortOrder}
                  onChange={e => setSortOrder(Number(e.target.value))}
                />
              </Field>
              <Field label="활성 여부">
                <button
                  type="button"
                  onClick={() => setIsActive(v => !v)}
                  className={`w-full h-[42px] rounded-xl text-sm font-semibold border ${
                    isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'
                  }`}
                >
                  {isActive ? '활성' : '비활성'}
                </button>
              </Field>
            </div>
            <ChurchButton icon={<Save size={18} />} onClick={handleSaveInfo} className="w-full">
              {creating ? '조직 추가' : '정보 저장'}
            </ChurchButton>

            {!creating && org && (
              <div className="pt-4 space-y-3 border-t border-gray-100">
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 text-[13px] text-amber-900">
                  <p className="font-bold flex items-center gap-1.5 mb-1"><Settings2 className="w-4 h-4" />연동 안내</p>
                  <p>권한은 조직이 아니라 담당자 개인에게 부여합니다. 「담당자」 탭에서 설정하세요.</p>
                  {org.legacyKind && (
                    <p className="mt-2">레거시 연동: <strong>{org.legacyKind}</strong></p>
                  )}
                </div>
                <ChurchButton variant="danger" icon={<Trash2 size={18} />} onClick={handleDelete} className="w-full">
                  조직 삭제
                </ChurchButton>
              </div>
            )}
          </div>
        )}

        {!creating && tab === 'assignees' && orgId && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
              <p className="text-[13px] text-gray-500">담당자 개인에게 이 조직의 권한을 부여합니다.</p>
              <ChurchButton icon={<UserPlus size={18} />} size="sm" onClick={openAddAssignee}>
                담당자 추가
              </ChurchButton>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={assigneeQuery}
                onChange={e => setAssigneeQuery(e.target.value)}
                placeholder="이름, 직분, 역할 검색"
                className="w-full pl-10 pr-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:outline-none"
              />
            </div>

            <TabBar
              tabs={[
                { id: 'all', label: '전체' },
                { id: 'pastor', label: '교역자' },
                { id: 'member', label: '성도' },
              ]}
              activeTab={assigneeFilter}
              onChange={id => setAssigneeFilter(id as AssigneeFilter)}
              variant="segment"
            />

            <ul className={CHURCH_LIST_CLASS}>
              {filteredAssignees.map(a => {
                const isPastor = a.assigneeType === 'pastor';
                return (
                  <li
                    key={a.id}
                    className={`${CHURCH_LIST_ROW_CLASS} flex items-start justify-between gap-2`}
                  >
                    <button
                      type="button"
                      className="flex-1 min-w-0 text-left touch-target"
                      onClick={() => openEditAssignee(a)}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-gray-900">{a.userName}</span>
                        <span className={[
                          'text-[11px] font-bold px-2 py-0.5 rounded-full',
                          isPastor ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700',
                        ].join(' ')}>
                          {isPastor ? '교역자' : '성도'}
                        </span>
                        {a.isPrimary && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 flex items-center gap-0.5">
                            <Star className="w-3 h-3" /> 주 담당자
                          </span>
                        )}
                        {!a.isActive && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                            비활성
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {a.titleLabel || '직분 없음'} · 조직 내 역할: {assigneeRoleLabel(a.role, a.roleLabel)}
                      </p>
                      <p className="text-[12px] text-primary-600 mt-1 font-semibold">
                        권한 {countAssigneePermissions(a)}개
                      </p>
                    </button>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        aria-label="수정"
                        onClick={() => openEditAssignee(a)}
                        className="p-2.5 rounded-lg text-gray-600 hover:bg-white touch-target"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="삭제"
                        onClick={() => {
                          if (!window.confirm(`${a.userName} 담당자를 삭제할까요?`)) return;
                          removeAssignee(a.id);
                          toast.success('담당자가 삭제되었습니다.');
                          refresh();
                        }}
                        className="p-2.5 rounded-lg text-red-500 hover:bg-red-50 touch-target"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
              {filteredAssignees.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-6">등록된 담당자가 없습니다.</p>
              )}
            </ul>
          </div>
        )}

        {!creating && tab === 'members' && orgId && (
          <div className="space-y-3">
            <p className="text-[13px] text-gray-500">성도는 여러 조직에 동시에 소속될 수 있습니다.</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <select className={inputClass} value={memberPick} onChange={e => setMemberPick(e.target.value)}>
                {candidates.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select className={inputClass} value={memberRoleId} onChange={e => setMemberRoleId(e.target.value)}>
                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              <ChurchButton icon={<Users size={18} />} size="sm" onClick={addMemberRow}>소속 추가</ChurchButton>
            </div>
            <ul className={CHURCH_LIST_CLASS}>
              {members.map(m => (
                <li key={m.id} className={`${CHURCH_LIST_ROW_CLASS} flex items-center justify-between gap-2`}>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{m.memberName}</p>
                    <p className="text-xs text-gray-500">{m.roleLabel}</p>
                  </div>
                  <button type="button" aria-label="삭제" onClick={() => { removeMembership(m.id); refresh(); }}
                    className="p-2 rounded-lg text-red-500 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
              {members.length === 0 && <p className="text-sm text-gray-400 text-center py-6">소속 인원이 없습니다.</p>}
            </ul>
          </div>
        )}

        {!creating && tab === 'roles' && (
          <div className="space-y-3">
            <p className="text-[13px] text-gray-500">
              교회 직분은 소속 인원 지정 시 사용합니다. 조직 내 역할(담당자용)은 「담당자」 탭에서 설정합니다.
            </p>
            <ul className={CHURCH_LIST_CLASS}>
              {roles.map(r => (
                <li key={r.id} className={`${CHURCH_LIST_ROW_CLASS} flex items-center justify-between`}>
                  <span className="text-sm font-semibold text-gray-900">{r.name}</span>
                  <span className="text-xs text-gray-500">
                    이 조직 {membersByRole.get(r.name) ?? 0}명
                  </span>
                </li>
              ))}
              {roles.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-6">등록된 직분이 없습니다. 「종류·직분」에서 추가하세요.</p>
              )}
            </ul>
          </div>
        )}
      </div>

      {orgId && (
        <>
          <OrgAssigneePicker
            organizationId={orgId}
            open={pickerOpen}
            onClose={() => setPickerOpen(false)}
            onSelect={onPersonPicked}
          />
          <OrgAssigneeEditor
            open={editorOpen}
            organizationId={orgId}
            person={pickedPerson}
            existing={editingAssignee}
            onClose={() => {
              setEditorOpen(false);
              setPickedPerson(null);
              setEditingAssignee(null);
            }}
            onSaved={refresh}
          />
        </>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</span>
      {children}
    </label>
  );
}

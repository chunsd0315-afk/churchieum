import { useEffect, useMemo, useState } from 'react';
import { Save, X } from 'lucide-react';
import type {
  AssigneePermissionCode,
  OrganizationAssignee,
  OrganizationAssigneeRole,
  OrganizationAssigneeType,
  OrgPersonCandidate,
} from '../../../types/organization';
import {
  ASSIGNEE_PERMISSION_DEFS,
  MEMBER_ASSIGNEE_ROLES,
  PASTOR_ASSIGNEE_ROLES,
  assigneeRoleLabel,
  defaultPermissionsForRole,
} from '../../../types/organization';
import { upsertAssignee } from '../../../services/orgAssigneeStorage';
import { ChurchButton } from '../../common/ui/ChurchButton';
import { MobileFullScreenPage } from '../../layout/ContentEditorLayout';
import { useBreakpoint } from '../../../hooks/useBreakpoint';
import { useToast } from '../../common/ui';

type Props = {
  open: boolean;
  organizationId: string;
  /** 신규: picker에서 선택한 사람 / 수정: 기존 담당자 */
  person: OrgPersonCandidate | null;
  existing: OrganizationAssignee | null;
  onClose: () => void;
  onSaved: () => void;
};

function groupPermissions() {
  const map = new Map<string, typeof ASSIGNEE_PERMISSION_DEFS>();
  for (const def of ASSIGNEE_PERMISSION_DEFS) {
    const list = map.get(def.group) ?? [];
    list.push(def);
    map.set(def.group, list);
  }
  return [...map.entries()];
}

function EditorForm({
  organizationId,
  person,
  existing,
  onClose,
  onSaved,
}: Omit<Props, 'open'>) {
  const toast = useToast();
  const assigneeType: OrganizationAssigneeType =
    existing?.assigneeType ?? person?.assigneeType ?? 'member';
  const roleOptions = assigneeType === 'pastor' ? PASTOR_ASSIGNEE_ROLES : MEMBER_ASSIGNEE_ROLES;

  const [role, setRole] = useState<OrganizationAssigneeRole>(
    existing?.role ?? roleOptions[0]?.role ?? 'other',
  );
  const [roleLabelCustom, setRoleLabelCustom] = useState(
    existing?.role === 'other' ? (existing.roleLabel ?? '') : '',
  );
  const [isPrimary, setIsPrimary] = useState(existing?.isPrimary ?? false);
  const [isActive, setIsActive] = useState(existing?.isActive ?? true);
  const [perms, setPerms] = useState<AssigneePermissionCode[]>(
    existing?.permissionCodes ?? defaultPermissionsForRole(assigneeType, roleOptions[0]?.role ?? 'other'),
  );

  // 신규 시 역할 기본 권한으로 초기화 (수정 모드는 유지)
  useEffect(() => {
    if (existing) return;
    setPerms(defaultPermissionsForRole(assigneeType, role));
  }, [role, assigneeType, existing]);

  const displayName = existing?.userName ?? person?.name ?? '';
  const titleLabel = existing?.titleLabel ?? person?.titleLabel ?? '';
  const userId = existing?.userId ?? person?.userId ?? '';
  const groups = useMemo(() => groupPermissions(), []);

  const togglePerm = (code: AssigneePermissionCode) => {
    setPerms(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code],
    );
  };

  const handleSave = () => {
    if (!userId || !displayName) {
      toast.error('담당자를 선택해주세요.');
      return;
    }
    upsertAssignee({
      id: existing?.id,
      createdAt: existing?.createdAt,
      organizationId,
      userId,
      userName: displayName,
      titleLabel,
      assigneeType,
      role,
      roleLabel: role === 'other' && roleLabelCustom.trim()
        ? roleLabelCustom.trim()
        : assigneeRoleLabel(role),
      isPrimary,
      isActive,
      permissionCodes: perms,
    });
    toast.success(existing ? '담당자 권한이 저장되었습니다.' : '담당자가 등록되었습니다.');
    onSaved();
    onClose();
  };

  const inputClass = 'w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:border-primary-400 focus:outline-none';

  return (
    <div className="flex flex-col">
      <div className="p-4 space-y-4">
        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[16px] font-bold text-gray-900">{displayName}</span>
            <span className={[
              'text-[11px] font-bold px-2 py-0.5 rounded-full',
              assigneeType === 'pastor' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700',
            ].join(' ')}>
              {assigneeType === 'pastor' ? '교역자' : '성도'}
            </span>
          </div>
          {titleLabel && <p className="text-[13px] text-gray-600 mt-1">{titleLabel}</p>}
          <p className="text-[12px] text-gray-400 mt-1">담당자 구분: {assigneeType === 'pastor' ? '교역자' : '성도'}</p>
        </div>

        <label className="block">
          <span className="block text-xs font-semibold text-gray-500 mb-1.5">조직 내 역할</span>
          <select className={inputClass} value={role} onChange={e => setRole(e.target.value as OrganizationAssigneeRole)}>
            {roleOptions.map(r => (
              <option key={r.role} value={r.role}>{r.label}</option>
            ))}
          </select>
        </label>

        {role === 'other' && (
          <label className="block">
            <span className="block text-xs font-semibold text-gray-500 mb-1.5">역할 이름</span>
            <input
              className={inputClass}
              value={roleLabelCustom}
              onChange={e => setRoleLabelCustom(e.target.value)}
              placeholder="예: 찬양인도"
            />
          </label>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setIsPrimary(v => !v)}
            className={`h-[48px] rounded-xl text-sm font-semibold border touch-target ${
              isPrimary ? 'bg-primary-50 text-primary-700 border-primary-200' : 'bg-gray-50 text-gray-600 border-gray-200'
            }`}
          >
            {isPrimary ? '주 담당자' : '주 담당자 아님'}
          </button>
          <button
            type="button"
            onClick={() => setIsActive(v => !v)}
            className={`h-[48px] rounded-xl text-sm font-semibold border touch-target ${
              isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'
            }`}
          >
            {isActive ? '활성' : '비활성'}
          </button>
        </div>

        <div>
          <h4 className="text-[15px] font-bold text-gray-900 mb-1">담당자 권한</h4>
          <p className="text-[12px] text-gray-500 mb-3">
            역할 기본값이 선택되어 있습니다. 저장 전에 추가·해제할 수 있습니다.
          </p>
          <div className="space-y-4">
            {groups.map(([group, defs]) => (
              <div key={group}>
                <p className="text-xs font-bold text-gray-500 mb-2">{group}</p>
                <div className="space-y-1.5">
                  {defs.map(def => {
                    const on = perms.includes(def.code);
                    return (
                      <label
                        key={def.code}
                        className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer touch-target min-h-[48px]"
                      >
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() => togglePerm(def.code)}
                          className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm font-medium text-gray-900">{def.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-gray-100 flex gap-2 bg-white">
        <ChurchButton variant="outline" icon={<X size={18} />} onClick={onClose} className="flex-1">
          취소
        </ChurchButton>
        <ChurchButton icon={<Save size={18} />} onClick={handleSave} className="flex-1">
          저장
        </ChurchButton>
      </div>
    </div>
  );
}

export function OrgAssigneeEditor({
  open, organizationId, person, existing, onClose, onSaved,
}: Props) {
  const { isMobile } = useBreakpoint();
  if (!open || (!person && !existing)) return null;

  const title = existing ? '담당자 권한 설정' : '담당자 등록';
  const description = existing
    ? '이 조직에서 사용할 권한을 설정하세요.'
    : '조직 내 역할과 담당자 권한을 설정하세요.';

  if (isMobile) {
    return (
      <MobileFullScreenPage title={title} description={description} onBack={onClose}>
        <div className="-mx-6 -my-6 bg-white">
          <EditorForm
            key={existing?.id ?? person?.userId ?? 'new'}
            organizationId={organizationId}
            person={person}
            existing={existing}
            onClose={onClose}
            onSaved={onSaved}
          />
        </div>
      </MobileFullScreenPage>
    );
  }

  return (
    <div className="fixed inset-0 z-popover flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="닫기" onClick={onClose} />
      <div
        className="relative w-full max-w-lg bg-white rounded-[20px] shadow-overlay overflow-hidden flex flex-col min-h-0"
        style={{ maxHeight: '90vh' }}
      >
        <div className="px-5 py-4 border-b border-gray-100 shrink-0">
          <h3 className="text-[17px] font-bold text-gray-900">{title}</h3>
          <p className="text-[13px] text-gray-500 mt-0.5">{description}</p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          <EditorForm
            key={existing?.id ?? person?.userId ?? 'new'}
            organizationId={organizationId}
            person={person}
            existing={existing}
            onClose={onClose}
            onSaved={onSaved}
          />
        </div>
      </div>
    </div>
  );
}

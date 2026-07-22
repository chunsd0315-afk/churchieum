/**
 * 교회이음 조직관리 — 확장 가능한 조직 모델
 * (성도·공지·은혜기록·일정 등과 연결될 기준 구조)
 */

/** 조직 종류 코드 (관리자가 추가 가능) */
export type OrgTypeCode = string;

export type Organization = {
  id: string;
  name: string;
  code: string;
  type: OrgTypeCode;
  parentId: string | null;
  description: string;
  sortOrder: number;
  isActive: boolean;
  legacyKind?: 'district' | 'zone' | 'department' | null;
  createdAt: string;
  updatedAt: string;
};

export type OrgTypeDef = {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  isSystem?: boolean;
};

/** 교회 직분 (조직과 별도) */
export type ChurchRole = {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  isSystem?: boolean;
};

/** 조직 소속 (다중 소속 가능) */
export type OrganizationMember = {
  id: string;
  organizationId: string;
  memberId: string;
  memberName: string;
  roleId: string;
  roleLabel: string;
  createdAt: string;
};

/** @deprecated 레거시 담당자 — org_leaders_v1 호환용. 신규는 OrganizationAssignee 사용 */
export type OrganizationLeader = {
  id: string;
  organizationId: string;
  memberId: string;
  memberName: string;
  leaderType: string;
  createdAt: string;
};

/** @deprecated 조직 단위 권한 — UI에서 사용하지 않음. 키는 유지 */
export type OrgPermissionCode =
  | 'notice:write'
  | 'notice:view'
  | 'grace:view'
  | 'grace:write'
  | 'event:write'
  | 'event:view'
  | 'album:write'
  | 'sermon:write'
  | 'prayer:write'
  | 'treasury:view'
  | 'stats:view';

/** @deprecated 조직 단위 권한 행 */
export type OrganizationPermission = {
  id: string;
  organizationId: string;
  permissionCode: OrgPermissionCode;
  enabled: boolean;
};

// ─── 담당자(개인) 권한 모델 ───────────────────────────────────────────────────

export type OrganizationAssigneeType = 'pastor' | 'member';

export type OrganizationAssigneeRole =
  | 'senior_pastor'
  | 'pastor'
  | 'evangelist'
  | 'elder'
  | 'department_head'
  | 'president'
  | 'secretary_general'
  | 'treasurer'
  | 'clerk'
  | 'leader'
  | 'assistant_leader'
  | 'teacher'
  | 'other';

/** 담당자 개인에게 부여하는 권한 코드 (조직+사용자 단위) */
export type AssigneePermissionCode =
  | 'org:view'
  | 'org:edit'
  | 'members:view'
  | 'members:manage'
  | 'assignees:manage'
  | 'notice:view'
  | 'notice:write'
  | 'notice:edit'
  | 'notice:delete'
  | 'event:view'
  | 'event:write'
  | 'event:edit'
  | 'event:delete'
  | 'album:view'
  | 'album:write'
  | 'album:edit'
  | 'album:delete'
  | 'grace:org_view'
  | 'grace:member_view'
  | 'prayer:view'
  | 'prayer:manage'
  | 'attendance:view'
  | 'attendance:manage'
  | 'treasury:view'
  | 'treasury:manage';

export type OrganizationAssignee = {
  id: string;
  organizationId: string;
  userId: string;
  /** 표시용 캐시 (목록 성능) */
  userName: string;
  /** 직책/직분 표시용 캐시 */
  titleLabel: string;
  assigneeType: OrganizationAssigneeType;
  role: OrganizationAssigneeRole;
  roleLabel?: string;
  isPrimary: boolean;
  isActive: boolean;
  permissionCodes: AssigneePermissionCode[];
  createdAt: string;
  updatedAt: string;
};

/** 담당자 선택 목록용 사람 후보 */
export type OrgPersonCandidate = {
  userId: string;
  name: string;
  assigneeType: OrganizationAssigneeType;
  /** 교역자 직책 또는 성도 직분 */
  titleLabel: string;
  /** 소속 요약 */
  orgSummary: string;
  email?: string;
  profileImage?: string;
};

export type OrgShareScopeKind =
  | 'private'
  | 'pastor'
  | 'my_org'
  | 'parent_org'
  | 'child_org'
  | 'selected_org'
  | 'public';

export type OrgShareScope = {
  kind: OrgShareScopeKind;
  organizationIds?: string[];
};

export type OrgTreeNode = Organization & {
  children: OrgTreeNode[];
};

export const ASSIGNEE_PERMISSION_DEFS: {
  code: AssigneePermissionCode;
  label: string;
  group: string;
}[] = [
  { code: 'org:view', label: '조직 정보 보기', group: '기본 관리' },
  { code: 'org:edit', label: '조직 정보 수정', group: '기본 관리' },
  { code: 'members:view', label: '소속 인원 보기', group: '기본 관리' },
  { code: 'members:manage', label: '소속 인원 관리', group: '기본 관리' },
  { code: 'assignees:manage', label: '담당자 관리', group: '기본 관리' },
  { code: 'notice:view', label: '공지 보기', group: '공지사항' },
  { code: 'notice:write', label: '공지 작성', group: '공지사항' },
  { code: 'notice:edit', label: '공지 수정', group: '공지사항' },
  { code: 'notice:delete', label: '공지 삭제', group: '공지사항' },
  { code: 'event:view', label: '일정 보기', group: '일정' },
  { code: 'event:write', label: '일정 작성', group: '일정' },
  { code: 'event:edit', label: '일정 수정', group: '일정' },
  { code: 'event:delete', label: '일정 삭제', group: '일정' },
  { code: 'album:view', label: '앨범 보기', group: '앨범' },
  { code: 'album:write', label: '사진 등록', group: '앨범' },
  { code: 'album:edit', label: '사진 수정', group: '앨범' },
  { code: 'album:delete', label: '사진 삭제', group: '앨범' },
  { code: 'grace:org_view', label: '담당 조직 은혜와 기도 보기', group: '은혜와 기도' },
  { code: 'grace:member_view', label: '담당 성도 은혜와 기도 보기', group: '은혜와 기도' },
  { code: 'prayer:view', label: '기도제목 보기', group: '기도' },
  { code: 'prayer:manage', label: '기도제목 관리', group: '기도' },
  { code: 'attendance:view', label: '출석 보기', group: '출석' },
  { code: 'attendance:manage', label: '출석 관리', group: '출석' },
  { code: 'treasury:view', label: '모임통장 보기', group: '회계' },
  { code: 'treasury:manage', label: '모임통장 관리', group: '회계' },
];

export const PASTOR_ASSIGNEE_ROLES: { role: OrganizationAssigneeRole; label: string }[] = [
  { role: 'senior_pastor', label: '담당목사' },
  { role: 'pastor', label: '담당교역자' },
  { role: 'evangelist', label: '담당전도사' },
];

export const MEMBER_ASSIGNEE_ROLES: { role: OrganizationAssigneeRole; label: string }[] = [
  { role: 'elder', label: '담당장로' },
  { role: 'department_head', label: '부장' },
  { role: 'president', label: '회장' },
  { role: 'secretary_general', label: '총무' },
  { role: 'treasurer', label: '회계' },
  { role: 'clerk', label: '서기' },
  { role: 'leader', label: '리더' },
  { role: 'assistant_leader', label: '부리더' },
  { role: 'teacher', label: '교사' },
  { role: 'other', label: '기타' },
];

const PASTOR_DEFAULT_PERMS: AssigneePermissionCode[] = [
  'org:view', 'members:view',
  'notice:view', 'notice:write',
  'event:view', 'event:write',
  'album:view',
  'grace:org_view', 'grace:member_view',
  'prayer:view',
  'attendance:view',
];

const MEMBER_DEFAULT_PERMS: AssigneePermissionCode[] = [
  'org:view', 'members:view',
  'notice:view', 'event:view', 'album:view',
];

/** 역할별 기본 권한 (저장 전 체크박스 초기값) */
export function defaultPermissionsForRole(
  assigneeType: OrganizationAssigneeType,
  role: OrganizationAssigneeRole,
): AssigneePermissionCode[] {
  if (assigneeType === 'pastor') {
    return [...PASTOR_DEFAULT_PERMS];
  }
  if (role === 'department_head' || role === 'president' || role === 'leader') {
    return [
      ...MEMBER_DEFAULT_PERMS,
      'notice:write', 'event:write', 'album:write', 'album:edit',
    ];
  }
  if (role === 'secretary_general' || role === 'clerk') {
    return [...MEMBER_DEFAULT_PERMS, 'notice:write', 'event:write'];
  }
  if (role === 'treasurer') {
    return [...MEMBER_DEFAULT_PERMS, 'treasury:view', 'treasury:manage'];
  }
  return [...MEMBER_DEFAULT_PERMS];
}

export function assigneeRoleLabel(
  role: OrganizationAssigneeRole,
  custom?: string,
): string {
  if (custom?.trim()) return custom.trim();
  const all = [...PASTOR_ASSIGNEE_ROLES, ...MEMBER_ASSIGNEE_ROLES];
  return all.find(r => r.role === role)?.label ?? '기타';
}

/** @deprecated */
export const DEFAULT_ORG_PERMISSION_CODES: {
  code: OrgPermissionCode;
  label: string;
  group: string;
}[] = [
  { code: 'notice:view', label: '공지 보기', group: '공지사항' },
  { code: 'notice:write', label: '공지 작성', group: '공지사항' },
  { code: 'grace:view', label: '은혜와 기도 보기', group: '은혜와 기도' },
  { code: 'grace:write', label: '은혜와 기도 작성', group: '은혜와 기도' },
  { code: 'event:view', label: '일정 보기', group: '일정' },
  { code: 'event:write', label: '일정 작성', group: '일정' },
  { code: 'album:write', label: '앨범 등록', group: '앨범' },
  { code: 'sermon:write', label: '설교 등록', group: '설교' },
  { code: 'prayer:write', label: '기도 등록', group: '기도' },
  { code: 'stats:view', label: '통계 보기', group: '통계' },
  { code: 'treasury:view', label: '모임통장 보기', group: '모임통장' },
];

/** @deprecated — 레거시 문자열 역할 */
export const DEFAULT_LEADER_TYPES = [
  '담당목사', '담당전도사', '담당장로', '부장', '총무', '회계', '리더', '부리더', '서기',
] as const;

export const ORG_SHARE_SCOPE_OPTIONS: { kind: OrgShareScopeKind; label: string }[] = [
  { kind: 'private', label: '나만 보기' },
  { kind: 'pastor', label: '담당 교역자' },
  { kind: 'my_org', label: '내 조직' },
  { kind: 'parent_org', label: '상위 조직' },
  { kind: 'child_org', label: '하위 조직' },
  { kind: 'selected_org', label: '선택 조직' },
  { kind: 'public', label: '전체 공개' },
];

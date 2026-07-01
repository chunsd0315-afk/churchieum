// ─── Visibility ─────────────────────────────────────────────────────────────

export type PrayerVisibility = 'private' | 'pastor_shared' | 'intercession';

export const VISIBILITY_LABELS: Record<PrayerVisibility, string> = {
  private: '작성자만 조회',
  pastor_shared: '작성자 + 담당 교역자',
  intercession: '작성자 + 중보기도 대상자',
};

export const VISIBILITY_DESCRIPTIONS: Record<PrayerVisibility, string> = {
  private: '나만 볼 수 있는 기도제목입니다.',
  pastor_shared: '작성자와 조직 범위의 담당 교역자만 볼 수 있습니다.',
  intercession: '작성자와 조직 범위의 중보기도 대상 성도만 볼 수 있습니다.',
};

// ─── Status ───────────────────────────────────────────────────────────────────

export type PrayerStatus = 'praying' | 'answered';

export const STATUS_LABELS: Record<PrayerStatus, string> = {
  praying: '기도 중',
  answered: '응답받음',
};

// ─── Attachment ───────────────────────────────────────────────────────────────

export type PrayerAttachmentType = 'image' | 'pdf' | 'document' | 'audio' | 'video';

export interface PrayerAttachment {
  id: string;
  name: string;
  type: PrayerAttachmentType;
  url: string;
  size: number;
  createdAt: string;
}

/** localStorage 저장용 — prayerId로 기도와 연결 */
export interface PrayerAttachmentRecord extends PrayerAttachment {
  prayerId: string;
}

export const ATTACHMENT_TYPE_LABELS: Record<PrayerAttachmentType, string> = {
  image: '사진',
  pdf: 'PDF',
  document: '문서',
  audio: '음성',
  video: '영상',
};

// ─── Comment ──────────────────────────────────────────────────────────────────

export interface PrayerComment {
  id: string;
  prayerId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

// ─── Notification ─────────────────────────────────────────────────────────────

export type PrayerNotificationType = 'pastor_shared' | 'intercession' | 'answered';

export interface PrayerNotification {
  id: string;
  prayerId: string;
  receiverId: string;
  type: PrayerNotificationType;
  read: boolean;
  createdAt: string;
}

// ─── History ──────────────────────────────────────────────────────────────────

export type PrayerHistoryAction =
  | 'created'
  | 'edited'
  | 'shared'
  | 'answered'
  | 'gratitude_testimony';

export interface PrayerHistory {
  id: string;
  prayerId: string;
  action: PrayerHistoryAction;
  actorId: string;
  actorName: string;
  createdAt: string;
  /** shared 기록 시 — 여정 라벨(교역자 공유 / 중보기도 나눔) */
  visibility?: PrayerVisibility;
  /** 감사 간증 본문 */
  testimonyContent?: string;
}

export const HISTORY_ACTION_LABELS: Record<PrayerHistoryAction, string> = {
  created: '등록',
  edited: '수정',
  shared: '나눔',
  answered: '응답',
  gratitude_testimony: '감사 간증',
};

// ─── Prayer ───────────────────────────────────────────────────────────────────

export interface PrayerOrganizationScope {
  districtIds: string[];
  groupIds: string[];
  departmentIds: string[];
}

/** Empty arrays = whole church */
export const CHURCH_WIDE_SCOPE: PrayerOrganizationScope = {
  districtIds: [],
  groupIds: [],
  departmentIds: [],
};

export type PrayerAuthorRole = 'member' | 'pastor' | 'admin';

export interface Prayer {
  /** PK */
  id: string;

  /** 교회 */
  churchId: string;

  /** 작성자 */
  authorId: string;
  authorName: string;
  authorRole: PrayerAuthorRole;

  /** 제목 */
  title: string;

  /** 내용 */
  content: string;

  /** 공개범위 */
  visibility: PrayerVisibility;

  /** 상태 */
  status: PrayerStatus;

  /** 조직 */
  organizationScope: PrayerOrganizationScope;

  /** 첨부 */
  attachments: PrayerAttachment[];

  /** 응답 */
  answeredAt?: string;
  answerContent?: string;

  /** 감사 간증 */
  gratitudeTestimony?: string;
  gratitudeTestimonyAt?: string;

  /** 즐겨찾기 */
  starred?: boolean;

  /** 삭제 */
  deleted?: boolean;

  /** 생성 */
  createdAt: string;
  updatedAt: string;
}

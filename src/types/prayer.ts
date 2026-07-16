// ─── Visibility ─────────────────────────────────────────────────────────────
// 은혜기록과 동일한 공통 VisibilityType 사용 (src/types/sharedContent.ts)

import type { VisibilityType } from './sharedContent';
import {
  VISIBILITY_LABELS as SHARED_VISIBILITY_LABELS,
  VISIBILITY_LABELS_PASTOR as SHARED_VISIBILITY_LABELS_PASTOR,
  VISIBILITY_DESCRIPTIONS as SHARED_VISIBILITY_DESCRIPTIONS,
  VISIBILITY_DESCRIPTIONS_PASTOR as SHARED_VISIBILITY_DESCRIPTIONS_PASTOR,
} from './sharedContent';

export type { VisibilityType };
export type PrayerVisibility = VisibilityType;

export const VISIBILITY_LABELS: Record<PrayerVisibility, string> = SHARED_VISIBILITY_LABELS;
export const VISIBILITY_LABELS_PASTOR: Record<PrayerVisibility, string> = SHARED_VISIBILITY_LABELS_PASTOR;
export const VISIBILITY_DESCRIPTIONS: Record<PrayerVisibility, string> = SHARED_VISIBILITY_DESCRIPTIONS;
export const VISIBILITY_DESCRIPTIONS_PASTOR: Record<PrayerVisibility, string> = SHARED_VISIBILITY_DESCRIPTIONS_PASTOR;

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

  /** 조직 — 레거시 호환용, sharedOrganizationIds에서 파생/동기화 */
  organizationScope: PrayerOrganizationScope;

  /** pastor_share — 공유 대상 교역자(clergy) ID */
  sharedPastorIds?: string[];

  /** organization_share — 공유 대상 조직(상위·하위·부서 통합) ID */
  sharedOrganizationIds?: string[];

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

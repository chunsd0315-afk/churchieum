// ─── Worship type (예배별 탭) ───────────────────────────────────────────────

export type WorshipType =
  | 'sunday'
  | 'wednesday'
  | 'friday'
  | 'dawn'
  | 'special'
  | 'other';

export const WORSHIP_TYPE_LABELS: Record<WorshipType, string> = {
  sunday: '주일예배',
  wednesday: '수요예배',
  friday: '금요기도회',
  dawn: '새벽기도회',
  special: '특별집회',
  other: '기타',
};

export const WORSHIP_TAB_TYPES: WorshipType[] = [
  'sunday',
  'wednesday',
  'friday',
  'dawn',
  'special',
];

// ─── Visibility & status ────────────────────────────────────────────────────

export type SermonVisibility = 'all' | 'admin' | 'pastor' | 'member';

export const SERMON_VISIBILITY_LABELS: Record<SermonVisibility, string> = {
  all: '전체 공개',
  member: '성도 공개',
  pastor: '교역자 공개',
  admin: '관리자만',
};

export type SermonStatus = 'draft' | 'published';

export const SERMON_STATUS_LABELS: Record<SermonStatus, string> = {
  draft: '임시저장',
  published: '등록',
};

// ─── Attachment ─────────────────────────────────────────────────────────────

export type SermonAttachmentType = 'pdf' | 'document' | 'image' | 'audio';

export interface SermonAttachment {
  id: string;
  name: string;
  type: SermonAttachmentType;
  url: string;
  size: number;
  createdAt: string;
}

// ─── Comment ────────────────────────────────────────────────────────────────

export interface SermonComment {
  id: string;
  sermonId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

// ─── Folder ─────────────────────────────────────────────────────────────────

export type SermonFolderType = 'year' | 'month' | 'worship';

export interface SermonFolder {
  id: string;
  name: string;
  order: number;
  isDefault: boolean;
  createdAt: string;
  type: SermonFolderType;
  parentId?: string;
  year?: number;
  month?: number;
  worshipType?: WorshipType;
}

// ─── Sermon ─────────────────────────────────────────────────────────────────

export interface Sermon {
  id: string;
  title: string;
  scripture: string;
  preacher: string;
  sermonDate: string;
  worshipType: WorshipType;
  folderId: string;
  folderName: string;
  videoUrl: string;
  youtubeVideoId: string | null;
  thumbnailUrl?: string;
  summary: string;
  tags: string[];
  attachments: SermonAttachment[];
  visibility: SermonVisibility;
  status: SermonStatus;
  viewCount: number;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
}

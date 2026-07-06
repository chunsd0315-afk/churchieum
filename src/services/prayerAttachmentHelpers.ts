import type { PrayerAttachment, PrayerAttachmentType } from '../types/prayer';

const VALID_TYPES: PrayerAttachmentType[] = ['image', 'pdf', 'document', 'audio', 'video'];

function attId() {
  return `att-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function isValidType(t: unknown): t is PrayerAttachmentType {
  return typeof t === 'string' && VALID_TYPES.includes(t as PrayerAttachmentType);
}

/** MIME / 확장자로 첨부 유형 추론 */
export function inferAttachmentType(mimeOrHint: string, fileName: string): PrayerAttachmentType {
  const mime = mimeOrHint.toLowerCase();
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';

  if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'].includes(ext)) {
    return 'image';
  }
  if (mime === 'application/pdf' || ext === 'pdf') return 'pdf';
  if (mime.startsWith('audio/') || ['mp3', 'wav', 'm4a', 'aac', 'ogg'].includes(ext)) return 'audio';
  if (mime.startsWith('video/') || ['mp4', 'mov', 'webm', 'avi'].includes(ext)) return 'video';
  return 'document';
}

/** 데모: File → blob URL 첨부 (localStorage 호환) */
export async function createPrayerAttachmentFromFile(file: File): Promise<PrayerAttachment> {
  const url = URL.createObjectURL(file);
  return {
    id: attId(),
    name: file.name,
    type: inferAttachmentType(file.type, file.name),
    url,
    size: file.size,
    createdAt: new Date().toISOString(),
  };
}

/** 이전 { data, size: string } 형식 마이그레이션 */
export function normalizePrayerAttachment(raw: unknown): PrayerAttachment | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;

  if (typeof o.name !== 'string') return null;
  const url = typeof o.url === 'string' ? o.url : typeof o.data === 'string' ? o.data : null;
  if (!url) return null;

  const size = typeof o.size === 'number' ? o.size : parseInt(String(o.size ?? '0'), 10) || 0;
  const type = isValidType(o.type)
    ? o.type
    : inferAttachmentType(String(o.type ?? ''), o.name);

  return {
    id: typeof o.id === 'string' ? o.id : attId(),
    name: o.name,
    type,
    url,
    size,
    createdAt: typeof o.createdAt === 'string' ? o.createdAt : new Date().toISOString(),
  };
}

export function formatAttachmentSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

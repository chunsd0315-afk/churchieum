import { getPrimaryDemoAccount, getPrimaryDemoAccountById } from '../config/demoAccounts';
import { getClergyByEmail, getClergyById } from './clergyData';
import {
  inferProfileRoleFromAuthorRole,
  resolveProfileImage,
  roleToProfileImageRole,
} from './profileImage';

const DEMO_EMAIL_BY_USER_ID: Record<string, string> = {
  'demo-pastor01': 'pastor01@churchieum.com',
  'demo-pastor02': 'pastor02@churchieum.com',
  'demo-member60': 'member60@demo.com',
};

export type GraceNoteAuthorDisplay = {
  name: string;
  position: string;
  /** "천성대 장로" */
  label: string;
  imageSrc: string;
  isUnknown: boolean;
};

/** YYYY.MM.DD — 잘못된 날짜는 빈 문자열 */
export function formatGraceNoteListDate(iso: string | undefined | null): string {
  if (iso == null || iso === '') return '';
  const raw = String(iso).trim();
  const prefix = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (prefix) return `${prefix[1]}.${prefix[2]}.${prefix[3]}`;

  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

/** 이름에 직분이 이미 있으면 중복 부착 방지 */
export function combineNameAndPosition(name: string, position: string): string {
  const n = name.trim().replace(/\s+/g, ' ');
  const p = position.trim();
  if (!n) return p || '알 수 없는 작성자';
  if (!p) return n;
  if (n === p) return n;
  if (n.endsWith(` ${p}`) || n.endsWith(p)) return n;
  const tokens = n.split(/\s+/);
  if (tokens[tokens.length - 1] === p) return n;
  return `${n} ${p}`;
}

function lookupAuthorFromStores(userId?: string): { name: string; position: string } | null {
  if (!userId) return null;

  const demoAcc = getPrimaryDemoAccountById(userId);
  if (demoAcc) return { name: demoAcc.name, position: demoAcc.position };

  const clergy = getClergyById(userId);
  if (clergy) return { name: clergy.name, position: clergy.position };

  const demoEmail = DEMO_EMAIL_BY_USER_ID[userId];
  if (demoEmail) {
    const byEmail = getClergyByEmail(demoEmail);
    if (byEmail) return { name: byEmail.name, position: byEmail.position };
    const acc = getPrimaryDemoAccount(demoEmail);
    if (acc) return { name: acc.name, position: acc.position };
  }

  try {
    const raw = localStorage.getItem('churchieum_demo_generated_v2');
    if (!raw) return null;
    const data = JSON.parse(raw) as {
      members?: Array<{ id?: string; email?: string; name?: string; position?: string }>;
    };
    const member = data.members?.find(m =>
      m.id === userId
      || (userId === 'demo-member60' && (m.id === 'member-60' || m.email?.toLowerCase() === 'member60@demo.com')),
    );
    if (member?.name) {
      return { name: member.name, position: member.position?.trim() || '성도' };
    }
  } catch {
    /* ignore */
  }

  return null;
}

/** userId 우선 — snapshot authorName은 fallback */
export function resolveGraceNoteAuthorDisplay(note: {
  userId?: string;
  authorName?: string;
  authorRole?: string;
}): GraceNoteAuthorDisplay {
  const fromStore = lookupAuthorFromStores(note.userId);
  const snapshotName = note.authorName?.trim();
  const snapshotRole = note.authorRole?.trim();

  let name: string;
  let position: string;
  let isUnknown = false;

  if (fromStore) {
    name = fromStore.name;
    position = fromStore.position;
  } else if (snapshotName) {
    name = snapshotName;
    position = snapshotRole ?? '';
  } else {
    name = '알 수 없는 작성자';
    position = '';
    isUnknown = true;
  }

  const label = isUnknown ? name : combineNameAndPosition(name, position);

  const demo = note.userId ? getPrimaryDemoAccountById(note.userId) : undefined;
  const profileRole = demo
    ? roleToProfileImageRole(demo.role)
    : inferProfileRoleFromAuthorRole(position || note.authorRole);

  return {
    name,
    position,
    label,
    isUnknown,
    imageSrc: resolveProfileImage({ userId: note.userId, role: profileRole }),
  };
}

/** 목록·상세 공통 작성자 줄 — "작성자 : {이름} {직분} · {날짜}" */
export function formatGraceNoteAuthorLine(note: {
  userId?: string;
  authorName?: string;
  authorRole?: string;
  createdAt: string;
}): string {
  const author = resolveGraceNoteAuthorDisplay(note);
  const date = formatGraceNoteListDate(note.createdAt);
  return date ? `작성자 : ${author.label} · ${date}` : `작성자 : ${author.label}`;
}

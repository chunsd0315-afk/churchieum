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
};

export function formatGraceNoteListDate(iso: string): string {
  return iso.slice(0, 10).replace(/-/g, '.');
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
  const name = fromStore?.name ?? note.authorName?.trim() ?? '성도';
  const position = fromStore?.position ?? note.authorRole?.trim() ?? '';
  const label = position ? `${name} ${position}` : name;

  const demo = note.userId ? getPrimaryDemoAccountById(note.userId) : undefined;
  const profileRole = demo
    ? roleToProfileImageRole(demo.role)
    : inferProfileRoleFromAuthorRole(position || note.authorRole);

  return {
    name,
    position,
    label,
    imageSrc: resolveProfileImage({ userId: note.userId, role: profileRole }),
  };
}

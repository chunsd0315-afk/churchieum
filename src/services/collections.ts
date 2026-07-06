/**
 * Firestore collection TypeScript interfaces for ChurchIeum.
 * Each interface mirrors its Firestore document shape exactly.
 * Timestamps use Firestore Timestamp type — replace string with
 * import { Timestamp } from 'firebase/firestore' when going live.
 */

// ── churches ─────────────────────────────────────────────────────────────
export interface FireChurch {
  id?: string;
  name: string;
  denomination: string;
  address: string;
  district: string;
  pastor: string;
  phone?: string;
  email?: string;
  website?: string;
  youtube?: string;
  imageUrl?: string;
  verified: boolean;
  verifiedAt?: string;
  member_count: number;
  worship_times: { type: string; time: string }[];
  lat?: number;
  lng?: number;
  createdAt: string;
  updatedAt: string;
}

// ── users ─────────────────────────────────────────────────────────────────
export interface FireUser {
  id?: string;
  uid: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'member';
  churchId?: string;
  departmentId?: string;
  inviteCode?: string;
  profileImageUrl?: string;
  createdAt: string;
  lastLoginAt: string;
}

// ── notices ───────────────────────────────────────────────────────────────
export interface FireNotice {
  id?: string;
  churchId: string;
  title: string;
  content: string;
  category: 'general' | 'event' | 'family' | 'urgent';
  isPinned: boolean;
  authorId: string;
  authorName: string;
  viewCount: number;
  imageUrls?: string[];
  createdAt: string;
  updatedAt: string;
}

// ── sermons ───────────────────────────────────────────────────────────────
export interface FireSermon {
  id?: string;
  churchId: string;
  title: string;
  preacher: string;
  scripture: string;
  sermonDate: string;
  sermonType: 'sunday_main' | 'sunday_evening' | 'wednesday' | 'friday' | 'special';
  youtubeUrl?: string;
  audioUrl?: string;
  thumbnailUrl?: string;
  summary?: string;
  viewCount: number;
  createdAt: string;
}

// ── bulletins ─────────────────────────────────────────────────────────────
export interface FireBulletin {
  id?: string;
  churchId: string;
  title: string;
  bulletinDate: string;
  description?: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  viewCount: number;
  createdAt: string;
}

// ── albums ────────────────────────────────────────────────────────────────
export interface FireAlbum {
  id?: string;
  churchId: string;
  title: string;
  description?: string;
  eventDate: string;
  category: 'church' | 'district' | 'sunday_school';
  coverUrl?: string;
  photoCount: number;
  createdAt: string;
  // sub-collection: albums/{albumId}/photos
}

export interface FirePhoto {
  id?: string;
  albumId: string;
  url: string;
  caption?: string;
  uploadedBy: string;
  createdAt: string;
}

// ── prayers ───────────────────────────────────────────────────────────────
export interface FirePrayer {
  id?: string;
  churchId: string;
  authorId: string;
  authorName: string;
  title: string;
  content: string;
  category: 'personal' | 'intercession' | 'church' | 'mission';
  isPrivate: boolean;
  isAnswered: boolean;
  answeredAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ── biblePlans ────────────────────────────────────────────────────────────
export interface FireBiblePlan {
  id?: string;
  churchId: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  // sub-collection: biblePlans/{planId}/records
}

export interface FireBibleRecord {
  id?: string;
  planId: string;
  userId: string;
  date: string;
  book: string;
  startChapter: number;
  endChapter: number;
  note?: string;
  createdAt: string;
}

// ── attendance ────────────────────────────────────────────────────────────
export interface FireAttendance {
  id?: string;
  churchId: string;
  userId: string;
  memberName: string;
  date: string;
  worshipType: 'sunday_main' | 'sunday_evening' | 'wednesday' | 'friday' | 'special';
  isPresent: boolean;
  note?: string;
  recordedBy?: string;
  createdAt: string;
}

// ── invitations ───────────────────────────────────────────────────────────
export interface FireInvitation {
  id?: string;
  churchId: string;
  code: string;
  method: 'sms' | 'link' | 'qr';
  phone?: string;
  invitedBy: string;
  usedBy?: string;
  usedAt?: string;
  isUsed: boolean;
  expiresAt?: string;
  createdAt: string;
}

// ── qtEntries ─────────────────────────────────────────────────────────────
export interface FireQtEntry {
  id?: string;
  churchId: string;
  authorId: string;
  date: string;
  scripture: string;
  title?: string;
  content: string;
  isPublic: boolean;
  likeCount: number;
  createdAt: string;
}

// ── events ────────────────────────────────────────────────────────────────
export interface FireEvent {
  id?: string;
  churchId: string;
  title: string;
  description?: string;
  eventDate: string;
  eventTime?: string;
  location?: string;
  eventType: 'worship' | 'prayer' | 'meeting' | 'event';
  isAllDay: boolean;
  createdBy: string;
  createdAt: string;
}

// ── departments ───────────────────────────────────────────────────────────
export interface FireDepartment {
  id?: string;
  churchId: string;
  name: string;
  type: 'age' | 'district' | 'ministry';
  leaderId?: string;
  leaderName?: string;
  memberCount: number;
  description?: string;
  createdAt: string;
}

// ── visits ────────────────────────────────────────────────────────────────
export interface FireVisit {
  id?: string;
  churchId: string;
  memberId: string;
  memberName: string;
  visitedBy: string;
  visitDate: string;
  visitType: 'pastoral' | 'hospital' | 'home' | 'new_family';
  summary?: string;
  followUp?: string;
  createdAt: string;
}

/*
 * ── EXAMPLE SERVICE FUNCTIONS (uncomment after firebase package installed) ──
 *
 * import { db }           from './firebase';
 * import { COL, SUBCOL }  from './firebase';
 * import {
 *   collection, doc, getDocs, getDoc, addDoc,
 *   updateDoc, deleteDoc, query, where, orderBy, limit,
 *   serverTimestamp,
 * } from 'firebase/firestore';
 *
 * // Get all sermons for a church
 * export async function getSermons(churchId: string): Promise<FireSermon[]> {
 *   const q = query(
 *     collection(db, COL.SERMONS),
 *     where('churchId', '==', churchId),
 *     orderBy('sermonDate', 'desc'),
 *     limit(50)
 *   );
 *   const snap = await getDocs(q);
 *   return snap.docs.map(d => ({ id: d.id, ...d.data() } as FireSermon));
 * }
 *
 * // Add an attendance record
 * export async function recordAttendance(data: Omit<FireAttendance, 'id' | 'createdAt'>) {
 *   return addDoc(collection(db, COL.ATTENDANCE), {
 *     ...data,
 *     createdAt: serverTimestamp(),
 *   });
 * }
 *
 * // Validate an invitation code
 * export async function validateInviteCode(code: string) {
 *   const q = query(collection(db, COL.INVITATIONS), where('code', '==', code), where('isUsed', '==', false));
 *   const snap = await getDocs(q);
 *   return snap.empty ? null : ({ id: snap.docs[0].id, ...snap.docs[0].data() } as FireInvitation);
 * }
 */

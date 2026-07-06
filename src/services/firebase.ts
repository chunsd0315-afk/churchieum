/**
 * Firebase / Firestore connection structure for ChurchIeum.
 *
 * HOW TO ACTIVATE:
 *   1. npm install firebase
 *   2. Create a project at console.firebase.google.com
 *   3. Copy your web app config into FIREBASE_CONFIG below
 *   4. Remove the comment blocks and uncomment the live code
 *   5. Replace Supabase calls with the service functions in collections.ts
 */

// ── Firebase config template (fill in from Firebase Console) ──────────────
export const FIREBASE_CONFIG = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || '',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || '',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || '',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             || '',
};

// ── Firestore collection paths ────────────────────────────────────────────
export const COL = {
  CHURCHES:    'churches',
  USERS:       'users',
  NOTICES:     'notices',
  SERMONS:     'sermons',
  BULLETINS:   'bulletins',
  ALBUMS:      'albums',
  PRAYERS:     'prayers',
  BIBLE_PLANS: 'biblePlans',
  ATTENDANCE:  'attendance',
  INVITATIONS: 'invitations',
  QT:          'qtEntries',
  EVENTS:      'events',
  DEPARTMENTS: 'departments',
  VISITS:      'visits',
} as const;

// ── Sub-collection paths ──────────────────────────────────────────────────
export const SUBCOL = {
  PHOTOS:    'photos',
  COMMENTS:  'comments',
  REACTIONS: 'reactions',
  RECORDS:   'records',
} as const;

// ── Helper: build a document path ─────────────────────────────────────────
export function docPath(col: string, id: string) {
  return `${col}/${id}`;
}

// ── Helper: build a sub-collection path ───────────────────────────────────
export function subColPath(col: string, id: string, subCol: string) {
  return `${col}/${id}/${subCol}`;
}

/*
 * ── LIVE INITIALIZATION (uncomment after installing firebase package) ──────
 *
 * import { initializeApp, getApps } from 'firebase/app';
 * import { getFirestore }            from 'firebase/firestore';
 * import { getAuth }                 from 'firebase/auth';
 * import { getStorage }              from 'firebase/storage';
 *
 * const app = getApps().length === 0
 *   ? initializeApp(FIREBASE_CONFIG)
 *   : getApps()[0];
 *
 * export const db      = getFirestore(app);
 * export const auth    = getAuth(app);
 * export const storage = getStorage(app);
 */

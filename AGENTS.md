# AGENTS.md — Churchieum Development Guide

This document is the **development guide for AI agents** working on **Churchieum (교회이음)**.

**Version:** Churchieum 1.0 Beta  
**Slogan:** 교회를 잇고, 말씀을 잇고, 믿음을 잇다.

---

## Project Identity

| Item | Value |
|------|--------|
| Name | Churchieum / 교회이음 |
| Type | Faith community platform (not a simple church admin tool) |
| Stack | React 18, TypeScript, Vite, Tailwind CSS, Supabase (optional backend) |
| Entry | `src/main.tsx` → `src/App.tsx` |
| Rules | See also `.cursor/rules/churchieum.mdc` and `README.md` |

**교회이음** connects church and home, pastors and members, members with members, and current generation with the next — through **말씀, 기도, 교제, 섬김, 은혜**.

---

## App Philosophy

1. **Relationship over features** — technology serves communion, not bureaucracy.
2. **Word-centered** — bible, sermon, grace notes, and prayer are first-class.
3. **Warm, simple UX** — daily-use app, not enterprise software.
4. **Resilient demo mode** — the app must work without a backend for demos and Beta testing.
5. **Church language** — speak like a congregation, not a marketplace.

When in doubt, choose the change that keeps the app **usable, kind, and faithful to church context**.

---

## Main Roles

Roles are defined in `src/lib/permissions.ts` and `src/contexts/AuthContext.tsx`.

| Role | `UserRole` | Mode | Notes |
|------|------------|------|-------|
| **Admin** | `super_admin` | `admin` (+ member switch) | Full church management. `isAdmin === true`. |
| **Pastor** | `pastor` | `member` | Scoped pastoral tools inside member mode. `isPastor === true`. |
| **Member** | `member` | `member` | Faith life features only. |

**Demo accounts** (password `Church@2026`):

- Admin: `pastor01@churchieum.com`
- Pastor: `pastor02@churchieum.com`
- Member: `member60@demo.com`

**Never collapse roles** into one UI. Respect `canAccessAdmin`, `isPastor`, and scope helpers in `permissions.ts`.

---

## Routing Caution

Navigation is **state-based**, not React Router.

| State | Location | Values |
|-------|----------|--------|
| `mode` | `App.tsx` | `'select' \| 'member' \| 'admin'` |
| `memberPage` | `App.tsx` | `Page` type in `components/member/Layout.tsx` |
| `adminPage` | `App.tsx` | `AdminPage` type in `components/admin/Layout.tsx` |

### Rules

- **Never break existing routing** without an explicit migration plan.
- **Never remove pages** without user confirmation.
- Keep invite URL support: `?code=`, `?invite=`, `/invite/{code}`.
- All `useEffect` hooks in `AppContent` must run **before** any conditional early return (React rules of hooks).
- Pages are wrapped in `SafePage` (`ErrorBoundary`) — do not remove without replacement.

### Key files

- `src/App.tsx` — top-level routing and mode switching
- `src/components/member/Layout.tsx` — member nav + `Page` union
- `src/components/admin/Layout.tsx` — admin nav + `AdminPage` union

---

## UI/UX Rules

- **Prefer shared components:** `components/shared/`, `components/ui/`, `components/layout/`, `components/home/`.
- Reuse `AppLayout`, `PageHeaderBar`, `TabBar`, `PageLayout`, and home dashboard patterns.
- **Two `EmptyState` components exist:**
  - `components/ui/EmptyState.tsx` — `icon` as `ReactNode`, `action` as `{ label, onClick }`
  - `components/shared/EmptyState.tsx` — `icon` as `LucideIcon`, `action` as `ReactNode`
  - Match the correct API; do not mix them.
- **Desktop:** max content width **900px** unless the page needs full width (bible reader, wide tables).
- **Mobile:** simple **list/card** layout; avoid dense grids and deep nesting.
- Minimize diff scope — match existing naming, Tailwind patterns, and Korean copy style.
- Do not redesign UI unless explicitly asked.

---

## Accessibility Rules

Target users include **elderly pastors and members**.

- **Large fonts** — body text readable without zoom; headings clearly distinct.
- **Clear buttons** — one primary action per screen; generous padding and tap targets on mobile.
- **Simple words** — avoid IT jargon (e.g. prefer “공지” over “notification payload”).
- **Visual hierarchy** — important items first: 공지, 주보, 기도, 일정.
- Support both **mobile and desktop** (`useBreakpoint`, `AppLayout`).

---

## Data Persistence Rules

The app uses a **hybrid model**: localStorage demo data + optional Supabase.

### Principles

1. **localStorage keys must not be changed casually.** Renaming keys breaks existing user/demo data. If migration is required, add a read-old/write-new migration path.
2. **Always keep localStorage demo fallback working.**
3. **Supabase/Firebase failures must not break UI** — no throws on missing env at import time; catch API errors; show demo/empty states.
4. Demo auth (`AuthContext`) is **not** Supabase Auth. Backend RLS may block unauthenticated calls — pages must still render.

### Known localStorage keys

| Key | Purpose |
|-----|---------|
| `churchieum_demo_user` | Logged-in demo user (`AuthContext`) |
| `churchieum_demo_generated_v2` | Generated demo members/org |
| `clergy_v1` | Clergy records |
| `staff_assignments_v1` | Clergy assignments |
| `org_districts_v1` / `org_zones_v1` / `org_departments_v1` | Org structure |
| `org_settings_v1` | Org label settings |
| `church_announcements_v2` | Announcements |
| `churchieum_sermons` / `churchieum_sermon_folders` | Sermons |
| `churchieum_sharing_posts` / `_requests` / `_messages` | Church sharing |
| `graceNotesV2` | Grace notes (`graceNotesV1` legacy) |
| `savedVerses_v1` | Saved bible verses |
| `readingProgressV2` / `readingProgressesV3` / `activePlanId` | Bible reading plans |
| `bibleTranslationMode` | Bible translation preference |
| `recentReadings_v1` | Recent bible chapters |
| `churchieum_profile_img_{userId}` | Profile images |
| `qt_writings` | QT writings |
| `bible_progress` | Profile bible progress |

### sessionStorage

| Key | Purpose |
|-----|---------|
| `org_filter` | Admin member list filter (transient) |
| `org_filter_clergy` | Admin clergy list filter (transient) |

### Supabase

- Client: `src/lib/supabase.ts`
- Optional env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (`.env`, gitignored)
- `supabaseConfigured` flag indicates real credentials
- Migrations: `supabase/migrations/`

---

## Supabase / Firebase Fallback Rule

```text
Try backend → on failure or missing config → use localStorage / hardcoded demo data → never white screen
```

- Wrap async calls in `try/catch` or `.catch()`.
- Prayer, bulletin, events, and similar pages already use **DEMO_* fallbacks** — preserve this pattern.
- Never remove demo arrays or seed data when adding API integration.
- File uploads (`useFileUpload`) may fail without storage — show a clear message, do not crash.

---

## Church Language System

Do **not** use marketplace/commerce tone.

### Required replacements

| Avoid | Use |
|-------|-----|
| 거래하기 | 함께 나누기 |
| 판매자 | 나눔교회 |
| 구매자 | 신청교회 |
| 판매완료 | 나눔완료 |
| 후기 | 감사나눔 |

### Preferred vocabulary

**나눔, 섬김, 교제, 기도, 은혜** — not **거래, 판매, 구매**.

Apply to UI labels, buttons, toasts, empty states, and agent-written copy.

---

## Feature Development Order

Work in this order unless the user directs otherwise:

1. **Render safety** — app loads, login works, no blank screen.
2. **Routing & roles** — `App.tsx` modes, admin/pastor/member separation intact.
3. **Shared layout & components** — fix once, benefit all pages.
4. **Member faith-life pages** — sermon, prayer, bible, grace notes, bulletin, announcements.
5. **Pastor-scoped features** — visibility, sharing, pastoral views in member mode.
6. **Admin management pages** — org, members, clergy, content management.
7. **Backend integration** — Supabase with localStorage fallback, never replacing demo path.
8. **Polish** — accessibility, copy, typecheck cleanup.

**Do not** add large new features while core pages are broken.

---

## Build & Test Instructions

### Commands

```bash
npm install        # first-time setup
npm run dev        # development server → http://localhost:5173
npm run build      # production build (required after important changes)
npm run preview    # preview production build
npm run typecheck  # TypeScript check (may have known errors in Beta)
npm run lint       # ESLint
```

### After important changes

1. Run **`npm run build`** — must succeed for shipping-quality changes.
2. Manually verify: login screen → demo login → home → prayer + bulletin pages.
3. Confirm no white screen without `.env`.
4. Keep changes minimal; do not commit `.env` or secrets.

### What “working” means in Beta

- Login or main app visible at `http://localhost:5173`
- Demo accounts functional without Supabase
- Backend optional; failures degrade gracefully
- No pages removed; routing unchanged unless explicitly requested

---

## Quick Reference — Project Layout

```text
src/
  App.tsx              # Routing hub
  contexts/            # Auth, org settings
  components/
    admin/             # Admin pages
    member/            # Member pages
    shared/            # Shared layouts & widgets
    ui/                # Design system
    home/              # Home dashboard
    sharing/           # Church sharing
  lib/                 # Storage, permissions, supabase
  data/                # Bible, grace notes, reading plans
  hooks/
supabase/migrations/   # DB schema
.cursor/rules/         # Cursor project rules
```

---

*Agents: read this file and `.cursor/rules/churchieum.mdc` before making changes. When unsure, preserve routing, roles, demo fallbacks, and church language.*

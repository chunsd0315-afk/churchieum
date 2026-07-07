# PROJECT_LOG — 교회이음 (Churchieum)

프로젝트 작업 기록입니다. 최신 작업이 위로 오도록 기록합니다.

---

## 2026-07-08 — Churchieum 1.0 UI 리팩터링 및 설교 기능 개선

- **커밋:** _대기 중_ (이번 세션 셸 응답 불가로 `npm run build` / `git commit` / `git push` 미실행 — 사용자 로컬에서 실행 필요)
- **브랜치:** `main`

### 오늘 완료한 작업

- **Churchieum 1.0 디자인 시스템 적용** — Primary `#2563EB` / Secondary(네이비블루) `#1D4ED8` / Neutral `#111827` / Background `#F8FAFC` 통일, 카드 radius 20px 토큰화.
- **전체 콘텐츠 폭 900px 통일** — 중앙 콘텐츠 웰(`PageContentWell` + 모바일 서브페이지 웰)을 `max-width:900px · margin:0 auto · padding 24/24/40`으로 표준화하여 모든 페이지에 일괄 적용.
- **설교 페이지 UI 개선** — 이중 웰(SermonShell 중복 max-width/padding) 제거로 목록·플레이어·검색·리스트·페이지네이션을 900px 기준 정렬.
- **예배 폴더(Tab) 개선** — `[< 고정버튼][스크롤 영역][> 고정버튼]` 3분할 레이아웃, 버튼/폴더명 겹침 해결, 스크롤 페이드, Primary pill 활성 탭.
- **플레이어 수정/삭제 기능** — 상단 고정 플레이어에 `✏️ 수정 / 🗑 삭제`(최고관리자 전용) 추가, `상세 >` 버튼 제거.
- **설교 리스트 수정/삭제 기능** — 각 카드에 공통 `SermonManageActions`(PC 텍스트+아이콘 / 모바일 아이콘) 추가, 삭제 시 이전/첫 설교 자동 선택.
- **최고관리자 권한 적용** — 설교 생성/수정/삭제·폴더 관리 `super_admin` 전용(capability 기반 `can()`), 교역자/성도는 조회·재생·검색·좋아요·저장·공유만.
- **모바일 Floating 등록 버튼(FAB)** — 오른쪽 하단 고정 캡슐 버튼(`MobileFab`), PC는 상단 등록 버튼 유지.
- **모바일 Full Screen 등록 화면** — `ContentEditorLayout`/`MobileEditorModal`/은혜기록 폼을 상·하단바 덮는 풀스크린(`z-300`) + `< 뒤로` 헤더로 통일.
- **등록/수정 페이지 900px 통일** — `ContentEditorLayout`(PC) 폭 `max-w-2xl`→`max-w-[900px]` + 웰 패딩 상쇄(`margin:-24/-24/-40`)로 목록과 동일 폭, `MobileEditorModal` PC 모달 `max-w-lg`→`max-w-[900px]`, 설교 폼 카드 `max-w-2xl` 제거.
- **공통 PageHeader 정리** — 메뉴명/설명을 공통 렌더러로 통일(제목 28px/700/#111827, 설명 15px/400/#64748B, 하단 여백 32px). PC 본문 표시, 모바일은 고정 App Header만 사용(본문 헤더 `hidden md:flex`).
- **공통 UI/UX 개선** — 입력 포커스/확인 다이얼로그/탭바 색상 토큰화, 홈·사이드바 아이콘 멀티블루 팔레트(성도/교역자/최고관리자 공통), 네이비 사이드바.
- **기타 디자인 리팩터링** — `ChurchInfoPage` 등 개별 폭 오버라이드 정리, 설교 카드 radius 20px 정합.

### 수정한 주요 파일

- `src/components/layout/AppLayout.tsx` (콘텐츠 웰 900px·패딩 24/24/40)
- `src/components/layout/ContentEditorLayout.tsx` (등록/수정 900px, 웰 패딩 상쇄, 풀스크린)
- `src/components/common/ui/PageLayout.tsx` (`PageHeaderBar` / `PageLayout` 헤더)
- `src/components/common/ui/ChurchPageHeader.tsx`
- `src/components/common/ui/MobileEditorModal.tsx` (PC 900px)
- `src/components/common/sermon/SermonApp.tsx` (탭/플레이어/리스트/수정·삭제/폼 폭)
- `src/components/common/sermon/SermonFolderTabs.tsx` (탭 3분할 레이아웃)
- `src/components/common/sermon/sermonDesign.tsx` (`SermonShell` 단순화, 카드 radius 20px)
- `src/components/layout/PCSidebar.tsx` / `PCTopHeader.tsx` / `MobileHeader.tsx` (네이비 사이드바·아이콘·색상)
- `src/components/common/home/homeMenuCatalog.ts` / `roleMenus.ts` (멀티블루 아이콘 팔레트)
- `src/components/member/Layout.tsx` / `admin/Layout.tsx` / `pastor/Layout.tsx` (모바일 App Header 메뉴명/설명)
- `src/pages/member/ChurchInfoPage.tsx` (폭 오버라이드 정리)
- `src/styles/index.css` (Secondary 블루/네이비 스케일, 카드 radius 20px)

### 다음 작업 예정

- 공지사항 기능 고도화
- 은혜기록 기능 고도화
- 일정 기능 고도화
- 기도 기능 고도화
- 앨범 기능 고도화
- 교회나눔 기능 고도화
- 관리자 기능 고도화

### 특이사항

- **셸 환경 응답 불가:** 이번 세션에서 모든 터미널 명령이 exit status를 반환하지 않아 `npm run build` / `git status` / `git commit` / `git push`를 실행하지 못함. 변경사항은 코드 정적 검토(임포트 정합성·JSX 균형·미사용 심볼 정리)로 확인. **사용자 로컬에서 아래 명령을 직접 실행 필요.**

```bash
npm run build
git add .
git commit -m "Churchieum 1.0 UI 리팩터링 및 설교 기능 개선"
git push
```

---

## 2026-07-08 — 모바일/PC UI 개선 및 설교 기능 업데이트

- **커밋:** `e38a9b7` (`9015a7a..e38a9b7`, branch `main`)
- **범위:** 15 files changed (+191 / −146)

### 오늘 완료한 기능

1. **PC/모바일 메뉴 페이지 상단 UI 정리**
   - PC: 각 메뉴 페이지 상단에 메뉴명 + 설명 표시 유지.
   - 모바일: 고정 상단바와 중복되던 본문 상단 메뉴명/설명 숨김 처리(`hidden md:block`).
   - 공통 헤더 컴포넌트(`PageHeaderBar`, `PageLayout` 헤더, `ChurchPageHeader`)에 반영.

2. **모바일 등록/작성 버튼 → 플로팅 버튼(FAB)**
   - 당근마켓 "+ 글쓰기" 스타일의 오른쪽 하단 고정 캡슐 버튼(`MobileFab`) 신설.
   - 하단 네비(72px) 위, `z-index: 250`, 파란 배경·흰 글씨·+ 아이콘·그림자, `md:hidden`.
   - 적용: 설교 등록, 은혜기록 작성, 공지사항 등록, 주보 등록, 일정 등록, 기도 작성, 앨범 등록, 교회나눔 작성.
   - PC는 기존 상단 등록 버튼 유지. 권한(canWrite/canCreate/canManage) 기반 노출 유지.

3. **모바일 등록/작성 화면 풀스크린 전환**
   - `ContentEditorLayout` 모바일 오버레이 `z-index`를 하단 네비(200) 위(300)로 올려 상/하단바 완전히 덮도록 수정, 헤더를 `< 뒤로  {메뉴명}` 로 통일.
   - 은혜기록 작성 화면(`GraceNoteFormView`, `SermonGraceFormView`)을 모바일에서 풀스크린 오버레이로 전환(PC는 기존 유지).
   - 성도 모달 3종(기도/앨범/일정)을 공통 셸 `MobileEditorModal`로 감싸 모바일 풀스크린 + PC 모달 카드로 통일.
   - 뒤로/저장 완료 시 이전 목록으로 복귀, 배경 흰색, 내부 스크롤만 동작.

### 수정한 주요 파일

- `src/components/common/ui/MobileFab.tsx` (신규)
- `src/components/common/ui/MobileEditorModal.tsx` (신규)
- `src/components/common/ui/MobileAddButton.tsx` (삭제)
- `src/components/common/ui/PageLayout.tsx`
- `src/components/common/ui/index.ts`
- `src/components/layout/ContentEditorLayout.tsx`
- `src/components/member/GraceNotesView.tsx`
- `src/components/common/sermon/SermonApp.tsx`
- `src/pages/member/PrayerPage.tsx`
- `src/pages/member/AlbumPage.tsx`
- `src/pages/member/SchedulePage.tsx`
- `src/pages/member/GraceNotesPage.tsx`
- `src/pages/admin/AnnouncementManagementPage.tsx`
- `src/pages/admin/AlbumManagementPage.tsx`
- `src/pages/shared/ChurchSharingPage.tsx`
- (이전 커밋 반영분) `src/components/common/ui/ChurchPageHeader.tsx`, `src/pages/admin/BulletinManagementPage.tsx`

### 다음 작업 예정

- 로컬 환경에서 `npm run build` / `npm run typecheck` 정상 통과 확인(이번 세션 셸 불안정으로 자동 검증 미완료).
- 모바일 실제 기기/좁은 폭(≤375px)에서 FAB·풀스크린 작성 화면 QA (하단 네비 가림, `< 뒤로` 복귀, 스크롤 락).
- 은혜기록 FAB 진입 흐름(통독/설교 은혜기록 선택) 재검토 — 현재는 설교 은혜기록 폼으로 바로 진입.
- 설교 댓글 기능(추후) 및 권한(RBAC) 서버 검증(Supabase RLS) 후속 점검.

### 특이사항

- **셸 환경 불안정:** 이번 세션에서 `npm run build`/`npm run typecheck`가 반복적으로 응답(exit status)을 반환하지 않아 자동 빌드 검증을 완료하지 못함. 변경사항은 코드 정적 검토(임포트 정합성·JSX 균형·미사용 import 정리)로 확인.
- Git 커밋/푸시는 정상 완료(푸시 성공 확인). PowerShell은 `&&` 미지원이라 `;` 체이닝 사용.
- 저장소가 OneDrive 경로에 있어 CRLF 경고 및 파일 동기화 지연 가능성 있음.

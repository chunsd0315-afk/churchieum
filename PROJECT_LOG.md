# PROJECT_LOG — 교회이음 (Churchieum)

프로젝트 작업 기록입니다. 최신 작업이 위로 오도록 기록합니다.

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

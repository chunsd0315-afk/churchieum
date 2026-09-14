/**
 * 2026-09-15 시연 전용 Preview 게이트 (이 브랜치에만 존재)
 * Asia/Seoul 2026-09-15 23:59:59 이후에는 앱 본문 대신 종료 화면을 표시합니다.
 * Production / main 에는 병합하지 마세요.
 *
 * 시연 종료 후 완전 비활성화:
 * 1) GitHub에서 preview-20260915 브랜치 삭제
 * 2) Vercel Dashboard → Deployments → 해당 Preview → Remove / Disable
 */

/** 시연 만료 시각 (KST) */
export const DEMO_PREVIEW_EXPIRES_ISO = '2026-09-15T23:59:59+09:00';

export const DEMO_PREVIEW_BRANCH = 'preview-20260915';

export function isDemoPreviewExpired(nowMs: number = Date.now()): boolean {
  const expires = Date.parse(DEMO_PREVIEW_EXPIRES_ISO);
  if (Number.isNaN(expires)) return false;
  return nowMs > expires;
}

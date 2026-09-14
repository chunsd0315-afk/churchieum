import { DEMO_PREVIEW_EXPIRES_ISO } from '../config/demoPreviewGate';

/** Preview 시연 기간 종료 후 표시 — Production 앱과 무관 */
export function DemoPreviewExpiredScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFDF7] px-6">
      <div className="max-w-md w-full text-center bg-white rounded-[24px] border border-[#ECECEC] shadow-sm p-8">
        <p className="text-sm font-semibold text-primary-700 mb-2">교회이음</p>
        <h1 className="text-xl font-bold text-gray-900 mb-3">오늘 시연이 종료되었습니다</h1>
        <p className="text-sm text-gray-600 leading-relaxed">
          이 Preview 링크는 2026년 9월 15일(Asia/Seoul)까지
          임시로 제공된 시연용 버전입니다.
        </p>
        <p className="text-xs text-gray-400 mt-4">
          만료: {DEMO_PREVIEW_EXPIRES_ISO}
        </p>
        <a
          href="https://churchieum.vercel.app/"
          className="mt-6 inline-flex items-center justify-center min-h-[48px] px-5 rounded-[18px] bg-primary-500 text-gray-900 font-bold text-sm"
        >
          공식 사이트 바로가기
        </a>
      </div>
    </div>
  );
}

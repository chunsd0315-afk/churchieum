import { useState, useCallback } from 'react';
import { Database, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { ChurchButton } from '../common/ui/ChurchButton';
import {
  runTestDataSeed,
  resetAllTestData,
  isTestDataSeeded,
  formatTestDataSeedReport,
  type TestDataSeedReport,
} from '../../services/testDataSeed';
import { useToast } from '../common/ui';

/**
 * 개발·데모용 테스트 데이터 생성 패널 (관리자 전용)
 */
export default function TestDataSeedPanel() {
  const toast = useToast();
  const [report, setReport] = useState<TestDataSeedReport | null>(null);
  const [busy, setBusy] = useState(false);
  const seeded = isTestDataSeeded();

  const handleSeed = useCallback(async (force: boolean) => {
    setBusy(true);
    try {
      const result = runTestDataSeed({ force });
      setReport(result);
      toast.success(
        result.alreadySeeded && !force
          ? '이미 테스트 데이터가 생성되어 있습니다.'
          : '테스트 데이터 생성이 완료되었습니다.',
      );
    } catch {
      toast.error('테스트 데이터 생성 중 오류가 발생했습니다.');
    } finally {
      setBusy(false);
    }
  }, [toast]);

  const handleReset = useCallback(async () => {
    if (!window.confirm('기존 테스트 데이터를 삭제하고 다시 생성합니다. 계속할까요?')) return;
    setBusy(true);
    try {
      const result = resetAllTestData();
      setReport(result);
      toast.success('테스트 데이터를 다시 생성했습니다.');
    } catch {
      toast.error('재생성 중 오류가 발생했습니다.');
    } finally {
      setBusy(false);
    }
  }, [toast]);

  if (!import.meta.env.DEV) return null;

  return (
    <section className="church-card p-5 mt-8 border border-dashed border-amber-200 bg-amber-50/40">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-card bg-amber-100 flex items-center justify-center shrink-0">
          <Database className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 text-base">테스트 데이터 생성</h3>
          <p className="text-sm text-gray-600 mt-1">
            은혜와 기도 300건 · 기도 300건을 등록된 성도·교역자 계정으로 생성합니다.
            localStorage 데모 데이터이며 실서비스와 분리됩니다.
          </p>
          {seeded && (
            <p className="text-sm text-emerald-700 mt-2 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              Seed 데이터가 적용되어 있습니다.
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <ChurchButton
          icon={<Database size={20} />}
          size="md"
          disabled={busy}
          onClick={() => handleSeed(false)}
        >
          테스트 데이터 생성
        </ChurchButton>
        <ChurchButton
          variant="outline"
          icon={<RefreshCw size={20} />}
          size="md"
          disabled={busy}
          onClick={handleReset}
        >
          덮어쓰기 재생성
        </ChurchButton>
      </div>

      {report && (
        <pre className="mt-4 p-4 bg-white rounded-card text-sm text-gray-700 whitespace-pre-wrap border border-gray-100">
          {formatTestDataSeedReport(report)}
        </pre>
      )}

      {!report && !seeded && (
        <p className="mt-3 text-sm text-gray-500 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          터미널에서 <code className="text-xs bg-white px-1 rounded">npm run seed</code> 로도 생성할 수 있습니다.
        </p>
      )}
    </section>
  );
}

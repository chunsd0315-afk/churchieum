import { BookOpen, List } from 'lucide-react';
import { PageHeaderBar, MobileFab } from '../common/ui';
import { GRACE_MENU_LABEL } from '../../services/graceNoteDisplay';
import { ChurchButton } from '../common/ui/ChurchButton';

type Props = {
  onViewRecords: () => void;
  onWrite: () => void;
};

/** 은혜와 기도 — 첫 화면 (내 기록 보기 + 작성 FAB) */
export function GraceNotesHomeView({ onViewRecords, onWrite }: Props) {
  return (
    <>
      <PageHeaderBar
        title={GRACE_MENU_LABEL}
        description="하나님의 은혜와 기도를 기록하고 함께 나눕니다."
      />
      <div className="pt-6 px-4 md:px-0 pb-28 md:pb-8">
        <div className="bg-white rounded-[20px] border border-gray-100 shadow-sm p-6 md:p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-7 h-7" />
          </div>
          <p className="text-[15px] text-gray-600 leading-relaxed">
            성경통독·설교·기도 기록을 한곳에서 작성하고
            <br className="hidden sm:inline" />
            {' '}내 기록과 공유받은 기록을 함께 확인할 수 있습니다.
          </p>
          <div className="mt-6 flex justify-center">
            <ChurchButton
              icon={<List size={20} />}
              size="md"
              variant="primary"
              onClick={onViewRecords}
            >
              내 기록 보기
            </ChurchButton>
          </div>
        </div>
      </div>
      <MobileFab label="작성" onClick={onWrite} />
    </>
  );
}

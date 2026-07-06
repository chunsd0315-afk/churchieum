import { Link } from 'lucide-react';
import MemberListTab from '../../components/admin/MemberListTab';
import { PageHeaderBar } from '../../components/common/ui';

type Props = { onNavigate?: (page: string) => void; initialFilter?: string };

export default function MemberManagementPage({ onNavigate: _onNavigate, initialFilter }: Props) {
  return (
    <div className="space-y-4 max-w-6xl pb-8">
      <PageHeaderBar title="성도관리" description="성도 정보와 소속을 관리합니다." />

      <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex items-start gap-2">
        <Link className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-700">성도 등록은 <strong>초대관리</strong>에서만 가능합니다. 상단 "성도 초대" 버튼을 이용하세요.</p>
      </div>

      <MemberListTab onOpenForm={() => {}} initialFilter={initialFilter} />
    </div>
  );
}

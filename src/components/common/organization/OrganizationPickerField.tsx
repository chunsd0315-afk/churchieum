/**
 * OrganizationPickerField — 선택된 조직을 칩으로 보여주고 조직트리 선택기를 여는 입력 필드
 * 초대관리·등록·공개범위 등 조직 선택이 필요한 화면에서 공통으로 사용한다.
 */
import { useMemo, useState } from 'react';
import { AlertTriangle, FolderTree, Plus, X } from 'lucide-react';
import { useOrganizationTree } from '../../../hooks/useOrganizationTree';
import { resolveOrganizationChips } from '../../../services/organizationSelection';
import { OrganizationPicker, type OrganizationPickerMode } from './OrganizationPicker';

export type OrganizationPickerFieldProps = {
  label?: string;
  hint?: string;
  value: string[];
  onChange: (organizationIds: string[]) => void;
  mode?: OrganizationPickerMode;
  /** 선택기 상단 제목 */
  pickerTitle?: string;
  pickerDescription?: string;
  emptyText?: string;
  allowedOrganizationIds?: Set<string> | null;
};

export function OrganizationPickerField({
  label,
  hint,
  value,
  onChange,
  mode = 'multiple',
  pickerTitle = '소속 선택',
  pickerDescription = '조직관리에 등록된 조직에서 선택합니다.',
  emptyText = '아직 선택한 조직이 없습니다.',
  allowedOrganizationIds,
}: OrganizationPickerFieldProps) {
  const [open, setOpen] = useState(false);
  const { organizations } = useOrganizationTree();

  const chips = useMemo(
    () => resolveOrganizationChips(value, organizations),
    [value, organizations],
  );
  const hasMissing = chips.some(c => c.missing);

  const remove = (organizationId: string) =>
    onChange(value.filter(id => id !== organizationId));

  return (
    <div className="space-y-2">
      {(label || hint) && (
        <div className="flex items-baseline gap-2 flex-wrap">
          {label && <p className="text-xs font-bold text-gray-600">{label}</p>}
          {hint && <p className="text-[11px] text-gray-400">{hint}</p>}
        </div>
      )}

      {chips.length === 0 ? (
        <p className="text-xs text-gray-400 px-1 py-2">{emptyText}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {chips.map(chip => (
            <span
              key={chip.organizationId}
              className={[
                'inline-flex items-center gap-1 pl-3 pr-1 py-1.5 rounded-full text-[12px] font-semibold border max-w-full',
                chip.missing
                  ? 'bg-gray-50 text-gray-500 border-gray-200'
                  : 'bg-[#FFF7D6] text-[#1A1A1A] border-[#FFCD00]',
              ].join(' ')}
            >
              {chip.missing
                ? <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                : <FolderTree className="w-3.5 h-3.5 text-[#B08900] shrink-0" />}
              <span className="truncate">{chip.pathLabel}</span>
              <button
                type="button"
                onClick={() => remove(chip.organizationId)}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-black/5 shrink-0"
                aria-label={`${chip.pathLabel} 삭제`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {hasMissing && (
        <p className="text-[11px] text-amber-600">
          조직관리에서 삭제된 조직이 있습니다. 새로운 조직으로 다시 선택해 주세요.
        </p>
      )}

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 min-h-[48px] px-4 rounded-[18px] border border-dashed border-[#FFCD00] bg-[#FFFDF7] text-[#1A1A1A] text-sm font-semibold hover:bg-[#FFF7D6]"
      >
        <Plus className="w-4 h-4" /> {label ? `${label} 선택` : '소속 선택'}
      </button>

      <OrganizationPicker
        open={open}
        onClose={() => setOpen(false)}
        value={value}
        onConfirm={onChange}
        mode={mode}
        title={pickerTitle}
        description={pickerDescription}
        allowedOrganizationIds={allowedOrganizationIds}
      />
    </div>
  );
}

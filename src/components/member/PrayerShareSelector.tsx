/**
 * 기도 작성 — 공개범위 (설교·성경통과 동일한 GracePrayerVisibilitySelector)
 */

import {
  GracePrayerVisibilitySelector,
  defaultVisibilityShareValue,
  visibilityShareToSaveFields,
  type VisibilityShareValue,
} from './GracePrayerVisibilitySelector';
import type { VisibilityType } from '../../types/sharedContent';
import { uniqueIds } from '../../services/graceNoteShareScope';

export type PrayerShareState = VisibilityShareValue;

export function defaultPrayerShareState(
  existing?: Partial<PrayerShareState>,
): PrayerShareState {
  return defaultVisibilityShareValue(existing);
}

export function PrayerShareSelector({
  value,
  onChange,
}: {
  value: PrayerShareState;
  onChange: (v: PrayerShareState) => void;
}) {
  return <GracePrayerVisibilitySelector value={value} onChange={onChange} />;
}

export function prayerShareToSaveFields(state: PrayerShareState) {
  return visibilityShareToSaveFields({
    visibility: state.visibility as VisibilityType,
    sharedPastorIds: uniqueIds(state.sharedPastorIds),
    sharedOrganizationIds: uniqueIds(state.sharedOrganizationIds),
  });
}

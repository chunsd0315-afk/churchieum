/**
 * 은혜와 기도 공개범위 — 공통 VisibilitySelector(personal) 래퍼
 * 기존 VisibilityShareValue API 유지
 */

import type { VisibilityType } from '../../types/sharedContent';
import type { SharedPastorSnapshot } from '../../data/graceNotes';
import {
  VisibilitySelector,
  visibilityValueToSaveFields,
  defaultContentVisibilityValue,
  type ContentVisibilityValue,
} from '../common/shared-content/VisibilitySelector';

export type VisibilityShareValue = {
  visibility: VisibilityType;
  sharedPastorIds: string[];
  sharedOrganizationIds: string[];
};

function toContent(value: VisibilityShareValue): ContentVisibilityValue {
  return {
    visibility: value.visibility,
    sharedPastorIds: value.sharedPastorIds,
    sharedOrganizationIds: value.sharedOrganizationIds,
  };
}

function fromContent(value: ContentVisibilityValue): VisibilityShareValue {
  const visibility =
    value.visibility === 'public' ? 'organization_share' : value.visibility;
  return {
    visibility: visibility as VisibilityType,
    sharedPastorIds: value.sharedPastorIds,
    sharedOrganizationIds: value.sharedOrganizationIds,
  };
}

export function defaultVisibilityShareValue(
  existing?: Partial<VisibilityShareValue> | null,
): VisibilityShareValue {
  const base = defaultContentVisibilityValue(
    existing
      ? {
          visibility: existing.visibility,
          sharedPastorIds: existing.sharedPastorIds,
          sharedOrganizationIds: existing.sharedOrganizationIds,
        }
      : null,
    'personal',
  );
  return fromContent(base);
}

export function visibilityShareToSaveFields(value: VisibilityShareValue) {
  const saved = visibilityValueToSaveFields(toContent(value));
  return {
    visibility: (saved.visibility === 'public' ? 'organization_share' : saved.visibility) as VisibilityType,
    sharedPastorIds: saved.sharedPastorIds,
    sharedOrganizationIds: saved.sharedOrganizationIds,
  };
}

export function GracePrayerVisibilitySelector({
  value,
  onChange,
  existingPastorSnapshots = [],
}: {
  value: VisibilityShareValue;
  onChange: (v: VisibilityShareValue) => void;
  existingPastorSnapshots?: SharedPastorSnapshot[];
}) {
  return (
    <VisibilitySelector
      preset="personal"
      value={toContent(value)}
      onChange={next => onChange(fromContent(next))}
      existingPastorSnapshots={existingPastorSnapshots}
    />
  );
}

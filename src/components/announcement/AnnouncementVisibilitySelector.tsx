/**
 * 공지사항 공개범위 — 공통 VisibilitySelector(broadcast) 래퍼
 */

import {
  VisibilitySelector,
  defaultContentVisibilityValue,
  type ContentVisibilityValue,
} from '../common/shared-content/VisibilitySelector';

export type AnnouncementVisibilityMode = 'all' | 'organization_share';

export type AnnouncementVisibilityValue = {
  mode: AnnouncementVisibilityMode;
  sharedOrganizationIds: string[];
};

function toContent(value: AnnouncementVisibilityValue): ContentVisibilityValue {
  return {
    visibility: value.mode === 'all' ? 'public' : 'organization_share',
    sharedPastorIds: [],
    sharedOrganizationIds: value.sharedOrganizationIds,
  };
}

function fromContent(value: ContentVisibilityValue): AnnouncementVisibilityValue {
  if (value.visibility === 'organization_share') {
    return {
      mode: 'organization_share',
      sharedOrganizationIds: value.sharedOrganizationIds,
    };
  }
  return { mode: 'all', sharedOrganizationIds: [] };
}

export function defaultAnnouncementVisibility(
  existing?: Partial<AnnouncementVisibilityValue> | null,
): AnnouncementVisibilityValue {
  if (existing?.mode === 'organization_share') {
    return fromContent(
      defaultContentVisibilityValue(
        {
          visibility: 'organization_share',
          sharedOrganizationIds: existing.sharedOrganizationIds,
        },
        'broadcast',
      ),
    );
  }
  return fromContent(defaultContentVisibilityValue({ visibility: 'public' }, 'broadcast'));
}

export function AnnouncementVisibilitySelector({
  value,
  onChange,
}: {
  value: AnnouncementVisibilityValue;
  onChange: (v: AnnouncementVisibilityValue) => void;
}) {
  return (
    <VisibilitySelector
      preset="broadcast"
      value={toContent(value)}
      onChange={next => onChange(fromContent(next))}
    />
  );
}

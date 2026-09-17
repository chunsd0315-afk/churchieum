/**
 * 공지사항 공개범위 — 공통 VisibilitySelector(broadcast) 래퍼
 * 전체 공개 / 조직과 공유 / (최고관리자) 교역자와 공유
 */

import {
  VisibilitySelector,
  defaultContentVisibilityValue,
  type ContentVisibilityValue,
} from '../common/shared-content/VisibilitySelector';

export type AnnouncementVisibilityMode = 'all' | 'organization_share' | 'pastor_share';

export type AnnouncementVisibilityValue = {
  mode: AnnouncementVisibilityMode;
  sharedOrganizationIds: string[];
  sharedPastorIds: string[];
};

function toContent(value: AnnouncementVisibilityValue): ContentVisibilityValue {
  if (value.mode === 'organization_share') {
    return {
      visibility: 'organization_share',
      sharedPastorIds: [],
      sharedOrganizationIds: value.sharedOrganizationIds,
    };
  }
  if (value.mode === 'pastor_share') {
    return {
      visibility: 'pastor_share',
      sharedPastorIds: value.sharedPastorIds,
      sharedOrganizationIds: [],
    };
  }
  return { visibility: 'public', sharedPastorIds: [], sharedOrganizationIds: [] };
}

function fromContent(value: ContentVisibilityValue): AnnouncementVisibilityValue {
  if (value.visibility === 'organization_share') {
    return {
      mode: 'organization_share',
      sharedOrganizationIds: value.sharedOrganizationIds,
      sharedPastorIds: [],
    };
  }
  if (value.visibility === 'pastor_share') {
    return {
      mode: 'pastor_share',
      sharedOrganizationIds: [],
      sharedPastorIds: value.sharedPastorIds,
    };
  }
  return { mode: 'all', sharedOrganizationIds: [], sharedPastorIds: [] };
}

/** 선택 대상이 필요한 공개범위인데 아직 선택이 없으면 false */
export function isAnnouncementVisibilityComplete(value: AnnouncementVisibilityValue): boolean {
  if (value.mode === 'organization_share') return value.sharedOrganizationIds.length > 0;
  if (value.mode === 'pastor_share') return value.sharedPastorIds.length > 0;
  return true;
}

export function defaultAnnouncementVisibility(
  existing?: Partial<AnnouncementVisibilityValue> | null,
): AnnouncementVisibilityValue {
  if (existing?.mode === 'organization_share' || existing?.mode === 'pastor_share') {
    return fromContent(
      defaultContentVisibilityValue(
        toContent({
          mode: existing.mode,
          sharedOrganizationIds: existing.sharedOrganizationIds ?? [],
          sharedPastorIds: existing.sharedPastorIds ?? [],
        }),
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
      allowPastorShare
      value={toContent(value)}
      onChange={next => onChange(fromContent(next))}
    />
  );
}

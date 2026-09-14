/**
 * 순복음성북교회 공식 정보 시드 (단일 원본)
 * 기준: https://seongbukch.org/
 * — 사용자 ID / 권한 / 스키마는 변경하지 않음
 */

import { DEMO_ACCOUNT_IDS, PRIMARY_DEMO_ACCOUNTS } from '../config/demoAccounts';

const admin = PRIMARY_DEMO_ACCOUNTS.find(a => a.key === 'admin')!;

export const CHURCH_PROFILE_SEED = {
  name: '순복음성북교회',
  denomination: '기독교대한하나님의성회 (순복음)',
  postalCode: '02737',
  address: '서울특별시 성북구 오패산로 89',
  phone: '02-940-0000~4',
  fax: '02-912-4893',
  website: 'https://seongbukch.org/',
  websiteLabel: 'seongbukch.org',
  /** 2026 표어 */
  motto: '열방을 복되게 하는 교회가 되자',
  introTitle: '순복음성북교회',
  intro: [
    '순복음성북교회는 복음과 말씀, 성령의 능력 안에서 성도들이 믿음으로 살아가며 세상 가운데 소망의 빛을 비추는 교회를 지향합니다.',
    '하나님의 말씀을 삶의 길과 빛으로 삼고, 성령의 지혜와 인도하심을 따라 예수 그리스도의 복음을 삶으로 살아내는 공동체를 세워갑니다.',
    '모든 성도가 믿음 안에서 꿈과 소망을 품고, 교회와 가정과 세상을 복되게 하는 하나님의 사람으로 세워지는 것을 소망합니다.',
  ].join('\n\n'),
  pastor: {
    userId: DEMO_ACCOUNT_IDS.admin,
    name: admin.name,
    position: admin.position,
    /** 표시용 — “정재명 담임목사” */
    displayName: `${admin.name} ${admin.position}`,
    titleLine: '순복음성북교회 담임목사',
    bio: [
      '정재명 담임목사는 말씀과 성령을 중심으로 복음의 능력이 성도의 삶과 교회를 통해 나타나는 목회를 지향합니다.',
      '교회가 세상 가운데 빛과 소망이 되고, 성도들이 하나님의 말씀을 따라 믿음으로 꿈꾸며 살아가는 공동체를 세워가고 있습니다.',
      '삶에 지치고 힘든 이들이 교회를 바라보며 다시 기도하고 새 힘을 얻을 수 있는 교회를 세워가는 것을 소망하며 성도들과 함께 말씀과 기도로 섬기고 있습니다.',
    ].join('\n\n'),
  },
  history: [
    { date: '2011.06.05', text: '정재명 담임목사 부임' },
    { date: '2016.10.23', text: '여의도순복음새성북성전 분리독립' },
    { date: '2023.03.03', text: '새성전 건축을 위한 비전예배 및 기공식' },
    { date: '2025.07.27', text: '순복음성북교회로 교회명 변경' },
    { date: '2025.12.24', text: '새 성전 입당예배' },
  ],
  worshipTimes: [
    { type: '주일 1부 예배', time: '오전 7:30', location: '본당' },
    { type: '주일 2부 예배', time: '오전 9:30', location: '본당' },
    { type: '주일 3부 예배', time: '오전 11:30', location: '본당' },
    { type: '주일 청년 예배', time: '오후 2:00', location: '청년부실' },
    { type: '수요 예배', time: '오전 11:00', location: '본당' },
    { type: '금요 철야 예배', time: '오후 10:00', location: '본당' },
    { type: '새벽 예배', time: '오전 5:30', location: '본당 (월–토)' },
  ],
  directions: {
    subway: '4호선 성신여대입구역 인근',
    bus: '오패산로 인근 정류장 이용',
    parking: '교회 주차장 이용 가능',
  },
  heroImageUrl:
    'https://images.pexels.com/photos/208216/pexels-photo-208216.jpeg?auto=compress&cs=tinysrgb&w=800',
} as const;

export type ChurchProfileSeed = typeof CHURCH_PROFILE_SEED;

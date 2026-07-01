const KEY = 'church_announcements_v2';

export type AttachFile = {
  name: string;
  size: string;
  type: string;
  data: string;
};

export type Announcement = {
  id: string;
  title: string;
  content: string;
  category: '일반공지' | '행사안내' | '가정통신문' | '기타';
  scope: 'all' | 'level1' | 'level2' | 'department';
  scopeId?: string;
  scopeName?: string;
  date: string;
  isPinned: boolean;
  isImportant: boolean;
  author: string;
  images: string[];
  files: AttachFile[];
  created_at: string;
};

const px = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop`;

const SEED: Announcement[] = [
  /* ── 교회공지 (10) ─────────────────────────────── */
  {
    id: 's1', title: '2026년 하반기 교회 일정 안내',
    content: '사랑하는 성도 여러분,\n\n2026년 하반기 주요 교회 일정을 안내해 드립니다.\n\n7월 - 여름 수련회\n8월 - 전교인 야외 예배\n9월 - 추수감사절 특별예배\n10월 - 문화 선교의 날\n11월 - 성도의 날 행사\n12월 - 성탄절 특별예배\n\n각 행사마다 성도님들의 적극적인 참여를 부탁드립니다.',
    category: '일반공지', scope: 'all',
    date: '2026-06-25', isPinned: true, isImportant: true, author: '관리자',
    images: [px(1105666)], files: [], created_at: '2026-06-25T09:00:00Z',
  },
  {
    id: 's2', title: '여름성경학교 안내',
    content: '2026년 여름성경학교를 안내해 드립니다.\n\n일시: 2026년 7월 20일(월) ~ 24일(금)\n대상: 유초등부 전원\n장소: 교회 본당 및 교육관\n주제: "하나님의 빛 안에서"\n\n자세한 일정은 교육부에 문의하여 주세요.',
    category: '행사안내', scope: 'all',
    date: '2026-06-22', isPinned: true, isImportant: true, author: '교육부',
    images: [px(3621344)], files: [], created_at: '2026-06-22T10:00:00Z',
  },
  {
    id: 's3', title: '추수감사절 행사 안내',
    content: '2026년 추수감사절 감사예배와 바자회를 안내해 드립니다.\n\n일시: 2026년 11월 22일(주일)\n장소: 교회 본당, 친교실\n\n바자회 출품 접수: 11월 15일까지\n모든 수익금은 지역 이웃 돕기에 사용됩니다.',
    category: '행사안내', scope: 'all',
    date: '2026-06-20', isPinned: false, isImportant: false, author: '봉사부',
    images: [px(2608516)], files: [], created_at: '2026-06-20T11:00:00Z',
  },
  {
    id: 's4', title: '성탄절 준비 안내',
    content: '성탄절 특별예배 준비를 안내해 드립니다.\n\n12월 24일(목) 저녁 8시 – 성탄 전야 예배\n12월 25일(금) 오전 11시 – 성탄절 특별예배\n\n찬양대 및 성극팀 연습은 12월 1일부터 시작됩니다. 참여를 원하시는 분은 사무실로 연락 주세요.',
    category: '행사안내', scope: 'all',
    date: '2026-06-18', isPinned: false, isImportant: false, author: '예배부',
    images: [px(3764537)], files: [], created_at: '2026-06-18T09:00:00Z',
  },
  {
    id: 's5', title: '부활절 예배 안내',
    content: '2027년 부활절 특별예배를 안내해 드립니다.\n\n일시: 2027년 4월 5일(주일) 오전 11시\n장소: 교회 본당\n주제: "살아나셨도다!"\n\n특별순서: 찬양대 특별찬양, 성극 공연',
    category: '행사안내', scope: 'all',
    date: '2026-06-15', isPinned: false, isImportant: false, author: '예배부',
    images: [px(1295138)], files: [], created_at: '2026-06-15T10:00:00Z',
  },
  {
    id: 's6', title: '선교 후원 안내',
    content: '해외 선교사 후원을 안내해 드립니다.\n\n이번 달 후원 대상: 몽골 선교사 김○○ 목사님 가정\n후원 계좌: ○○은행 123-456-789012 (교회명)\n\n선교지 현황과 기도 제목은 주보에 게재됩니다.',
    category: '일반공지', scope: 'all',
    date: '2026-06-12', isPinned: false, isImportant: false, author: '선교부',
    images: [], files: [], created_at: '2026-06-12T09:00:00Z',
  },
  {
    id: 's7', title: '교회 대청소 안내',
    content: '교회 대청소를 안내해 드립니다.\n\n일시: 2026년 7월 4일(토) 오전 9시\n장소: 교회 전체\n\n각 구역별로 담당 구역을 청소해 주세요. 청소 도구는 교회에 준비되어 있습니다.',
    category: '일반공지', scope: 'all',
    date: '2026-06-10', isPinned: false, isImportant: false, author: '관리부',
    images: [], files: [], created_at: '2026-06-10T09:00:00Z',
  },
  {
    id: 's8', title: '성경통독 캠페인 안내',
    content: '전교인 성경통독 캠페인을 안내해 드립니다.\n\n기간: 2026년 7월 1일 ~ 12월 31일 (6개월)\n목표: 신약 1독\n방법: 매일 2장씩 교회이음 앱으로 기록\n\n참여를 원하시면 교회이음 앱의 "성경통독" 메뉴를 이용해 주세요.',
    category: '일반공지', scope: 'all',
    date: '2026-06-08', isPinned: false, isImportant: false, author: '교육부',
    images: [px(1450082)], files: [], created_at: '2026-06-08T10:00:00Z',
  },
  {
    id: 's9', title: '교회이음 앱 안내',
    content: '교회이음 앱 사용 안내입니다.\n\n교회이음 앱에서는 다음 기능을 이용하실 수 있습니다.\n- 성경 읽기 및 통독 기록\n- 공지사항 확인\n- 주보 열람\n- 설교 영상 시청\n- QT 및 은혜기록\n\n앱 설치 방법은 교회 사무실로 문의해 주세요.',
    category: '일반공지', scope: 'all',
    date: '2026-06-05', isPinned: false, isImportant: false, author: '사무부',
    images: [], files: [], created_at: '2026-06-05T09:00:00Z',
  },
  {
    id: 's10', title: '주차 안내',
    content: '교회 주차 안내입니다.\n\n주일 예배 시간대에는 주차 공간이 부족할 수 있습니다.\n\n지하 1층 주차장: 120대\n지상 주차장: 50대\n\n교회 앞 이면도로 주차를 삼가 주시고, 가급적 대중교통을 이용해 주세요.',
    category: '일반공지', scope: 'all',
    date: '2026-06-02', isPinned: false, isImportant: false, author: '관리부',
    images: [], files: [], created_at: '2026-06-02T09:00:00Z',
  },

  /* ── 상위조직 (8) ──────────────────────────────── */
  {
    id: 's11', title: '1교구 모임 안내',
    content: '1교구 월례 모임을 안내해 드립니다.\n\n일시: 2026년 7월 5일(주일) 오후 2시\n장소: 친교실 A\n\n교구 내 새가족을 환영하는 시간이 준비되어 있습니다. 교구원 모두의 참석을 부탁드립니다.',
    category: '일반공지', scope: 'level1', scopeId: 'dist1', scopeName: '1교구',
    date: '2026-06-24', isPinned: false, isImportant: false, author: '1교구장',
    images: [px(3184338)], files: [], created_at: '2026-06-24T10:00:00Z',
  },
  {
    id: 's12', title: '2교구 월례회',
    content: '2교구 월례회를 안내해 드립니다.\n\n일시: 2026년 7월 6일(월) 오후 7시\n장소: 교육관 2층 세미나실\n\n이번 월례회에서는 교구 내 봉사 계획을 논의할 예정입니다.',
    category: '일반공지', scope: 'level1', scopeId: 'dist2', scopeName: '2교구',
    date: '2026-06-22', isPinned: false, isImportant: false, author: '2교구장',
    images: [], files: [], created_at: '2026-06-22T09:00:00Z',
  },
  {
    id: 's13', title: '수요예배 안내',
    content: '수요 저녁 예배를 안내해 드립니다.\n\n매주 수요일 오후 7시 30분\n본당에서 드리는 말씀과 기도의 시간입니다.\n\n이번 주 말씀: 로마서 8장 28절\n설교자: 담임목사님',
    category: '일반공지', scope: 'level1', scopeId: 'dist1', scopeName: '1교구',
    date: '2026-06-20', isPinned: false, isImportant: false, author: '예배부',
    images: [px(4039504)], files: [], created_at: '2026-06-20T09:00:00Z',
  },
  {
    id: 's14', title: '금요철야예배 안내',
    content: '금요 철야예배를 안내해 드립니다.\n\n매주 금요일 오후 9시 ~ 11시\n본당에서 찬양과 기도로 드리는 예배입니다.\n\n이번 주 특별순서: 전교인 합심기도',
    category: '일반공지', scope: 'level1', scopeId: 'dist2', scopeName: '2교구',
    date: '2026-06-18', isPinned: false, isImportant: false, author: '예배부',
    images: [], files: [], created_at: '2026-06-18T10:00:00Z',
  },
  {
    id: 's15', title: '새벽기도회 안내',
    content: '새벽기도회를 안내해 드립니다.\n\n매일 오전 5시 30분\n본당에서 드리는 새벽기도회입니다.\n\n이번 주 새벽기도 주제: "성령 충만"\n새벽기도에 함께 하시는 모든 분들을 환영합니다.',
    category: '일반공지', scope: 'level1', scopeId: 'dist3', scopeName: '3교구',
    date: '2026-06-15', isPinned: false, isImportant: false, author: '기도부',
    images: [], files: [], created_at: '2026-06-15T09:00:00Z',
  },
  {
    id: 's16', title: '교사 기도회 안내',
    content: '주일학교 교사 기도회를 안내해 드립니다.\n\n일시: 매월 첫째 주 토요일 오전 10시\n장소: 교육관 1층 기도실\n\n어린이 영혼을 위해 함께 기도하는 시간입니다. 교사 여러분의 참석을 부탁드립니다.',
    category: '일반공지', scope: 'level1', scopeId: 'dist1', scopeName: '1교구',
    date: '2026-06-12', isPinned: false, isImportant: false, author: '교육부',
    images: [px(3807571)], files: [], created_at: '2026-06-12T10:00:00Z',
  },
  {
    id: 's17', title: '안수집사회 모임',
    content: '안수집사회 정기 모임을 안내해 드립니다.\n\n일시: 2026년 7월 10일(금) 오후 7시\n장소: 교회 회의실\n\n이번 모임에서는 하반기 봉사 계획을 논의합니다.',
    category: '일반공지', scope: 'level1', scopeId: 'dist2', scopeName: '2교구',
    date: '2026-06-10', isPinned: false, isImportant: false, author: '안수집사회',
    images: [], files: [], created_at: '2026-06-10T09:00:00Z',
  },
  {
    id: 's18', title: '권사회 모임',
    content: '권사회 정기 모임을 안내해 드립니다.\n\n일시: 2026년 7월 8일(수) 오전 10시\n장소: 친교실 B\n\n이번 모임에서는 하반기 심방 계획과 봉사 활동을 논의합니다.',
    category: '일반공지', scope: 'level1', scopeId: 'dist3', scopeName: '3교구',
    date: '2026-06-08', isPinned: false, isImportant: false, author: '권사회',
    images: [], files: [], created_at: '2026-06-08T09:00:00Z',
  },

  /* ── 하위조직 (7) ──────────────────────────────── */
  {
    id: 's19', title: '3구역 심방 안내',
    content: '1교구 3구역 심방 일정을 안내해 드립니다.\n\n일시: 2026년 7월 11일(토) 오후 3시\n대상: 3구역 전체 가정\n\n심방 순서는 구역장을 통해 별도로 안내드립니다.',
    category: '일반공지', scope: 'level2', scopeId: 'zone13', scopeName: '1교구 · 3구역',
    date: '2026-06-23', isPinned: false, isImportant: false, author: '1교구 3구역장',
    images: [px(2774556)], files: [], created_at: '2026-06-23T10:00:00Z',
  },
  {
    id: 's20', title: '중보기도팀 안내',
    content: '2교구 1구역 중보기도팀 모임을 안내해 드립니다.\n\n매주 화요일 오전 10시 구역 모임 장소에서 모입니다.\n\n기도 제목이 있으신 분은 구역장에게 연락해 주세요.',
    category: '일반공지', scope: 'level2', scopeId: 'zone21', scopeName: '2교구 · 1구역',
    date: '2026-06-20', isPinned: false, isImportant: false, author: '2교구 1구역장',
    images: [], files: [], created_at: '2026-06-20T09:00:00Z',
  },
  {
    id: 's21', title: '세례교육 안내',
    content: '세례 교육을 안내해 드립니다.\n\n일시: 2026년 7월 12일 ~ 8월 2일 (4주)\n장소: 교육관 세미나실\n\n세례를 원하시는 분은 사무실에 등록해 주세요.\n세례식: 2026년 8월 9일 주일 예배 중',
    category: '일반공지', scope: 'level2', scopeId: 'zone12', scopeName: '1교구 · 2구역',
    date: '2026-06-18', isPinned: false, isImportant: true, author: '교역자',
    images: [px(1374488)], files: [], created_at: '2026-06-18T10:00:00Z',
  },
  {
    id: 's22', title: '새가족 교육 안내',
    content: '새가족 교육을 안내해 드립니다.\n\n일시: 매월 첫째 주일 오후 1시 30분\n장소: 교육관 1층 새가족실\n\n교회 등록 후 3개월 이내의 새가족 여러분의 참여를 부탁드립니다.',
    category: '일반공지', scope: 'level2', scopeId: 'zone31', scopeName: '3교구 · 1구역',
    date: '2026-06-15', isPinned: false, isImportant: false, author: '전도부',
    images: [], files: [], created_at: '2026-06-15T09:00:00Z',
  },
  {
    id: 's23', title: '헌아식 안내',
    content: '헌아식을 안내해 드립니다.\n\n일시: 2026년 7월 26일 주일 2부 예배\n장소: 교회 본당\n\n아이의 성장을 하나님께 감사하고 교회 공동체의 기도와 사랑 안에서 키우겠다는 결단을 드리는 예식입니다.\n\n신청: 사무실 또는 앱을 통해 등록해 주세요.',
    category: '행사안내', scope: 'level2', scopeId: 'zone22', scopeName: '2교구 · 2구역',
    date: '2026-06-12', isPinned: false, isImportant: false, author: '사무부',
    images: [], files: [], created_at: '2026-06-12T09:00:00Z',
  },
  {
    id: 's24', title: '장년부 성경공부',
    content: '1교구 3구역 장년부 성경공부 모임을 안내해 드립니다.\n\n매주 목요일 오전 10시\n구역 모임 장소에서 진행됩니다.\n\n이번 학기 교재: 로마서 (총 16주)\n처음 오시는 분도 환영합니다.',
    category: '일반공지', scope: 'level2', scopeId: 'zone13', scopeName: '1교구 · 3구역',
    date: '2026-06-08', isPinned: false, isImportant: false, author: '1교구 3구역장',
    images: [px(5708915)], files: [], created_at: '2026-06-08T10:00:00Z',
  },
  {
    id: 's25', title: '교회 음악회',
    content: '3교구 2구역 주관 작은 음악회를 안내해 드립니다.\n\n일시: 2026년 7월 18일(토) 오후 5시\n장소: 교회 본당\n입장: 무료\n\n구역 내 성도들의 재능으로 준비한 아름다운 저녁 음악회입니다.',
    category: '행사안내', scope: 'level2', scopeId: 'zone32', scopeName: '3교구 · 2구역',
    date: '2026-06-05', isPinned: false, isImportant: false, author: '3교구 2구역장',
    images: [px(6203518)], files: [], created_at: '2026-06-05T10:00:00Z',
  },

  /* ── 부서 (5) ─────────────────────────────────── */
  {
    id: 's26', title: '청년부 수련회 안내',
    content: '청년부 여름 수련회를 안내해 드립니다.\n\n일시: 2026년 7월 25일(토) ~ 27일(월) 2박 3일\n장소: 강원도 홍천 ○○수련원\n비용: 8만원 (식비 포함)\n\n신청 기간: 7월 10일까지\n담당자: 청년부 간사',
    category: '행사안내', scope: 'department', scopeId: 'dept_youth', scopeName: '청년부',
    date: '2026-06-24', isPinned: true, isImportant: true, author: '청년부 목사',
    images: [px(4107110)], files: [], created_at: '2026-06-24T10:00:00Z',
  },
  {
    id: 's27', title: '청년부 MT',
    content: '청년부 MT를 안내해 드립니다.\n\n일시: 2026년 8월 8일(토) ~ 9일(일) 1박 2일\n장소: 경기도 가평 ○○펜션\n비용: 5만원\n\n신청 마감: 7월 31일\n교제와 게임, 말씀의 시간이 준비되어 있습니다.',
    category: '행사안내', scope: 'department', scopeId: 'dept_youth', scopeName: '청년부',
    date: '2026-06-20', isPinned: false, isImportant: false, author: '청년부 간사',
    images: [px(8815468)], files: [], created_at: '2026-06-20T10:00:00Z',
  },
  {
    id: 's28', title: '찬양대 연습 안내',
    content: '찬양대 연습 일정을 안내해 드립니다.\n\n매주 토요일 오후 4시 ~ 6시\n본당에서 진행됩니다.\n\n이번 주 연습 곡목: "주 하나님 독생자 예수", "내게 강 같은 평화"\n\n새 단원을 모집합니다. 찬양 봉사에 관심 있으신 분은 연락 주세요.',
    category: '일반공지', scope: 'department', scopeId: 'dept_choir', scopeName: '찬양대',
    date: '2026-06-18', isPinned: false, isImportant: false, author: '찬양대 지휘자',
    images: [], files: [], created_at: '2026-06-18T09:00:00Z',
  },
  {
    id: 's29', title: '유초등부 부모설명회',
    content: '유초등부 2학기 부모설명회를 안내해 드립니다.\n\n일시: 2026년 7월 19일(주일) 오후 1시 30분\n장소: 유초등부 예배실\n\n2학기 교육 방향과 행사 일정을 안내드립니다. 학부모님의 많은 참석을 부탁드립니다.',
    category: '행사안내', scope: 'department', scopeId: 'dept_elem', scopeName: '유초등부',
    date: '2026-06-15', isPinned: false, isImportant: false, author: '유초등부 교역자',
    images: [px(3621344)], files: [], created_at: '2026-06-15T10:00:00Z',
  },
  {
    id: 's30', title: '중고등부 캠프 안내',
    content: '중고등부 여름 캠프를 안내해 드립니다.\n\n일시: 2026년 8월 3일(월) ~ 5일(수) 2박 3일\n장소: 충남 태안 ○○수양관\n비용: 청소년 6만원\n\n신청 마감: 7월 20일\n주제: "나는 누구인가 – 하나님 안에서 발견하는 정체성"',
    category: '행사안내', scope: 'department', scopeId: 'dept_teen', scopeName: '중고등부',
    date: '2026-06-10', isPinned: false, isImportant: false, author: '중고등부 교역자',
    images: [], files: [], created_at: '2026-06-10T10:00:00Z',
  },
];

function load(): Announcement[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Announcement[];
  } catch {}
  save(SEED);
  return SEED;
}

function save(list: Announcement[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    const slim = list.map(a => ({ ...a, images: [], files: [] }));
    localStorage.setItem(KEY, JSON.stringify(slim));
  }
}

export function getAllAnnouncements(): Announcement[] {
  return load().sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return b.date.localeCompare(a.date);
  });
}

export function addAnnouncement(data: Omit<Announcement, 'id' | 'created_at'>): Announcement {
  const list = load();
  const ann: Announcement = { ...data, id: `ann-${Date.now()}`, created_at: new Date().toISOString() };
  save([ann, ...list]);
  return ann;
}

export function updateAnnouncement(id: string, data: Omit<Announcement, 'id' | 'created_at'>): void {
  save(load().map(a => a.id === id ? { ...a, ...data } : a));
}

export function deleteAnnouncement(id: string): void {
  save(load().filter(a => a.id !== id));
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const ACCEPT_FILES = '.pdf,.hwp,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,image/*';

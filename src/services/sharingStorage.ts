const POSTS_KEY    = 'churchieum_sharing_posts';
const REQUESTS_KEY = 'churchieum_sharing_requests';
const MESSAGES_KEY = 'churchieum_sharing_messages';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SharingPost = {
  id: string;
  type: 'give' | 'need' | 'ministry' | 'resource' | 'event';
  category: string;
  title: string;
  content: string;
  churchId: string;
  churchName: string;
  writerId: string;
  writerName: string;
  writerRole: string;
  location: string;
  images: string[];
  files: string[];
  status: 'active' | 'reserved' | 'completed';
  createdAt: string;
  updatedAt: string;
};

export type SharingRequest = {
  id: string;
  postId: string;
  requesterChurchId: string;
  requesterChurchName: string;
  requesterId: string;
  requesterName: string;
  message: string;
  status: 'requested' | 'reviewing' | 'connected' | 'cancelled';
  createdAt: string;
};

export type SharingMessage = {
  id: string;
  postId: string;
  senderId: string;
  senderName: string;
  senderChurchName: string;
  message: string;
  createdAt: string;
};

// ─── Category maps ────────────────────────────────────────────────────────────

export const CATEGORIES: Record<SharingPost['type'], string[]> = {
  give:     ['의자', '책상', '악기', '방송장비', '컴퓨터', '냉난방기', '차량', '유아용품', '도서', '기타'],
  need:     ['의자', '책상', '악기', '방송장비', '컴퓨터', '냉난방기', '차량', '유아용품', '도서', '기타'],
  ministry: ['반주자', '찬양팀', '주일학교 교사', '강사', '디자인', '영상', '방송', '차량봉사', '기타'],
  resource: ['PPT', '주보', '포스터', '현수막', '성경공부자료', '성경학교자료', '행정서식', '기타'],
  event:    ['연합예배', '세미나', '수련회', '바자회', '집회', '기도회', '기타'],
};

export const TYPE_LABELS: Record<SharingPost['type'], string> = {
  give:     '나눔합니다',
  need:     '필요합니다',
  ministry: '사역도움',
  resource: '자료공유',
  event:    '행사초대',
};

export const STATUS_LABELS: Record<SharingPost['status'], string> = {
  active:    '나눔중',
  reserved:  '확인중',
  completed: '완료',
};

// ─── Seed data ────────────────────────────────────────────────────────────────

function makeSeed(): SharingPost[] {
  const now = new Date();
  const days = (n: number) => new Date(now.getTime() - n * 86400000).toISOString();
  const seed = (
    overrides: Partial<SharingPost> & Pick<SharingPost, 'type' | 'category' | 'title' | 'content' | 'churchName' | 'location'>
  ): SharingPost => ({
    id: 'seed_' + Math.random().toString(36).slice(2),
    churchId: 'demo',
    writerId: 'demo_writer',
    writerName: '김영수',
    writerRole: '담임목사',
    images: [],
    files: [],
    status: 'active',
    createdAt: days(Math.floor(Math.random() * 30)),
    updatedAt: days(Math.floor(Math.random() * 5)),
    ...overrides,
  });
  return [
    seed({ type: 'give',     category: '의자',       title: '의자 50개 무료 나눔합니다',              content: '예배당 의자 50개를 무료로 나눔합니다. 상태 양호하며 직접 가져가실 분만 연락주세요. 트럭 지참 부탁드립니다.',             churchName: '순복음성북교회', location: '서울 성북구' }),
    seed({ type: 'need',     category: '악기',       title: '전자피아노가 필요합니다',                 content: '교회 개척 후 예배를 위한 전자피아노가 필요합니다. 상태 무관하며 운반비는 저희가 부담하겠습니다.',                       churchName: '작은은혜교회',   location: '경기 고양시' }),
    seed({ type: 'resource', category: 'PPT',        title: '여름성경학교 PPT 자료 공유합니다',         content: '올해 직접 제작한 여름성경학교 PPT 자료 40여 컷을 공유합니다. 테마: 성경 속 영웅들. 자유롭게 사용하세요.',             churchName: '은혜교회',       location: '서울 강서구' }),
    seed({ type: 'ministry', category: '찬양팀',     title: '금요기도회 찬양팀 도움 드릴 수 있습니다', content: '저희 교회 찬양팀이 주변 교회 금요기도회 찬양을 도울 수 있습니다. 교통비만 부탁드립니다.',                          churchName: '찬양하는교회',   location: '경기 부천시' }),
    seed({ type: 'give',     category: '방송장비',   title: '방송장비 세트 나눔합니다',                content: '영상 스위처, 마이크, 케이블 등 방송 세트를 나눔합니다. 모두 정상 작동합니다. 직접 가져가실 분 우선입니다.',             churchName: '사랑교회',       location: '인천 남동구' }),
    seed({ type: 'ministry', category: '주일학교 교사', title: '유초등부 주일학교 교사 도움 요청합니다', content: '현재 유초등부 교사가 부족하여 도움을 요청드립니다. 한 달 1~2회 가능하신 분도 환영합니다.',                      churchName: '소망교회',       location: '서울 노원구' }),
    seed({ type: 'event',    category: '집회',       title: '연합 청년집회에 초대합니다',              content: '5개 교회 연합 청년집회입니다. 강사: 이성민 목사. 일시: 8월 15일 오후 2시. 등록 필요 없으며 모든 청년 환영합니다.', churchName: '열린교회',       location: '서울 마포구' }),
    seed({ type: 'resource', category: '주보',       title: '주보 템플릿 공유합니다',                  content: '한글 파일로 만든 주보 템플릿 10종을 공유합니다. 자유롭게 편집해서 사용하세요. 댓글로 이메일 남겨주시면 보내드립니다.', churchName: '새빛교회',       location: '부산 수영구' }),
    seed({ type: 'need',     category: '냉난방기',   title: '냉난방기가 필요합니다',                   content: '소형 교회인데 여름을 대비하여 에어컨이 절실합니다. 중고도 괜찮습니다. 설치비는 저희가 부담하겠습니다.',               churchName: '평안교회',       location: '경남 창원시' }),
    seed({ type: 'give',     category: '기타',       title: '헌금봉투 1,000장 나눔합니다',             content: '주문 후 사용하지 않은 헌금봉투 1,000장이 있습니다. 필요하신 교회에 무료로 드립니다.',                               churchName: '주님의교회',     location: '대구 달서구' }),
    seed({ type: 'resource', category: '포스터',     title: '수련회 포스터 자료를 공유합니다',          content: 'AI, PSD 파일로 된 수련회 포스터 원본 파일입니다. 교회명, 날짜 등은 직접 수정해서 사용하세요.',                        churchName: '다음세대교회',   location: '경기 수원시' }),
    seed({ type: 'give',     category: '방송장비',   title: '빔프로젝터 나눔 완료되었습니다',           content: '지난달 광고한 빔프로젝터 나눔이 완료되었습니다. 감사드립니다.',                                                        churchName: '믿음교회',       location: '서울 송파구', status: 'completed' }),
  ];
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }

// Posts
export function getAllPosts(): SharingPost[] {
  try {
    const raw = localStorage.getItem(POSTS_KEY);
    if (raw) return JSON.parse(raw) as SharingPost[];
    const seed = makeSeed();
    localStorage.setItem(POSTS_KEY, JSON.stringify(seed));
    return seed;
  } catch { return []; }
}

export function addPost(data: Omit<SharingPost, 'id' | 'createdAt' | 'updatedAt'>): SharingPost {
  const posts = getAllPosts();
  const post: SharingPost = { ...data, id: uid(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  posts.unshift(post);
  localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
  return post;
}

export function updatePost(id: string, data: Partial<SharingPost>): void {
  const posts = getAllPosts().map(p => p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p);
  localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
}

export function deletePost(id: string): void {
  localStorage.setItem(POSTS_KEY, JSON.stringify(getAllPosts().filter(p => p.id !== id)));
}

// Requests
export function getAllRequests(postId?: string): SharingRequest[] {
  try {
    const raw = localStorage.getItem(REQUESTS_KEY);
    const all = raw ? JSON.parse(raw) as SharingRequest[] : [];
    return postId ? all.filter(r => r.postId === postId) : all;
  } catch { return []; }
}

export function addRequest(data: Omit<SharingRequest, 'id' | 'createdAt'>): SharingRequest {
  const all = getAllRequests();
  const req: SharingRequest = { ...data, id: uid(), createdAt: new Date().toISOString() };
  all.unshift(req);
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(all));
  return req;
}

export function updateRequestStatus(id: string, status: SharingRequest['status']): void {
  const all = getAllRequests().map(r => r.id === id ? { ...r, status } : r);
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(all));
}

// Messages
export function getAllMessages(postId?: string): SharingMessage[] {
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    const all = raw ? JSON.parse(raw) as SharingMessage[] : [];
    return postId ? all.filter(m => m.postId === postId) : all;
  } catch { return []; }
}

export function addMessage(data: Omit<SharingMessage, 'id' | 'createdAt'>): SharingMessage {
  const all = getAllMessages();
  const msg: SharingMessage = { ...data, id: uid(), createdAt: new Date().toISOString() };
  all.unshift(msg);
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(all));
  return msg;
}

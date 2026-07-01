-- 부서 테이블
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 구역 테이블
CREATE TABLE districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 교인 정보 테이블
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  email VARCHAR(100),
  phone VARCHAR(20),
  birth_date DATE,
  gender VARCHAR(10),
  address TEXT,
  department_id UUID REFERENCES departments(id),
  district_id UUID REFERENCES districts(id),
  join_date DATE,
  baptism_date DATE,
  role VARCHAR(20) DEFAULT 'member',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 부서/구역 리더 업데이트
ALTER TABLE departments ADD COLUMN leader_id UUID REFERENCES members(id);
ALTER TABLE districts ADD COLUMN leader_id UUID REFERENCES members(id);

-- 설교 테이블
CREATE TABLE sermons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  bible_verse VARCHAR(100),
  content TEXT,
  audio_url TEXT,
  video_url TEXT,
  preacher VARCHAR(50) NOT NULL,
  sermon_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- QT 테이블
CREATE TABLE qt (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  bible_verse VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  meditation TEXT,
  prayer TEXT,
  qt_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 기도제목 테이블
CREATE TABLE prayers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  is_private BOOLEAN DEFAULT false,
  is_answered BOOLEAN DEFAULT false,
  answered_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 공지사항 테이블
CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES members(id),
  is_pinned BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 출석 테이블
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  worship_type VARCHAR(20) NOT NULL,
  attendance_date DATE NOT NULL,
  is_present BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(member_id, worship_type, attendance_date)
);

-- 사진앨범 테이블
CREATE TABLE albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(100) NOT NULL,
  description TEXT,
  event_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 사진 테이블
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  album_id UUID REFERENCES albums(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT,
  uploaded_by UUID REFERENCES members(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 심방 테이블
CREATE TABLE visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id UUID REFERENCES members(id),
  visited_member_id UUID REFERENCES members(id),
  visit_date DATE NOT NULL,
  purpose TEXT,
  notes TEXT,
  next_action TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 새가족 테이블
CREATE TABLE new_families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  contact_source VARCHAR(50),
  first_visit_date DATE,
  decision_date DATE,
  counselor_id UUID REFERENCES members(id),
  status VARCHAR(30) DEFAULT 'new',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 관리자 권한 테이블
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- RLS 활성화
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sermons ENABLE ROW LEVEL SECURITY;
ALTER TABLE qt ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayers ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE new_families ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- 멤버 RLS 정책
CREATE POLICY "select_members" ON members FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_members" ON members FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "update_own_member" ON members FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 부서 RLS 정책
CREATE POLICY "select_departments" ON departments FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_departments" ON departments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IN (SELECT user_id FROM admin_users));
CREATE POLICY "update_departments" ON departments FOR UPDATE
  TO authenticated USING (auth.uid() IN (SELECT user_id FROM admin_users));
CREATE POLICY "delete_departments" ON departments FOR DELETE
  TO authenticated USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- 구역 RLS 정책
CREATE POLICY "select_districts" ON districts FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_districts" ON districts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IN (SELECT user_id FROM admin_users));
CREATE POLICY "update_districts" ON districts FOR UPDATE
  TO authenticated USING (auth.uid() IN (SELECT user_id FROM admin_users));
CREATE POLICY "delete_districts" ON districts FOR DELETE
  TO authenticated USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- 설교 RLS 정책
CREATE POLICY "select_sermons" ON sermons FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_sermons" ON sermons FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IN (SELECT user_id FROM admin_users));
CREATE POLICY "update_sermons" ON sermons FOR UPDATE
  TO authenticated USING (auth.uid() IN (SELECT user_id FROM admin_users));
CREATE POLICY "delete_sermons" ON sermons FOR DELETE
  TO authenticated USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- QT RLS 정책
CREATE POLICY "select_qt" ON qt FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_qt" ON qt FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IN (SELECT user_id FROM admin_users));
CREATE POLICY "update_qt" ON qt FOR UPDATE
  TO authenticated USING (auth.uid() IN (SELECT user_id FROM admin_users));
CREATE POLICY "delete_qt" ON qt FOR DELETE
  TO authenticated USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- 기도제목 RLS 정책
CREATE POLICY "select_prayers" ON prayers FOR SELECT
  TO authenticated USING (is_private = false OR auth.uid() IN (SELECT user_id FROM members WHERE id = prayers.member_id));
CREATE POLICY "insert_prayers" ON prayers FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IN (SELECT user_id FROM members WHERE id = prayers.member_id));
CREATE POLICY "update_prayers" ON prayers FOR UPDATE
  TO authenticated USING (auth.uid() IN (SELECT user_id FROM members WHERE id = prayers.member_id));
CREATE POLICY "delete_prayers" ON prayers FOR DELETE
  TO authenticated USING (auth.uid() IN (SELECT user_id FROM members WHERE id = prayers.member_id));

-- 공지사항 RLS 정책
CREATE POLICY "select_announcements" ON announcements FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_announcements" ON announcements FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IN (SELECT user_id FROM admin_users));
CREATE POLICY "update_announcements" ON announcements FOR UPDATE
  TO authenticated USING (auth.uid() IN (SELECT user_id FROM admin_users));
CREATE POLICY "delete_announcements" ON announcements FOR DELETE
  TO authenticated USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- 출석 RLS 정책
CREATE POLICY "select_attendance" ON attendance FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_attendance" ON attendance FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IN (SELECT user_id FROM admin_users) OR auth.uid() IN (SELECT user_id FROM members WHERE id = attendance.member_id));
CREATE POLICY "update_attendance" ON attendance FOR UPDATE
  TO authenticated USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- 앨범 RLS 정책
CREATE POLICY "select_albums" ON albums FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_albums" ON albums FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IN (SELECT user_id FROM admin_users));
CREATE POLICY "update_albums" ON albums FOR UPDATE
  TO authenticated USING (auth.uid() IN (SELECT user_id FROM admin_users));
CREATE POLICY "delete_albums" ON albums FOR DELETE
  TO authenticated USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- 사진 RLS 정책
CREATE POLICY "select_photos" ON photos FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_photos" ON photos FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IN (SELECT user_id FROM admin_users));
CREATE POLICY "update_photos" ON photos FOR UPDATE
  TO authenticated USING (auth.uid() IN (SELECT user_id FROM admin_users));
CREATE POLICY "delete_photos" ON photos FOR DELETE
  TO authenticated USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- 심방 RLS 정책
CREATE POLICY "select_visits" ON visits FOR SELECT
  TO authenticated USING (auth.uid() IN (SELECT user_id FROM admin_users));
CREATE POLICY "insert_visits" ON visits FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IN (SELECT user_id FROM admin_users));
CREATE POLICY "update_visits" ON visits FOR UPDATE
  TO authenticated USING (auth.uid() IN (SELECT user_id FROM admin_users));
CREATE POLICY "delete_visits" ON visits FOR DELETE
  TO authenticated USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- 새가족 RLS 정책
CREATE POLICY "select_new_families" ON new_families FOR SELECT
  TO authenticated USING (auth.uid() IN (SELECT user_id FROM admin_users));
CREATE POLICY "insert_new_families" ON new_families FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IN (SELECT user_id FROM admin_users));
CREATE POLICY "update_new_families" ON new_families FOR UPDATE
  TO authenticated USING (auth.uid() IN (SELECT user_id FROM admin_users));
CREATE POLICY "delete_new_families" ON new_families FOR DELETE
  TO authenticated USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- 관리자 권한 RLS 정책
CREATE POLICY "select_admin_users" ON admin_users FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "insert_admin_users" ON admin_users FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IN (SELECT user_id FROM admin_users));
CREATE POLICY "delete_admin_users" ON admin_users FOR DELETE
  TO authenticated USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- 인덱스 생성
CREATE INDEX idx_members_user_id ON members(user_id);
CREATE INDEX idx_members_department ON members(department_id);
CREATE INDEX idx_members_district ON members(district_id);
CREATE INDEX idx_sermons_date ON sermons(sermon_date DESC);
CREATE INDEX idx_qt_date ON qt(qt_date DESC);
CREATE INDEX idx_prayers_member ON prayers(member_id);
CREATE INDEX idx_attendance_member_date ON attendance(member_id, attendance_date DESC);
CREATE INDEX idx_photos_album ON photos(album_id);

-- 샘플 부서 데이터 삽입
INSERT INTO departments (id, name, description) VALUES
  ('00000000-0000-0000-0000-000000000001', '장년부', '장년부'),
  ('00000000-0000-0000-0000-000000000002', '청년부', '청년부'),
  ('00000000-0000-0000-0000-000000000003', '고등부', '고등부'),
  ('00000000-0000-0000-0000-000000000004', '중등부', '중등부'),
  ('00000000-0000-0000-0000-000000000005', '초등부', '초등부');

-- 샘플 구역 데이터 삽입
INSERT INTO districts (id, name) VALUES
  ('00000000-0000-0000-0000-000000000011', '1구역'),
  ('00000000-0000-0000-0000-000000000012', '2구역'),
  ('00000000-0000-0000-0000-000000000013', '3구역'),
  ('00000000-0000-0000-0000-000000000014', '4구역'),
  ('00000000-0000-0000-0000-000000000015', '5구역');

-- 샘플 설교 데이터 삽입
INSERT INTO sermons (title, bible_verse, content, preacher, sermon_date) VALUES
  ('믿음의 출발', '히브리서 11:1', '믿음은 바라는 것들의 실체요 보지 못하는 것들의 증거입니다...', '담임목사', '2024-01-07'),
  ('사랑의 실천', '요한복음 13:34-35', '새 계명을 너희에게 주노니 서로 사랑하라...', '담임목사', '2024-01-14'),
  ('소망 중에 기뻐하라', '로마서 12:12', '소망 중에 즐거워하며 환난 중에 참으며 기도에 항상 힘쓰며...', '담임목사', '2024-01-21');

-- 샘플 QT 데이터 삽입
INSERT INTO qt (title, bible_verse, content, meditation, prayer, qt_date) VALUES
  ('주께 가까이', '야고보서 4:8', '하나님을 가까이 하라 그리하면 너희를 가까이 하시리라...', '하나님과의 친밀함은 나의 몫입니다.', '주님, 오늘 하루도 주님 가까이 머물게 하소서.', '2024-01-22'),
  ('감사의 삶', '데살로니가전서 5:18', '범사에 감사하라 이는 그리스도 예수 안에서 너희를 향하신 하나님의 뜻이니라', '감사는 선택이 아닌 하나님의 뜻입니다.', '주님, 모든 상황 속에서 감사하게 하소서.', '2024-01-21');

-- 샘플 공지사항 삽입
INSERT INTO announcements (title, content, is_pinned, published_at) VALUES
  ('2024년 정기총회 안내', '2024년 정기총회가 다음 주일 오후 2시에 진행됩니다. 모든 성도님들의 참석을 부탁드립니다.', true, NOW()),
  ('수요예배 시간 변경', '수요예배 시간이 오후 7시 30분으로 변경되었습니다.', false, NOW() - INTERVAL '3 days');

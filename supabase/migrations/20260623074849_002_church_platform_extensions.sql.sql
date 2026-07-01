-- 교회 인증 관련 테이블
CREATE TABLE churches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  denomination VARCHAR(100),
  description TEXT,
  pastor_name VARCHAR(50),
  worship_times JSONB,
  address TEXT,
  website_url TEXT,
  youtube_url TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_verified BOOLEAN DEFAULT false,
  verification_status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 교회 인증 서류
CREATE TABLE church_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL,
  file_url TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 성경통독 플랜
CREATE TABLE bible_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  duration_days INTEGER NOT NULL,
  plan_type VARCHAR(30) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 성경통독 일정
CREATE TABLE bible_plan_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES bible_plans(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  bible_book VARCHAR(50) NOT NULL,
  start_chapter INTEGER NOT NULL,
  end_chapter INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 성도 통독 진행
CREATE TABLE bible_reading_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES bible_plans(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES bible_plan_schedules(id) ON DELETE CASCADE,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(member_id, schedule_id)
);

-- QT 작성
CREATE TABLE qt_writings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  qt_id UUID REFERENCES qt(id) ON DELETE CASCADE,
  content TEXT,
  prayer TEXT,
  application TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(member_id, qt_id)
);

-- 주보
CREATE TABLE bulletins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  bulletin_date DATE NOT NULL,
  pdf_url TEXT,
  image_urls JSONB,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 교회 일정
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  end_date DATE,
  end_time TIME,
  location VARCHAR(100),
  event_type VARCHAR(30) DEFAULT 'church',
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 암송구절
CREATE TABLE verses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  bible_verse VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  is_memorized BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 중보기도 요청
CREATE TABLE intercession_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prayer_id UUID REFERENCES prayers(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES members(id),
  prayer_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 교회 기도제목
CREATE TABLE church_prayers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  prayer_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 권한 관리
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  permission_type VARCHAR(30) NOT NULL,
  granted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, permission_type)
);

-- RLS 활성화
ALTER TABLE churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE church_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE bible_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE bible_plan_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE bible_reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE qt_writings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulletins ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE verses ENABLE ROW LEVEL SECURITY;
ALTER TABLE intercession_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE church_prayers ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

-- 교회 RLS 정책
CREATE POLICY "select_churches" ON churches FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_churches" ON churches FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_churches" ON churches FOR UPDATE TO authenticated USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- 교회 서류 RLS 정책
CREATE POLICY "select_church_documents" ON church_documents FOR SELECT TO authenticated USING (auth.uid() IN (SELECT user_id FROM admin_users));
CREATE POLICY "insert_church_documents" ON church_documents FOR INSERT TO authenticated WITH CHECK (true);

-- 성경 플랜 RLS 정책
CREATE POLICY "select_bible_plans" ON bible_plans FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_bible_plans" ON bible_plans FOR INSERT TO authenticated WITH CHECK (auth.uid() IN (SELECT user_id FROM admin_users));
CREATE POLICY "select_bible_plan_schedules" ON bible_plan_schedules FOR SELECT TO authenticated USING (true);

-- 성경 통독 진행 RLS 정책
CREATE POLICY "select_own_reading_progress" ON bible_reading_progress FOR SELECT TO authenticated USING (auth.uid() IN (SELECT user_id FROM members WHERE id = bible_reading_progress.member_id));
CREATE POLICY "insert_reading_progress" ON bible_reading_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() IN (SELECT user_id FROM members WHERE id = bible_reading_progress.member_id));
CREATE POLICY "update_reading_progress" ON bible_reading_progress FOR UPDATE TO authenticated USING (auth.uid() IN (SELECT user_id FROM members WHERE id = bible_reading_progress.member_id));

-- QT 작성 RLS 정책
CREATE POLICY "select_own_qt_writings" ON qt_writings FOR SELECT TO authenticated USING (auth.uid() IN (SELECT user_id FROM members WHERE id = qt_writings.member_id));
CREATE POLICY "insert_qt_writings" ON qt_writings FOR INSERT TO authenticated WITH CHECK (auth.uid() IN (SELECT user_id FROM members WHERE id = qt_writings.member_id));
CREATE POLICY "update_qt_writings" ON qt_writings FOR UPDATE TO authenticated USING (auth.uid() IN (SELECT user_id FROM members WHERE id = qt_writings.member_id));

-- 주보 RLS 정책
CREATE POLICY "select_bulletins" ON bulletins FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_bulletins" ON bulletins FOR INSERT TO authenticated WITH CHECK (auth.uid() IN (SELECT user_id FROM admin_users));
CREATE POLICY "update_bulletins" ON bulletins FOR UPDATE TO authenticated USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- 교회 일정 RLS 정책
CREATE POLICY "select_events" ON events FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_events" ON events FOR INSERT TO authenticated WITH CHECK (auth.uid() IN (SELECT user_id FROM admin_users));
CREATE POLICY "update_events" ON events FOR UPDATE TO authenticated USING (auth.uid() IN (SELECT user_id FROM admin_users));
CREATE POLICY "delete_events" ON events FOR DELETE TO authenticated USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- 암송구절 RLS 정책
CREATE POLICY "select_own_verses" ON verses FOR SELECT TO authenticated USING (auth.uid() IN (SELECT user_id FROM members WHERE id = verses.member_id));
CREATE POLICY "insert_verses" ON verses FOR INSERT TO authenticated WITH CHECK (auth.uid() IN (SELECT user_id FROM members WHERE id = verses.member_id));
CREATE POLICY "update_verses" ON verses FOR UPDATE TO authenticated USING (auth.uid() IN (SELECT user_id FROM members WHERE id = verses.member_id));
CREATE POLICY "delete_verses" ON verses FOR DELETE TO authenticated USING (auth.uid() IN (SELECT user_id FROM members WHERE id = verses.member_id));

-- 중보기도 RLS 정책
CREATE POLICY "select_intercession_requests" ON intercession_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_intercession_requests" ON intercession_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() IN (SELECT user_id FROM members WHERE id = intercession_requests.requested_by));

-- 교회 기도제목 RLS 정책
CREATE POLICY "select_church_prayers" ON church_prayers FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_church_prayers" ON church_prayers FOR INSERT TO authenticated WITH CHECK (auth.uid() IN (SELECT user_id FROM admin_users));
CREATE POLICY "update_church_prayers" ON church_prayers FOR UPDATE TO authenticated USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- 권한 RLS 정책
CREATE POLICY "select_permissions" ON permissions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_permissions" ON permissions FOR INSERT TO authenticated WITH CHECK (auth.uid() IN (SELECT user_id FROM admin_users));
CREATE POLICY "delete_permissions" ON permissions FOR DELETE TO authenticated USING (auth.uid() IN (SELECT user_id FROM admin_users));

-- 인덱스 생성
CREATE INDEX idx_bible_reading_member ON bible_reading_progress(member_id);
CREATE INDEX idx_bible_reading_plan ON bible_reading_progress(plan_id);
CREATE INDEX idx_qt_writings_member ON qt_writings(member_id);
CREATE INDEX idx_bulletins_date ON bulletins(bulletin_date DESC);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_church_prayers_date ON church_prayers(prayer_date DESC);

-- 성경통독 플랜 샘플 데이터
INSERT INTO bible_plans (id, name, description, duration_days, plan_type) VALUES
  ('10000000-0000-0000-0000-000000000001', '1년 성경통독', '1년 동안 성경을 완독하는 플랜', 365, 'yearly'),
  ('10000000-0000-0000-0000-000000000002', '4개월 성경일독', '4개월 동안 성경을 완독하는 플랜', 120, 'fast'),
  ('10000000-0000-0000-0000-000000000003', '6개월 성경읽기', '6개월 동안 성경을 읽는 플랜', 180, 'half_year'),
  ('10000000-0000-0000-0000-000000000004', '90일 성경통독', '90일 동안 성경을 완독하는 플랜', 90, 'intensive'),
  ('10000000-0000-0000-0000-000000000005', '30일 신약통독', '30일 동안 신약을 완독하는 플랜', 30, 'new_testament');

-- 샘플 주보
INSERT INTO bulletins (title, description, bulletin_date) VALUES
  ('2024년 1월 셋째 주 주보', '주일예배 주보', '2024-01-21'),
  ('2024년 1월 둘째 주 주보', '주일예배 주보', '2024-01-14');

-- 샘플 교회 일정
INSERT INTO events (title, description, event_date, event_time, event_type) VALUES
  ('주일예배', '주일 오전 예배', '2024-01-21', '11:00:00', 'worship'),
  ('수요예배', '수요 저녁 예배', '2024-01-24', '19:30:00', 'worship'),
  ('새벽기도회', '새벽 기도 모임', '2024-01-22', '05:30:00', 'prayer'),
  ('금요철야', '금요 철야 기도회', '2024-01-26', '22:00:00', 'prayer');

-- 샘플 교회 기도제목
INSERT INTO church_prayers (title, content, prayer_date) VALUES
  ('교회 부흥', '주님의 은혜로 교회가 부흥하게 하소서.', '2024-01-21'),
  ('선교사 후원', '파송한 선교사님들을 후원할 재정을 허락하소서.', '2024-01-21');
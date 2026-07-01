-- Upgrade announcements table
ALTER TABLE announcements
  ADD COLUMN IF NOT EXISTS category VARCHAR(30) DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS is_important BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS file_url TEXT,
  ADD COLUMN IF NOT EXISTS file_name VARCHAR(200),
  ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

UPDATE announcements SET category = 'general' WHERE category IS NULL;

-- Upgrade bulletins table
ALTER TABLE bulletins
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS image_url TEXT;

CREATE INDEX IF NOT EXISTS idx_announcements_pinned ON announcements(is_pinned DESC, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_bulletins_date ON bulletins(bulletin_date DESC);

-- Seed demo announcements
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM announcements WHERE title = '2026년 하반기 교회 일정 안내') THEN
    INSERT INTO announcements (title, content, category, is_pinned, is_important, published_at, view_count) VALUES
      ('2026년 하반기 교회 일정 안내', '사랑하는 성도 여러분, 2026년 하반기 주요 교회 일정을 안내해드립니다. 7월 여름 수련회, 8월 전교인 야외 예배, 9월 추수감사절 특별예배, 10월 문화 선교의 날, 11월 성도의 날 행사, 12월 성탄절 특별예배. 각 행사 상세 일정은 추후 공지드리겠습니다.', 'general', true, true, NOW(), 234),
      ('여름 수련회 참가 신청 안내', '오는 7월 15일부터 17일까지 여름 수련회가 진행됩니다. 장소: 강원도 속초 청소년수련원, 대상: 전교인, 비용: 성인 오만원/청소년 삼만원. 신청 기간: 6월 30일까지.', 'event', true, true, NOW() - INTERVAL '3 days', 187),
      ('주일학교 가정통신문 6월호', '사랑하는 학부모님께, 6월 주일학교 가정통신문을 전달드립니다. 이번 달 주제: 하나님의 사랑. 요한복음 3장 16절을 중심으로 하나님의 사랑을 배우고 있습니다.', 'family', false, false, NOW() - INTERVAL '8 days', 95),
      ('교회 주차장 공사 안내', '오는 6월 24일(수)부터 6월 28일(일)까지 교회 주차장 보수 공사가 진행됩니다. 공사 기간 중 주차 공간이 협소하오니 대중교통을 이용해 주세요.', 'general', false, false, NOW() - INTERVAL '9 days', 143),
      ('새벽기도회 일정 변경 안내', '7월 한 달간 새벽기도회 시간이 변경됩니다. 기존: 매일 오전 5시30분, 변경: 매일 오전 5시. 더 풍성한 은혜의 시간이 되기를 기도합니다.', 'general', false, false, NOW() - INTERVAL '13 days', 78);
  END IF;
END $$;

-- Seed demo bulletins
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM bulletins WHERE title = '2026년 6월 4주차 주보') THEN
    INSERT INTO bulletins (title, description, bulletin_date, view_count, is_archived) VALUES
      ('2026년 6월 4주차 주보', '성령 강림 후 제5주 주일예배 주보', '2026-06-22', 128, false),
      ('2026년 6월 3주차 주보', '성령 강림 후 제4주 주일예배 주보', '2026-06-15', 98,  false),
      ('2026년 6월 2주차 주보', '성령 강림 후 제3주 주일예배 주보', '2026-06-08', 115, false),
      ('2026년 6월 1주차 주보', '성령 강림 후 제2주 주일예배 주보', '2026-06-01', 143, true),
      ('2026년 5월 4주차 주보', '성령 강림 후 제1주 주일예배 주보', '2026-05-25', 201, true),
      ('2026년 5월 3주차 주보', '부활절 후 제7주 주일예배 주보',    '2026-05-18', 187, true),
      ('2026년 5월 2주차 주보', '부활절 후 제6주 주일예배 주보',    '2026-05-11', 165, true),
      ('2026년 5월 1주차 주보', '부활절 후 제5주 주일예배 주보',    '2026-05-04', 212, true);
  END IF;
END $$;

-- 교구 (Districts/Parishes)
CREATE TABLE IF NOT EXISTS church_districts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  leader_name text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE church_districts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clergy_select_districts" ON church_districts FOR SELECT TO authenticated USING (true);
CREATE POLICY "clergy_insert_districts" ON church_districts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "clergy_update_districts" ON church_districts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "clergy_delete_districts" ON church_districts FOR DELETE TO authenticated USING (true);

-- 구역 (Zones)
CREATE TABLE IF NOT EXISTS church_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id uuid REFERENCES church_districts(id) ON DELETE SET NULL,
  name text NOT NULL,
  leader_name text,
  clergy_name text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE church_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clergy_select_zones" ON church_zones FOR SELECT TO authenticated USING (true);
CREATE POLICY "clergy_insert_zones" ON church_zones FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "clergy_update_zones" ON church_zones FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "clergy_delete_zones" ON church_zones FOR DELETE TO authenticated USING (true);

-- 교역자 테이블
CREATE TABLE IF NOT EXISTS clergy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  name text NOT NULL,
  phone text,
  email text,
  position text NOT NULL DEFAULT '전도사',
  position_custom text,
  bio text,
  photo_url text,
  is_active boolean NOT NULL DEFAULT true,
  is_chief boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE clergy ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clergy_select_clergy" ON clergy FOR SELECT TO authenticated USING (true);
CREATE POLICY "clergy_insert_clergy" ON clergy FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "clergy_update_clergy" ON clergy FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "clergy_delete_clergy" ON clergy FOR DELETE TO authenticated USING (true);

-- clergy_assignments: 교역자 교구/구역/부서 배정
CREATE TABLE IF NOT EXISTS clergy_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clergy_id uuid NOT NULL REFERENCES clergy(id) ON DELETE CASCADE,
  assignment_type text NOT NULL,  -- district | zone | department
  target_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE clergy_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_assignments" ON clergy_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_assignments" ON clergy_assignments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_assignments" ON clergy_assignments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_assignments" ON clergy_assignments FOR DELETE TO authenticated USING (true);

-- members 확장
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS church_district_id uuid REFERENCES church_districts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS church_zone_id uuid REFERENCES church_zones(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS jikbun text DEFAULT '성도',
  ADD COLUMN IF NOT EXISTS jikbun_custom text;

-- departments 확장
ALTER TABLE departments
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS description text;

-- 샘플 교구 데이터
INSERT INTO church_districts (name, description, is_active, sort_order) VALUES
  ('1교구', '서울 북부 지역', true, 1),
  ('2교구', '서울 중부 지역', true, 2),
  ('3교구', '서울 남부 지역', true, 3),
  ('4교구', '경기 북부 지역', true, 4)
ON CONFLICT DO NOTHING;

-- 샘플 구역 데이터
WITH d AS (SELECT id, sort_order FROM church_districts ORDER BY sort_order)
INSERT INTO church_zones (district_id, name, is_active, sort_order)
SELECT d.id, z.name, true, z.so
FROM d
CROSS JOIN LATERAL (
  VALUES ('1구역',1),('2구역',2),('3구역',3)
) AS z(name, so)
ON CONFLICT DO NOTHING;

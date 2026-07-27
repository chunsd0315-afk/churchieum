-- 교회별 기본 조직명·교역자 표시명 (공통 설정)
-- Demo 로그인은 Supabase Auth 세션이 없으므로 public RLS (앨범·통독 로그와 동일 패턴)

CREATE TABLE IF NOT EXISTS church_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id text NOT NULL UNIQUE,
  level1_label text NOT NULL DEFAULT '교구',
  level2_label text NOT NULL DEFAULT '구역',
  department_label text NOT NULL DEFAULT '부서',
  pastor_label text NOT NULL DEFAULT '교역자',
  level1_enabled boolean NOT NULL DEFAULT true,
  level2_enabled boolean NOT NULL DEFAULT true,
  department_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS church_settings_church_id_idx ON church_settings (church_id);

ALTER TABLE church_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "church_settings_select" ON church_settings;
DROP POLICY IF EXISTS "church_settings_insert" ON church_settings;
DROP POLICY IF EXISTS "church_settings_update" ON church_settings;
DROP POLICY IF EXISTS "church_settings_delete" ON church_settings;

CREATE POLICY "church_settings_select" ON church_settings
  FOR SELECT TO public USING (true);

CREATE POLICY "church_settings_insert" ON church_settings
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "church_settings_update" ON church_settings
  FOR UPDATE TO public USING (true) WITH CHECK (true);

CREATE POLICY "church_settings_delete" ON church_settings
  FOR DELETE TO public USING (true);

COMMENT ON TABLE church_settings IS '교회별 조직명·교역자 표시명 공통 설정 (원본). localStorage는 캐시 전용.';

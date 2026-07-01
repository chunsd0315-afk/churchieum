
-- verses 테이블에 note, highlight_color 컬럼 추가
ALTER TABLE verses ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE verses ADD COLUMN IF NOT EXISTS highlight_color VARCHAR(20) DEFAULT 'yellow';

-- reading_logs 테이블 생성 (통독 기록)
CREATE TABLE IF NOT EXISTS reading_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id VARCHAR(50) NOT NULL,
  day_number INTEGER NOT NULL,
  read_date DATE NOT NULL DEFAULT CURRENT_DATE,
  labels TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reading_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reading_logs_public_select" ON reading_logs FOR SELECT TO public USING (true);
CREATE POLICY "reading_logs_public_insert" ON reading_logs FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "reading_logs_public_delete" ON reading_logs FOR DELETE TO public USING (true);

-- verses RLS 정책 공개로 교체
DROP POLICY IF EXISTS "select_verses" ON verses;
DROP POLICY IF EXISTS "insert_verses" ON verses;
DROP POLICY IF EXISTS "update_verses" ON verses;
DROP POLICY IF EXISTS "delete_verses" ON verses;

CREATE POLICY "verses_public_select" ON verses FOR SELECT TO public USING (true);
CREATE POLICY "verses_public_insert" ON verses FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "verses_public_update" ON verses FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "verses_public_delete" ON verses FOR DELETE TO public USING (true);

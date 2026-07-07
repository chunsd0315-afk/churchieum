-- 009: 설교 등록/수정/삭제 권한을 최고관리자(super_admin)로 제한
--
-- 정책 요약
--   SELECT : 모든 로그인 사용자(교역자·성도 포함) 조회 가능 (기존 유지)
--   INSERT / UPDATE / DELETE : admin_users.role = 'super_admin' 인 사용자만 허용
--
-- 프론트엔드에서 버튼을 숨기는 것과 별개로, 데이터베이스 레벨에서도
-- 최고관리자만 설교를 등록·수정·삭제할 수 있도록 강제한다.

-- 기존 설교 쓰기 정책 제거 (admin_users 전체 허용 → super_admin 전용으로 교체)
DROP POLICY IF EXISTS "insert_sermons" ON sermons;
DROP POLICY IF EXISTS "update_sermons" ON sermons;
DROP POLICY IF EXISTS "delete_sermons" ON sermons;

-- 등록: 최고관리자만
CREATE POLICY "insert_sermons" ON sermons FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM admin_users WHERE role = 'super_admin')
  );

-- 수정: 최고관리자만
CREATE POLICY "update_sermons" ON sermons FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (SELECT user_id FROM admin_users WHERE role = 'super_admin')
  )
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM admin_users WHERE role = 'super_admin')
  );

-- 삭제: 최고관리자만
CREATE POLICY "delete_sermons" ON sermons FOR DELETE
  TO authenticated
  USING (
    auth.uid() IN (SELECT user_id FROM admin_users WHERE role = 'super_admin')
  );

-- SELECT 정책("select_sermons")은 기존 그대로 유지되어
-- 교역자·성도 모두 설교 목록을 조회/재생할 수 있다.

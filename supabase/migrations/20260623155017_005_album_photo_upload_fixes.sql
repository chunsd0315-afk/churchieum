
-- 1. albums 테이블에 cover_image 컬럼 추가
ALTER TABLE albums ADD COLUMN IF NOT EXISTS cover_image TEXT;

-- 2. churches 테이블에 photo_url 컬럼 추가
ALTER TABLE churches ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- 3. albums RLS 정책 교체 — anon 포함 누구나 읽기 가능, 쓰기는 인증 사용자 허용
DROP POLICY IF EXISTS "select_albums" ON albums;
DROP POLICY IF EXISTS "insert_albums" ON albums;
DROP POLICY IF EXISTS "update_albums" ON albums;
DROP POLICY IF EXISTS "delete_albums" ON albums;

CREATE POLICY "select_albums" ON albums FOR SELECT TO public USING (true);
CREATE POLICY "insert_albums" ON albums FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "update_albums" ON albums FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "delete_albums" ON albums FOR DELETE TO public USING (true);

-- 4. photos RLS 정책 교체
DROP POLICY IF EXISTS "select_photos" ON photos;
DROP POLICY IF EXISTS "insert_photos" ON photos;
DROP POLICY IF EXISTS "update_photos" ON photos;
DROP POLICY IF EXISTS "delete_photos" ON photos;

CREATE POLICY "select_photos" ON photos FOR SELECT TO public USING (true);
CREATE POLICY "insert_photos" ON photos FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "update_photos" ON photos FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "delete_photos" ON photos FOR DELETE TO public USING (true);

-- 5. Storage 버킷 policies — anon 업로드 허용
DROP POLICY IF EXISTS "albums_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "albums_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "albums_auth_delete" ON storage.objects;

CREATE POLICY "albums_public_insert" ON storage.objects FOR INSERT TO public
  WITH CHECK (bucket_id = 'albums');
CREATE POLICY "albums_public_update" ON storage.objects FOR UPDATE TO public
  USING (bucket_id = 'albums');
CREATE POLICY "albums_public_delete" ON storage.objects FOR DELETE TO public
  USING (bucket_id = 'albums');

DROP POLICY IF EXISTS "announcements_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "announcements_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "announcements_auth_delete" ON storage.objects;

CREATE POLICY "announcements_public_insert" ON storage.objects FOR INSERT TO public
  WITH CHECK (bucket_id = 'announcements');
CREATE POLICY "announcements_public_update" ON storage.objects FOR UPDATE TO public
  USING (bucket_id = 'announcements');
CREATE POLICY "announcements_public_delete" ON storage.objects FOR DELETE TO public
  USING (bucket_id = 'announcements');

DROP POLICY IF EXISTS "bulletins_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "bulletins_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "bulletins_auth_delete" ON storage.objects;

CREATE POLICY "bulletins_public_insert" ON storage.objects FOR INSERT TO public
  WITH CHECK (bucket_id = 'bulletins');
CREATE POLICY "bulletins_public_update" ON storage.objects FOR UPDATE TO public
  USING (bucket_id = 'bulletins');
CREATE POLICY "bulletins_public_delete" ON storage.objects FOR DELETE TO public
  USING (bucket_id = 'bulletins');

DROP POLICY IF EXISTS "church_photos_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "church_photos_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "church_photos_auth_delete" ON storage.objects;

CREATE POLICY "church_photos_public_insert" ON storage.objects FOR INSERT TO public
  WITH CHECK (bucket_id = 'church-photos');
CREATE POLICY "church_photos_public_update" ON storage.objects FOR UPDATE TO public
  USING (bucket_id = 'church-photos');
CREATE POLICY "church_photos_public_delete" ON storage.objects FOR DELETE TO public
  USING (bucket_id = 'church-photos');

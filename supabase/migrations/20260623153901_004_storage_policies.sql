
-- Storage RLS policies for announcements bucket
CREATE POLICY "announcements_public_read" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'announcements');

CREATE POLICY "announcements_auth_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'announcements');

CREATE POLICY "announcements_auth_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'announcements');

CREATE POLICY "announcements_auth_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'announcements');

-- Storage RLS policies for bulletins bucket
CREATE POLICY "bulletins_public_read" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'bulletins');

CREATE POLICY "bulletins_auth_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'bulletins');

CREATE POLICY "bulletins_auth_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'bulletins');

CREATE POLICY "bulletins_auth_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'bulletins');

-- Storage RLS policies for albums bucket
CREATE POLICY "albums_public_read" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'albums');

CREATE POLICY "albums_auth_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'albums');

CREATE POLICY "albums_auth_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'albums');

CREATE POLICY "albums_auth_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'albums');

-- Storage RLS policies for church-photos bucket
CREATE POLICY "church_photos_public_read" ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'church-photos');

CREATE POLICY "church_photos_auth_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'church-photos');

CREATE POLICY "church_photos_auth_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'church-photos');

CREATE POLICY "church_photos_auth_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'church-photos');

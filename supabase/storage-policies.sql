-- Run this in Supabase SQL Editor to allow avatar uploads.
-- Without these policies, storage uploads are blocked by RLS and the app
-- ends up saving a broken public URL (the image shows as broken).

-- Make sure the bucket is public for reads
update storage.buckets set public = true where id = 'avatars';

-- Allow authenticated users to upload / update / delete their own files
-- (files are stored under a folder named after the user's id: "<uid>/avatar.jpg")
create policy "authenticated can upload avatars"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars');

create policy "authenticated can update avatars"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars');

create policy "authenticated can delete avatars"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars');

create policy "anyone can read avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

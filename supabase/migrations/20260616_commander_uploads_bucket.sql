insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'uploads',
  'uploads',
  false,
  10485760,
  array[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/webm',
    'audio/ogg',
    'audio/mp4'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists uploads_select_own on storage.objects;
create policy uploads_select_own
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'uploads' and owner = (select auth.uid()));

drop policy if exists uploads_insert_own on storage.objects;
create policy uploads_insert_own
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'uploads' and owner = (select auth.uid()) and name like ((select auth.uid())::text || '/%'));

drop policy if exists uploads_delete_own on storage.objects;
create policy uploads_delete_own
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'uploads' and owner = (select auth.uid()));

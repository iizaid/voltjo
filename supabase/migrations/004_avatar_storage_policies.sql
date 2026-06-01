drop policy if exists "Users can view own avatar objects" on storage.objects;
drop policy if exists "Users can upload own avatar objects" on storage.objects;
drop policy if exists "Users can update own avatar objects" on storage.objects;
drop policy if exists "Users can delete own avatar objects" on storage.objects;

create policy "Users can view own avatar objects"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'avatars'
  and storage.foldername(name)[1] = auth.uid()::text
);

create policy "Users can upload own avatar objects"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and storage.foldername(name)[1] = auth.uid()::text
);

create policy "Users can update own avatar objects"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and storage.foldername(name)[1] = auth.uid()::text
)
with check (
  bucket_id = 'avatars'
  and storage.foldername(name)[1] = auth.uid()::text
);

create policy "Users can delete own avatar objects"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and storage.foldername(name)[1] = auth.uid()::text
);

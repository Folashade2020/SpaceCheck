-- Migration 004: photo uploads via Supabase Storage
-- Run once in Supabase SQL Editor. Re-runnable.

-- Public bucket for listing photos (free tier).
insert into storage.buckets (id, name, public)
values ('property-photos', 'property-photos', true)
on conflict (id) do nothing;

-- Public read (photos show on cards + detail pages without login).
drop policy if exists "Public can view property photos" on storage.objects;
create policy "Public can view property photos" on storage.objects
  for select using (bucket_id = 'property-photos');

-- Logged-in users can upload (2MB limit enforced in app, not here).
drop policy if exists "Authenticated can upload property photos" on storage.objects;
create policy "Authenticated can upload property photos" on storage.objects
  for insert to authenticated with check (bucket_id = 'property-photos');

-- Owners can replace/delete their own uploads.
drop policy if exists "Owners manage own property photos" on storage.objects;
create policy "Owners manage own property photos" on storage.objects
  for all using (bucket_id = 'property-photos' and auth.uid()::text = (storage.foldername(name))[1])
  with check (bucket_id = 'property-photos');

-- Migration 003: trust polish — listing flags + owner request visibility
-- Run once in Supabase SQL Editor. Re-runnable.

-- 1. Suspicious-listing flags (PRD Sec 22). Public counts, never auto-deletes.
create table if not exists public.listing_reports (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  reporter_id uuid references public.profiles(id) on delete set null,
  reason text not null check (reason in (
    'Fake property', 'Wrong location', 'Already rented',
    'Misleading info', 'Suspicious agent', 'Duplicate'
  )),
  comment text,
  created_at timestamptz not null default now()
);

alter table public.listing_reports enable row level security;

drop policy if exists "Public can read listing reports" on public.listing_reports;
create policy "Public can read listing reports" on public.listing_reports
  for select using (true);

drop policy if exists "Authenticated can flag listings" on public.listing_reports;
create policy "Authenticated can flag listings" on public.listing_reports
  for insert to authenticated with check (true);

-- 2. Owners can SEE viewing requests for their own properties
-- (existing "Users manage own" policy stays; RLS passes if ANY policy allows).
drop policy if exists "Owners can view requests for own properties" on public.viewing_requests;
create policy "Owners can view requests for own properties" on public.viewing_requests
  for select using (
    exists (
      select 1 from public.properties
      where properties.id = viewing_requests.property_id
        and properties.owner_id = auth.uid()
    )
  );

grant select on public.listing_reports to anon, authenticated;

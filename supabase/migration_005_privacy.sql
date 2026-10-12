-- Migration 005: NDPA privacy guard — viewing-gated address reveal
-- Run once in Supabase SQL Editor. Re-runnable.

-- Status lifecycle for viewing requests (renter ⇄ owner handshake).
alter table public.viewing_requests
  drop constraint if exists viewing_requests_status_check;

alter table public.viewing_requests
  add constraint viewing_requests_status_check
  check (status in ('pending', 'confirmed', 'declined'));

-- Reporters can anonymize their own reports on account deletion (NDPA erasure).
drop policy if exists "Users can anonymize own reports" on public.reports;
create policy "Users can anonymize own reports" on public.reports
  for update using (auth.uid() = reporter_id) with check (reporter_id is null);

-- Owners can accept/decline requests for their own properties.
drop policy if exists "Owners can update requests for own properties" on public.viewing_requests;
create policy "Owners can update requests for own properties" on public.viewing_requests
  for update using (
    exists (
      select 1 from public.properties
      where properties.id = viewing_requests.property_id
        and properties.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.properties
      where properties.id = viewing_requests.property_id
        and properties.owner_id = auth.uid()
    )
  );

-- Confirmed renters may read the private contact fields of the property
-- they are confirmed for. Nothing else changes: anon/public still only
-- sees the property_public view (no exact_address, no phone).
drop policy if exists "Confirmed renters can view private contact fields" on public.properties;
create policy "Confirmed renters can view private contact fields" on public.properties
  for select using (
    exists (
      select 1 from public.viewing_requests
      where viewing_requests.property_id = properties.id
        and viewing_requests.user_id = auth.uid()
        and viewing_requests.status = 'confirmed'
    )
  );

-- Users can remove their own listing flags on account deletion (NDPA erasure).
drop policy if exists "Users can delete own flags" on public.listing_reports;
create policy "Users can delete own flags" on public.listing_reports
  for delete using (auth.uid() = reporter_id);

grant select on public.listing_reports to anon, authenticated;

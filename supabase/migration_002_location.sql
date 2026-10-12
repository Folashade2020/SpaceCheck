-- Migration 002: narrow locations district → neighborhood → estate
-- Run once in Supabase SQL Editor AFTER supabase/schema.sql.

alter table public.properties
  add column if not exists neighborhood text,
  add column if not exists estate text;

-- Backfill: existing general_area values (e.g. 'Ikeja', 'Lekki Phase 1') become neighborhood.
update public.properties
set neighborhood = general_area
where neighborhood is null and general_area is not null;

-- Public view now exposes neighborhood + estate (street/exact stay private).
-- NOTE: new columns are APPENDED at the end (not in the middle) so that
-- CREATE OR REPLACE keeps the existing column order. Reordering columns
-- requires DROP + CASCADE and can break dependents (error 42P16) — avoid it.
create or replace view public.property_public as
select
  id, owner_id, property_type, bedrooms, bathrooms, rent,
  general_area, area,
  availability, verification_status, photos,
  contact_name,
  electricity, flood, water, road_access, network_quality,
  security_features, nearby_places,
  public_lat, public_lng, is_available, created_at,
  neighborhood, estate
from public.properties;

grant select on public.property_public to anon, authenticated;

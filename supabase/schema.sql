-- SpaceCheck Phase 0 schema
-- Run in Supabase Dashboard > SQL Editor. Safe to re-run (uses IF NOT EXISTS).

-- Required for gen_random_uuid()
create extension if not exists "pgcrypto";

-- 1. profiles: one row per auth user, holds beginner-friendly role
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'renter' check (role in ('renter', 'owner_agent', 'community')),
  created_at timestamptz not null default now()
);

-- 2. properties: owner-submitted listings
-- PRIVACY: exact_address / exact_lat / exact_lng are PRIVATE. Never select them in public pages.
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete set null,
  property_type text,
  bedrooms int,
  bathrooms int,
  rent numeric,
  general_area text,
  area text,
  availability text default 'Available',
  verification_status text default 'Limited information',
  photos text[] default '{}',
  contact_name text,
  contact_phone text,
  electricity text,
  flood text,
  water text,
  road_access text,
  network_quality text,
  security_features text,
  nearby_places text,
  -- private fields:
  exact_address text,
  exact_lat double precision,
  exact_lng double precision,
  -- public approximate location:
  public_lat double precision,
  public_lng double precision,
  is_available boolean default true,
  created_at timestamptz not null default now()
);

-- 3. reports: community / visitor experience
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  reporter_id uuid references public.profiles(id) on delete set null,
  source_type text not null default 'visitor'
    check (source_type in ('owner_agent', 'current_resident', 'former_resident', 'visitor')),
  electricity text,
  flood text,
  water text,
  road_access text,
  network_quality text,
  security_experience text,
  listing_accuracy text check (listing_accuracy in ('Yes', 'Partly', 'No')),
  comment text,
  created_at timestamptz not null default now()
);

-- 4. saves
create table if not exists public.saves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, property_id)
);

-- 5. viewing_requests
create table if not exists public.viewing_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  property_id uuid not null references public.properties(id) on delete cascade,
  message text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

-- 6. preferences: renter onboarding (Phase 2 uses this for Fit Score)
create table if not exists public.preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  areas text[] default '{}',
  budget_min numeric,
  budget_max numeric,
  property_type text,
  priorities jsonb default '{}',
  updated_at timestamptz not null default now()
);

-- Public safe view: excludes exact_address / exact_lat / exact_lng
create or replace view public.property_public as
select
  id, owner_id, property_type, bedrooms, bathrooms, rent,
  general_area, area, availability, verification_status, photos,
  contact_name,
  electricity, flood, water, road_access, network_quality,
  security_features, nearby_places,
  public_lat, public_lng, is_available, created_at
from public.properties;

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.reports enable row level security;
alter table public.saves enable row level security;
alter table public.viewing_requests enable row level security;
alter table public.preferences enable row level security;

-- Policies (drop first so re-runnable)
drop policy if exists "Users manage own profile" on public.profiles;
create policy "Users manage own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Owners manage own properties" on public.properties;
create policy "Owners manage own properties" on public.properties
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "Authenticated can create properties" on public.properties;
create policy "Authenticated can create properties" on public.properties
  for insert to authenticated with check (true);

drop policy if exists "Public can read reports" on public.reports;
create policy "Public can read reports" on public.reports
  for select using (true);

drop policy if exists "Authenticated can create reports" on public.reports;
create policy "Authenticated can create reports" on public.reports
  for insert to authenticated with check (true);

drop policy if exists "Users manage own saves" on public.saves;
create policy "Users manage own saves" on public.saves
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own viewing requests" on public.viewing_requests;
create policy "Users manage own viewing requests" on public.viewing_requests
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own preferences" on public.preferences;
create policy "Users manage own preferences" on public.preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Grants for the public view (so /search works without login)
grant select on public.property_public to anon, authenticated;
grant select on public.reports to anon, authenticated;

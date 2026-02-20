-- TravelCal Supabase Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- STEP 1: Create all tables first (no RLS policies yet)
-- ============================================================

-- Profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- Trips table
create table public.trips (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  start_date date not null,
  end_date date not null,
  emoji text default '✈️',
  invite_code text unique default substr(md5(random()::text), 1, 8),
  owner_id uuid references public.profiles(id) on delete cascade not null,
  is_public boolean default false,
  created_at timestamptz default now()
);

-- Trip members table
create table public.trip_members (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  joined_at timestamptz default now(),
  unique(trip_id, user_id)
);

-- Availability table
create table public.availability (
  id uuid default uuid_generate_v4() primary key,
  trip_id uuid references public.trips(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  date date not null,
  status text check (status in ('free', 'tentative', 'busy')) not null,
  updated_at timestamptz default now(),
  unique(trip_id, user_id, date)
);

-- ============================================================
-- STEP 2: Enable RLS on all tables
-- ============================================================

alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.trip_members enable row level security;
alter table public.availability enable row level security;

-- ============================================================
-- STEP 3: RLS policies (all tables exist now, no forward refs)
-- ============================================================

-- Profiles policies
create policy "Users can view any profile"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Trips policies
create policy "Trip members can view trips"
  on public.trips for select using (
    auth.uid() = owner_id or
    exists (
      select 1 from public.trip_members
      where trip_id = trips.id and user_id = auth.uid()
    )
  );

create policy "Authenticated users can create trips"
  on public.trips for insert with check (auth.uid() = owner_id);

create policy "Trip owners can update trips"
  on public.trips for update using (auth.uid() = owner_id);

create policy "Trip owners can delete trips"
  on public.trips for delete using (auth.uid() = owner_id);

-- Trip members policies
create policy "Trip members can view membership"
  on public.trip_members for select using (
    exists (
      select 1 from public.trips
      where id = trip_members.trip_id and (
        owner_id = auth.uid() or
        exists (
          select 1 from public.trip_members tm2
          where tm2.trip_id = trip_members.trip_id and tm2.user_id = auth.uid()
        )
      )
    )
  );

create policy "Authenticated users can join trips"
  on public.trip_members for insert with check (auth.uid() = user_id);

create policy "Members can leave trips"
  on public.trip_members for delete using (auth.uid() = user_id);

-- Availability policies
create policy "Trip members can view availability"
  on public.availability for select using (
    exists (
      select 1 from public.trips t
      left join public.trip_members tm on tm.trip_id = t.id
      where t.id = availability.trip_id
        and (t.owner_id = auth.uid() or tm.user_id = auth.uid())
    )
  );

create policy "Users can upsert own availability"
  on public.availability for insert with check (auth.uid() = user_id);

create policy "Users can update own availability"
  on public.availability for update using (auth.uid() = user_id);

create policy "Users can delete own availability"
  on public.availability for delete using (auth.uid() = user_id);

-- ============================================================
-- STEP 4: Auth trigger to auto-create profile on signup
-- ============================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- STEP 5: Enable realtime
-- ============================================================

alter publication supabase_realtime add table public.availability;
alter publication supabase_realtime add table public.trip_members;

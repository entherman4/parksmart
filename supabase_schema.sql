-- ============================================
-- ParkSmart UMBC — Supabase Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────
-- PROFILES
-- Auto-created when a user signs up via UMBC email
-- ─────────────────────────────────────────────
create table profiles (
  id          uuid references auth.users on delete cascade primary key,
  email       text unique not null,
  permit_type text check (permit_type in ('A','B','C','R','V')) default 'A',
  display_name text,
  created_at  timestamptz default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ─────────────────────────────────────────────
-- LOTS
-- Static lot data — seeded below
-- ─────────────────────────────────────────────
create table lots (
  id           uuid default uuid_generate_v4() primary key,
  name         text not null,
  short_name   text not null,           -- "Lot 1"
  permits      text[] not null,         -- ['A','B','C']
  lat          float not null,
  lng          float not null,
  capacity     int not null default 200,
  occupancy    int not null default 0,  -- current filled spots (0–capacity)
  updated_at   timestamptz default now()
);

-- Computed occupancy percentage (virtual, use in queries)
-- Usage: select *, round(occupancy::numeric / capacity * 100) as pct from lots;

-- ─────────────────────────────────────────────
-- REPORTS
-- Crowdsourced lot status from students
-- ─────────────────────────────────────────────
create table reports (
  id           uuid default uuid_generate_v4() primary key,
  lot_id       uuid references lots(id) on delete cascade not null,
  user_id      uuid references profiles(id) on delete cascade not null,
  status       text check (status in (
                 'empty','available','filling','almost_full','full','blocked'
               )) not null,
  note         text,
  upvotes      int default 0,
  created_at   timestamptz default now()
);

-- Prevent spam: one report per user per lot per 5 minutes
create or replace function check_report_throttle()
returns trigger as $$
begin
  if exists (
    select 1 from reports
    where user_id = new.user_id
      and lot_id  = new.lot_id
      and created_at > now() - interval '5 minutes'
  ) then
    raise exception 'You can only report a lot once every 5 minutes.';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger enforce_report_throttle
  before insert on reports
  for each row execute procedure check_report_throttle();

-- Auto-update lot occupancy estimate after each new report
create or replace function update_lot_occupancy()
returns trigger as $$
declare
  avg_status text;
  new_occupancy int;
  lot_capacity int;
begin
  select capacity into lot_capacity from lots where id = new.lot_id;

  -- Weight recent reports (last 30 min) to estimate occupancy %
  select
    case
      when avg(case status
        when 'empty'       then 0
        when 'available'   then 25
        when 'filling'     then 55
        when 'almost_full' then 80
        when 'full'        then 95
        when 'blocked'     then 95
      end) < 15  then 'empty'
      when avg(case status
        when 'empty'       then 0
        when 'available'   then 25
        when 'filling'     then 55
        when 'almost_full' then 80
        when 'full'        then 95
        when 'blocked'     then 95
      end) < 40  then 'available'
      else 'busy'
    end
  into avg_status
  from reports
  where lot_id = new.lot_id
    and created_at > now() - interval '30 minutes';

  new_occupancy := case avg_status
    when 'empty'     then round(lot_capacity * 0.10)
    when 'available' then round(lot_capacity * 0.35)
    else                  round(lot_capacity * 0.75)
  end;

  update lots
  set occupancy = new_occupancy, updated_at = now()
  where id = new.lot_id;

  return new;
end;
$$ language plpgsql;

create trigger on_report_inserted
  after insert on reports
  for each row execute procedure update_lot_occupancy();

-- ─────────────────────────────────────────────
-- REPORT UPVOTES
-- Students confirm a report is accurate
-- ─────────────────────────────────────────────
create table report_upvotes (
  report_id  uuid references reports(id) on delete cascade,
  user_id    uuid references profiles(id) on delete cascade,
  primary key (report_id, user_id)
);

-- Auto-increment upvote count
create or replace function increment_upvote()
returns trigger as $$
begin
  update reports set upvotes = upvotes + 1 where id = new.report_id;
  return new;
end;
$$ language plpgsql;

create trigger on_upvote_inserted
  after insert on report_upvotes
  for each row execute procedure increment_upvote();

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────
alter table profiles        enable row level security;
alter table lots             enable row level security;
alter table reports          enable row level security;
alter table report_upvotes   enable row level security;

-- Profiles: users can only read/update their own
create policy "Users read own profile"   on profiles for select using (auth.uid() = id);
create policy "Users update own profile" on profiles for update using (auth.uid() = id);

-- Lots: anyone logged in can read
create policy "Authenticated read lots"  on lots for select to authenticated using (true);

-- Reports: anyone logged in can read; authenticated users can insert
create policy "Authenticated read reports"   on reports for select to authenticated using (true);
create policy "Authenticated insert reports" on reports for insert to authenticated with check (auth.uid() = user_id);

-- Upvotes: anyone logged in can read; one upvote per user
create policy "Authenticated read upvotes"   on report_upvotes for select to authenticated using (true);
create policy "Authenticated insert upvotes" on report_upvotes for insert to authenticated with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- REALTIME
-- Enable live updates for map + report feed
-- ─────────────────────────────────────────────
alter publication supabase_realtime add table lots;
alter publication supabase_realtime add table reports;

-- ─────────────────────────────────────────────
-- SEED DATA — UMBC Parking Lots
-- Approximate coordinates, adjust to real ones
-- ─────────────────────────────────────────────
insert into lots (name, short_name, permits, lat, lng, capacity) values
  ('Lot 1 – South Garage',   'Lot 1', '{A,B,C,V}',  39.2548, -76.7147, 800),
  ('Lot 2 – West',           'Lot 2', '{A,B,V}',    39.2551, -76.7168, 350),
  ('Lot 3 – Resident',       'Lot 3', '{R}',         39.2561, -76.7138, 200),
  ('Lot 4 – Stadium',        'Lot 4', '{A,B,C}',    39.2533, -76.7130, 600),
  ('Lot 5 – Visitor',        'Lot 5', '{V,A}',      39.2557, -76.7152, 120),
  ('Lot 6 – Engineering',    'Lot 6', '{A,C}',      39.2545, -76.7135, 280);

-- ============================================
-- ParkSmart UMBC — RESET + RECREATE
-- Run this in Supabase SQL Editor
-- This safely drops everything and rebuilds
-- ============================================

-- Drop triggers first (they depend on tables)
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists enforce_report_throttle on reports;
drop trigger if exists on_report_inserted on reports;
drop trigger if exists on_upvote_inserted on report_upvotes;

-- Drop functions
drop function if exists handle_new_user();
drop function if exists check_report_throttle();
drop function if exists update_lot_occupancy();
drop function if exists increment_upvote();

-- Drop tables (order matters — child tables first)
drop table if exists report_upvotes;
drop table if exists reports;
drop table if exists lots;
drop table if exists profiles;

-- ─────────────────────────────────────────────
-- RECREATE EVERYTHING
-- ─────────────────────────────────────────────

create extension if not exists "uuid-ossp";

-- PROFILES
create table profiles (
  id           uuid references auth.users on delete cascade primary key,
  email        text unique not null,
  permit_type  text check (permit_type in ('A','B','C','R','V')) default 'A',
  display_name text,
  created_at   timestamptz default now()
);

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

-- LOTS
create table lots (
  id          uuid default uuid_generate_v4() primary key,
  name        text not null,
  short_name  text not null,
  permits     text[] not null,
  lat         float not null,
  lng         float not null,
  capacity    int not null default 200,
  occupancy   int not null default 0,
  updated_at  timestamptz default now()
);

-- REPORTS
create table reports (
  id         uuid default uuid_generate_v4() primary key,
  lot_id     uuid references lots(id) on delete cascade not null,
  user_id    uuid references profiles(id) on delete cascade not null,
  status     text check (status in (
               'empty','available','filling','almost_full','full','blocked'
             )) not null,
  note       text,
  upvotes    int default 0,
  created_at timestamptz default now()
);

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

create or replace function update_lot_occupancy()
returns trigger as $$
declare
  avg_pct     float;
  lot_capacity int;
begin
  select capacity into lot_capacity from lots where id = new.lot_id;

  select avg(case status
    when 'empty'       then 5
    when 'available'   then 25
    when 'filling'     then 55
    when 'almost_full' then 80
    when 'full'        then 95
    when 'blocked'     then 95
    else 50
  end)
  into avg_pct
  from reports
  where lot_id = new.lot_id
    and created_at > now() - interval '30 minutes';

  update lots
  set occupancy  = round(lot_capacity * (coalesce(avg_pct, 30) / 100)),
      updated_at = now()
  where id = new.lot_id;

  return new;
end;
$$ language plpgsql;

create trigger on_report_inserted
  after insert on reports
  for each row execute procedure update_lot_occupancy();

-- REPORT UPVOTES
create table report_upvotes (
  report_id  uuid references reports(id) on delete cascade,
  user_id    uuid references profiles(id) on delete cascade,
  primary key (report_id, user_id)
);

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

-- ROW LEVEL SECURITY
alter table profiles      enable row level security;
alter table lots          enable row level security;
alter table reports       enable row level security;
alter table report_upvotes enable row level security;

create policy "Users read own profile"   on profiles for select using (auth.uid() = id);
create policy "Users update own profile" on profiles for update using (auth.uid() = id);
create policy "Authenticated read lots"  on lots for select to authenticated using (true);
create policy "Authenticated read reports"   on reports for select to authenticated using (true);
create policy "Authenticated insert reports" on reports for insert to authenticated with check (auth.uid() = user_id);
create policy "Authenticated read upvotes"   on report_upvotes for select to authenticated using (true);
create policy "Authenticated insert upvotes" on report_upvotes for insert to authenticated with check (auth.uid() = user_id);

-- REALTIME
alter publication supabase_realtime add table lots;
alter publication supabase_realtime add table reports;

-- SEED DATA
insert into lots (name, short_name, permits, lat, lng, capacity) values
  ('Lot 1 – South Garage',   'Lot 1', '{A,B,C,V}',  39.2548, -76.7147, 800),
  ('Lot 2 – West',           'Lot 2', '{A,B,V}',    39.2551, -76.7168, 350),
  ('Lot 3 – Resident',       'Lot 3', '{R}',         39.2561, -76.7138, 200),
  ('Lot 4 – Stadium',        'Lot 4', '{A,B,C}',    39.2533, -76.7130, 600),
  ('Lot 5 – Visitor',        'Lot 5', '{V,A}',      39.2557, -76.7152, 120),
  ('Lot 6 – Engineering',    'Lot 6', '{A,C}',      39.2545, -76.7135, 280);

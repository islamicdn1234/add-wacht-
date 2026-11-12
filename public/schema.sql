-- schema.sql: Watch Ads & Earn Complete Database Schema for Supabase

-- 1. Profiles Table (Linked to Supabase Auth)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  user_code text unique not null,
  balance numeric(12,2) default 0.00 not null,
  ads_today int default 0 not null,
  ads_total int default 0 not null,
  referrer uuid references public.profiles(id),
  device_id text,
  bonus_claimed boolean default false not null,
  is_admin boolean default false not null,
  created_at timestamptz default now() not null
);

-- Index for device fraud detection
create index if not exists idx_profiles_device_id on public.profiles(device_id);
create index if not exists idx_profiles_user_code on public.profiles(user_code);

-- 2. Ad Slots Table
create table if not exists public.ad_slots (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  kind text check (kind in ('html', 'url')) not null,
  content text not null,
  active boolean default true not null,
  reward numeric(6,2) default 4.50 not null,
  clicks int default 0 not null,
  created_at timestamptz default now() not null
);

-- 3. Ad Views Table
create table if not exists public.ad_views (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  slot_id uuid references public.ad_slots(id) on delete set null,
  claimed boolean default false not null,
  claimed_at timestamptz,
  created_at timestamptz default now() not null
);

-- 4. Withdrawals Table
create table if not exists public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  method text check (method in ('JazzCash', 'Easypaisa')) not null,
  account_title text not null,
  account_number text not null,
  amount numeric(10,2) not null,
  status text check (status in ('pending', 'approved', 'rejected')) default 'pending' not null,
  created_at timestamptz default now() not null,
  reviewed_at timestamptz
);

-- 5. Transactions Table
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text check (type in ('credit', 'debit')) not null,
  amount numeric(10,2) not null,
  description text not null,
  created_at timestamptz default now() not null
);

-- 6. RPC: Pre-check device (from fix.sql)
create or replace function public.device_taken(p_device text)
returns boolean language sql security definer stable set search_path=public as $$
  select exists(select 1 from public.profiles where device_id = p_device);
$$;
grant execute on function public.device_taken(text) to anon, authenticated;

-- 7. Trigger on auth.users for automatic profile creation
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare
  ref_id uuid := null;
  u_code text;
  provided_ref text;
  provided_device text;
  provided_name text;
begin
  provided_ref := (new.raw_user_meta_data->>'ref');
  provided_device := (new.raw_user_meta_data->>'device_id');
  provided_name := coalesce(new.raw_user_meta_data->>'name', 'User');

  -- Generate user code e.g. PK-1234
  u_code := 'PK-' || floor(1000 + random() * 9000)::text;

  if provided_ref is not null and provided_ref != '' then
    select id into ref_id from public.profiles where user_code = provided_ref limit 1;
  end if;

  insert into public.profiles (id, name, user_code, referrer, device_id, balance, ads_today, ads_total, is_admin)
  values (new.id, provided_name, u_code, ref_id, provided_device, 0.00, 0, 0, false);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.ad_slots enable row level security;
alter table public.ad_views enable row level security;
alter table public.withdrawals enable row level security;
alter table public.transactions enable row level security;

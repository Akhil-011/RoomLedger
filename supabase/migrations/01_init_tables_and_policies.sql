-- 01_init_tables_and_policies.sql
-- Create tables and apply row-level security policies

-- Enable pgcrypto for gen_random_uuid
create extension if not exists pgcrypto;

-- profiles table
create table if not exists public.profiles (
  id uuid not null,
  name text null,
  email text not null,
  created_at timestamptz not null default now(),
  username text null,
  constraint profiles_pkey primary key (id),
  constraint profiles_email_key unique (email)
);

-- rooms table
create table if not exists public.rooms (
  id uuid not null default gen_random_uuid(),
  room_name text not null,
  room_password_hash text not null,
  owner_id uuid not null,
  max_members integer not null default 4,
  created_at timestamptz not null default now(),
  room_code text null,
  constraint rooms_pkey primary key (id),
  constraint rooms_room_code_unique unique (room_code),
  constraint rooms_room_name_key unique (room_name)
);

create index if not exists idx_rooms_owner_id on public.rooms using btree (owner_id);

-- expenses table
create table if not exists public.expenses (
  id uuid not null default gen_random_uuid(),
  room_id uuid not null,
  user_id uuid not null,
  product_name text not null,
  price numeric(10,2) not null,
  created_at timestamptz not null default now(),
  constraint expenses_pkey primary key (id)
);

create index if not exists idx_expenses_room_id on public.expenses using btree (room_id);
create index if not exists idx_expenses_user_id on public.expenses using btree (user_id);

-- Foreign keys (add after tables created)
alter table public.profiles
  add constraint profiles_id_fkey foreign key (id) references auth.users (id) on delete cascade;

alter table public.rooms
  add constraint rooms_owner_id_fkey foreign key (owner_id) references public.profiles (id) on delete cascade;

alter table public.expenses
  add constraint expenses_room_id_fkey foreign key (room_id) references public.rooms (id) on delete cascade,
  add constraint expenses_user_id_fkey foreign key (user_id) references public.profiles (id) on delete cascade;

-- Enable Row Level Security for tables
alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.expenses enable row level security;

-- Policies for profiles
-- Allow authenticated users to select profiles (you may restrict further if needed)
create policy if not exists "select_profiles_authenticated" on public.profiles for select using (auth.uid() is not null);
-- Allow users to insert their own profile (id must equal auth.uid())
create policy if not exists "insert_own_profile" on public.profiles for insert with check (auth.uid() = id);
-- Allow users to update their own profile
create policy if not exists "update_own_profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- Policies for rooms
-- Allow authenticated users to insert rooms (owner_id must equal auth.uid())
create policy if not exists "insert_own_room" on public.rooms for insert with check (auth.uid() = owner_id);
-- Allow owners to update their rooms
create policy if not exists "update_owner_room" on public.rooms for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
-- Allow owners to delete their rooms
create policy if not exists "delete_owner_room" on public.rooms for delete using (auth.uid() = owner_id);

-- Policies for expenses
-- Allow authenticated users to insert an expense (user_id must equal auth.uid())
create policy if not exists "insert_own_expense" on public.expenses for insert with check (auth.uid() = user_id);
-- Allow users to update/delete their own expenses
create policy if not exists "update_own_expense" on public.expenses for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy if not exists "delete_own_expense" on public.expenses for delete using (auth.uid() = user_id);

-- Note: We intentionally do NOT open broad SELECT access to these tables.
-- Instead we provide an RPC to expose aggregated site stats safely.

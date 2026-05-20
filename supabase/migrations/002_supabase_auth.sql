-- Migrate from NextAuth schema to Supabase Auth
-- Run this in Supabase SQL Editor

-- ============================================================
-- 1. Drop next_auth schema (no longer needed)
-- ============================================================
drop schema if exists next_auth cascade;

-- ============================================================
-- 2. Rebuild public.profiles referencing auth.users
-- ============================================================
drop table if exists public.profiles;

create table public.profiles (
  id         uuid not null references auth.users (id) on delete cascade,
  name       text,
  email      text,
  avatar_url text,
  created_at timestamptz not null default now(),
  primary key (id)
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (id = auth.uid());

create policy "Users can update own profile"
  on public.profiles for update
  using (id = auth.uid());

-- ============================================================
-- 3. Trigger: auto-create profile on first Supabase Auth sign-in
-- ============================================================
create or replace function public.handle_new_user()
  returns trigger
  language plpgsql
  security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

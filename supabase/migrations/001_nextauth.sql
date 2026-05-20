-- NextAuth.js Supabase Adapter — required tables
-- Run this in the Supabase SQL Editor

-- ============================================================
-- 1. next_auth schema (isolated from public)
-- ============================================================
create schema if not exists next_auth;

grant usage on schema next_auth to service_role;
grant all on schema next_auth to postgres;

-- ============================================================
-- 2. users
-- ============================================================
create table if not exists next_auth.users (
  id              uuid not null default gen_random_uuid(),
  name            text,
  email           text not null,
  "emailVerified" timestamptz,
  image           text,
  primary key (id)
);

grant all on next_auth.users to postgres, service_role;
create unique index if not exists email_unique on next_auth.users (email);

-- ============================================================
-- 3. accounts
-- ============================================================
create table if not exists next_auth.accounts (
  id                   uuid not null default gen_random_uuid(),
  type                 text not null,
  provider             text not null,
  "providerAccountId"  text not null,
  refresh_token        text,
  access_token         text,
  expires_at           bigint,
  token_type           text,
  scope                text,
  id_token             text,
  session_state        text,
  oauth_token_secret   text,
  oauth_token          text,
  "userId"             uuid references next_auth.users (id) on delete cascade,
  primary key (id)
);

grant all on next_auth.accounts to postgres, service_role;
create unique index if not exists provider_unique on next_auth.accounts (provider, "providerAccountId");

-- ============================================================
-- 4. sessions
-- ============================================================
create table if not exists next_auth.sessions (
  id             uuid not null default gen_random_uuid(),
  expires        timestamptz not null,
  "sessionToken" text not null,
  "userId"       uuid references next_auth.users (id) on delete cascade,
  primary key (id)
);

grant all on next_auth.sessions to postgres, service_role;
create unique index if not exists session_token_unique on next_auth.sessions ("sessionToken");

-- ============================================================
-- 5. verification_tokens
-- ============================================================
create table if not exists next_auth.verification_tokens (
  identifier text,
  token      text,
  expires    timestamptz not null,
  primary key (identifier, token)
);

grant all on next_auth.verification_tokens to postgres, service_role;

-- ============================================================
-- 6. public.profiles — app user data, RLS enabled
-- ============================================================
create table if not exists public.profiles (
  id         uuid not null references next_auth.users (id) on delete cascade,
  name       text,
  email      text,
  avatar_url text,
  created_at timestamptz not null default now(),
  primary key (id)
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (id = (auth.uid()));

create policy "Users can update own profile"
  on public.profiles for update
  using (id = (auth.uid()));

-- ============================================================
-- 7. Auto-create profile on first sign-in
-- ============================================================
create or replace function public.handle_new_next_auth_user()
  returns trigger
  language plpgsql
  security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, avatar_url)
  values (new.id, new.name, new.email, new.image)
  on conflict (id) do nothing;
  return new;
end;
$$;

create or replace trigger on_next_auth_user_created
  after insert on next_auth.users
  for each row execute procedure public.handle_new_next_auth_user();

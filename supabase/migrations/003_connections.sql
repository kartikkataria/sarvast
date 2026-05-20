-- User integration connections
-- Run this in Supabase SQL Editor

create table if not exists public.connections (
  id                  uuid not null default gen_random_uuid(),
  user_id             uuid not null references auth.users (id) on delete cascade,
  provider            text not null,
  provider_account_id text,
  access_token        text,
  refresh_token       text,
  expires_at          timestamptz,
  scopes              text[],
  metadata            jsonb not null default '{}',
  connected_at        timestamptz not null default now(),
  primary key (id),
  unique (user_id, provider)
);

alter table public.connections enable row level security;

create policy "Users can read own connections"
  on public.connections for select
  using (user_id = auth.uid());

create policy "Users can insert own connections"
  on public.connections for insert
  with check (user_id = auth.uid());

create policy "Users can update own connections"
  on public.connections for update
  using (user_id = auth.uid());

create policy "Users can delete own connections"
  on public.connections for delete
  using (user_id = auth.uid());

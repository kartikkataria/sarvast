-- User settings — digital presence
create table if not exists public.user_settings (
  user_id          uuid not null references auth.users (id) on delete cascade,
  website          text,
  marketplace_links text[] not null default '{}',
  updated_at       timestamptz not null default now(),
  primary key (user_id)
);

alter table public.user_settings enable row level security;

create policy "Users can manage own settings"
  on public.user_settings for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

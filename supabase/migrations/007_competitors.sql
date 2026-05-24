-- Para — Competition Intelligence
create table if not exists public.competitors (
  id          uuid not null default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  domain      text not null,
  name        text,
  analysis    jsonb,
  analyzed_at timestamptz,
  created_at  timestamptz not null default now(),
  primary key (id),
  unique (user_id, domain)
);

alter table public.competitors enable row level security;

create policy "Users can manage own competitors"
  on public.competitors for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

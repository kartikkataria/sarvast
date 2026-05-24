-- Content posts for all platforms
create table if not exists public.content_posts (
  id               uuid not null default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  platform         text not null default 'instagram',
  caption          text not null,
  media_url        text,          -- public image URL for posting
  status           text not null default 'draft', -- draft | scheduled | published | failed
  scheduled_at     timestamptz,
  published_at     timestamptz,
  platform_post_id text,          -- Instagram media ID after publishing
  error_message    text,
  created_at       timestamptz not null default now(),
  primary key (id)
);

alter table public.content_posts enable row level security;

create policy "Users can manage own posts"
  on public.content_posts for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

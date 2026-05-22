-- Vyas — Context Library
-- Run this in Supabase SQL Editor

-- ============================================================
-- 1. context_documents table
-- ============================================================
create table if not exists public.context_documents (
  id          uuid not null default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  description text,
  file_path   text not null,  -- storage path: {user_id}/{filename}
  file_type   text not null,  -- mime type
  file_size   bigint not null,
  tags        text[] not null default '{}',
  created_at  timestamptz not null default now(),
  primary key (id)
);

alter table public.context_documents enable row level security;

create policy "Users can read own documents"
  on public.context_documents for select
  using (user_id = auth.uid());

create policy "Users can insert own documents"
  on public.context_documents for insert
  with check (user_id = auth.uid());

create policy "Users can delete own documents"
  on public.context_documents for delete
  using (user_id = auth.uid());

-- ============================================================
-- 2. Storage bucket for context files
-- ============================================================
insert into storage.buckets (id, name, public)
values ('context-library', 'context-library', false)
on conflict (id) do nothing;

create policy "Users can upload own files"
  on storage.objects for insert
  with check (bucket_id = 'context-library' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can read own files"
  on storage.objects for select
  using (bucket_id = 'context-library' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own files"
  on storage.objects for delete
  using (bucket_id = 'context-library' and auth.uid()::text = (storage.foldername(name))[1]);

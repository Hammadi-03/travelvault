-- ============================================================
-- TravelVault – Supabase Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Profiles ─────────────────────────────────────────────────
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null,
  display_name text not null,
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Everyone in the app can read all profiles (needed for uploader info in gallery)
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  using (auth.role() = 'authenticated');

-- Users can only update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ── Media ─────────────────────────────────────────────────────
create table if not exists public.media (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  file_name     text not null,
  file_path     text not null unique,
  file_type     text not null check (file_type in ('image', 'video')),
  mime_type     text not null,
  file_size     bigint not null,
  width         integer,
  height        integer,
  duration      numeric,
  public_url    text not null,
  thumbnail_url text,
  created_at    timestamptz not null default now()
);

alter table public.media enable row level security;

-- All authenticated users can view all media
create policy "Media viewable by authenticated users"
  on public.media for select
  using (auth.role() = 'authenticated');

-- Users can only insert their own media
create policy "Users can insert own media"
  on public.media for insert
  with check (auth.uid() = user_id);

-- Users can only delete their own media
create policy "Users can delete own media"
  on public.media for delete
  using (auth.uid() = user_id);

-- Indexes for performance
create index if not exists media_user_id_idx on public.media(user_id);
create index if not exists media_created_at_idx on public.media(created_at desc);
create index if not exists media_file_name_idx on public.media using gin(file_name gin_trgm_ops);

-- Enable trigram extension for fuzzy search
create extension if not exists pg_trgm;

-- ── Storage Buckets ───────────────────────────────────────────
-- Run in Supabase Dashboard > Storage, or via SQL:

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Storage policies for media bucket
create policy "Authenticated users can upload media"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'media' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Media is publicly viewable"
  on storage.objects for select
  to public
  using (bucket_id = 'media');

create policy "Users can delete own media files"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'media' and auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for avatars bucket
create policy "Authenticated users can upload avatars"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[2]);

create policy "Avatars are publicly viewable"
  on storage.objects for select
  to public
  using (bucket_id = 'avatars');

create policy "Users can update own avatar"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[2]);

-- ── Auto-create profile on signup ────────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

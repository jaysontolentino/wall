-- Run in your Supabase project's SQL Editor. Safe to rerun.
-- This is a public guest wall: anyone can read and add posts/photos.
-- Visitors cannot edit or delete records through these policies.
begin;

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  body text,
  created_at timestamptz default now(),
  photo_url text,
  author_name text not null default 'Guest',
  constraint posts_body_check check (char_length(body) <= 280)
);

-- Compatible with the existing table in the reference screenshot.
alter table public.posts add column if not exists author_name text not null default 'Guest';
alter table public.posts add column if not exists photo_url text;
alter table public.posts alter column created_at set default now();

do $$ begin
  if not exists (select 1 from pg_constraint where conrelid = 'public.posts'::regclass and conname = 'wall_post_content') then
    alter table public.posts add constraint wall_post_content check (
      char_length(coalesce(body, '')) <= 280
      and (length(btrim(coalesce(body, ''))) > 0 or length(coalesce(photo_url, '')) > 0)
      and author_name is not null and char_length(btrim(author_name)) between 1 and 60
    ) not valid;
  end if;
end $$;

create index if not exists posts_created_at_idx on public.posts (created_at desc);
alter table public.posts enable row level security;
grant select, insert on public.posts to anon, authenticated;

drop policy if exists "Wall posts are readable" on public.posts;
create policy "Wall posts are readable" on public.posts for select to anon, authenticated using (true);
drop policy if exists "Guests can write wall posts" on public.posts;
create policy "Guests can write wall posts" on public.posts for insert to anon, authenticated
with check (user_id is null and char_length(btrim(author_name)) between 1 and 60
  and char_length(coalesce(body, '')) <= 280
  and (length(btrim(coalesce(body, ''))) > 0 or length(coalesce(photo_url, '')) > 0));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('wall-photos', 'wall-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/gif'])
on conflict (id) do update set public = excluded.public,
  file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Guests can upload wall photos" on storage.objects;
create policy "Guests can upload wall photos" on storage.objects for insert to anon, authenticated
with check (bucket_id = 'wall-photos' and (storage.foldername(name))[1] = 'posts'
  and lower(storage.extension(name)) in ('jpg', 'png', 'gif'));

-- Public buckets serve images without a SELECT policy. No client overwrite/delete access.
do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'posts'
  ) then
    alter publication supabase_realtime add table public.posts;
  end if;
end $$;

commit;

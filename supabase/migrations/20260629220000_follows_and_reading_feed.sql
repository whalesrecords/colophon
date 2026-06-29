-- One-way "follow" (lighter than a friendship) to curate a reading feed.
create table if not exists public.follows (
  follower_id uuid not null default auth.uid(),
  followee_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);
create index if not exists follows_followee_idx on public.follows (followee_id);
alter table public.follows enable row level security;

create policy "follows select mine" on public.follows
  for select to authenticated using (follower_id = auth.uid() or followee_id = auth.uid());
create policy "follows insert self" on public.follows
  for insert to authenticated with check (follower_id = auth.uid());
create policy "follows delete self" on public.follows
  for delete to authenticated using (follower_id = auth.uid());

-- Feed: recent books finished by people I follow (title, cover, rating, date).
create or replace function public.reading_feed()
returns table (
  user_id uuid, display_name text, pseudo text, avatar_path text,
  title text, cover_url text, isbn13 text, rating numeric, finished_on date
)
language sql
security definer
stable
set search_path = public
as $function$
  select
    p.user_id, p.display_name, p.pseudo, p.avatar_path,
    bm.title, coalesce(it.cover_override, bm.cover_url) as cover_url, it.isbn13,
    it.rating, rs.finished_on
  from public.follows f
  join public.items it on it.user_id = f.followee_id
  join public.reading_sessions rs
    on rs.item_id = it.id and rs.status = 'finished' and rs.finished_on is not null
  join public.profiles p on p.user_id = f.followee_id
  left join public.book_metadata bm on bm.isbn13 = it.isbn13
  where f.follower_id = auth.uid()
  order by rs.finished_on desc, rs.created_at desc
  limit 60;
$function$;
revoke execute on function public.reading_feed() from anon, public;
grant execute on function public.reading_feed() to authenticated;

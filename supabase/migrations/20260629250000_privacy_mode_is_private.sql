-- Master privacy switch: Secret = excluded from every social surface.
alter table public.profiles add column if not exists is_private boolean not null default false;

-- 1. Discovery: never suggest a private reader.
create or replace function public.suggested_readers(p_limit integer default 12)
returns table(user_id uuid, display_name text, pseudo text, avatar_path text, shared integer, sample_genres text[])
language sql stable security definer set search_path to ''
as $function$
  with me_genres as (
    select distinct gg as genre
    from public.items i
    join public.book_metadata b on b.isbn13 = i.isbn13
    cross join lateral unnest(coalesce(b.genres, '{}'::text[])) as gg
    where i.user_id = (select auth.uid())
  ),
  other_genres as (
    select i.user_id, gg as genre
    from public.items i
    join public.book_metadata b on b.isbn13 = i.isbn13
    cross join lateral unnest(coalesce(b.genres, '{}'::text[])) as gg
    where i.user_id <> (select auth.uid()) and gg in (select genre from me_genres)
  )
  select o.user_id, p.display_name, p.pseudo, p.avatar_path,
         count(distinct o.genre)::int as shared,
         (array_agg(distinct o.genre))[1:3] as sample_genres
  from other_genres o
  join public.profiles p on p.user_id = o.user_id
  where not coalesce(p.is_private, false)
    and not public.are_friends(o.user_id, (select auth.uid()))
    and not exists (
      select 1 from public.friendships f
      where (f.requester = (select auth.uid()) and f.addressee = o.user_id)
         or (f.requester = o.user_id and f.addressee = (select auth.uid()))
    )
  group by o.user_id, p.display_name, p.pseudo, p.avatar_path
  order by shared desc, o.user_id
  limit p_limit;
$function$;

-- 2. Reader profile: hidden (null) to everyone but the user themselves.
create or replace function public.reader_profile(p_user uuid)
returns json language sql stable security definer set search_path to ''
as $function$
  with owned as (
    select i.status, i.added_at, i.isbn13, b.title, b.cover_url, b.genres, b.authors
    from public.items i
    join public.book_metadata b on b.isbn13 = i.isbn13
    where i.user_id = p_user and i.ownership <> 'wishlist'
  ),
  g as (select gg as v, count(*) c from owned cross join lateral unnest(coalesce(genres,'{}'::text[])) gg group by gg order by count(*) desc limit 5),
  a as (select aa as v, count(*) c from owned cross join lateral unnest(coalesce(authors,'{}'::text[])) aa group by aa order by count(*) desc limit 5),
  recent as (select title, cover_url, isbn13 from owned where status = 'read' order by added_at desc limit 12)
  select json_build_object(
    'user_id', p.user_id,
    'display_name', p.display_name,
    'pseudo', p.pseudo,
    'avatar_path', p.avatar_path,
    'bio', p.bio,
    'books', (select count(*) from owned),
    'read', (select count(*) from owned where status = 'read'),
    'top_genres', coalesce((select json_agg(v) from g), '[]'::json),
    'top_authors', coalesce((select json_agg(v) from a), '[]'::json),
    'recent', coalesce((select json_agg(json_build_object('title', title, 'cover_url', cover_url, 'isbn13', isbn13)) from recent), '[]'::json),
    'friend_status', case
      when p_user = (select auth.uid()) then 'self'
      when public.are_friends(p_user, (select auth.uid())) then 'friends'
      when exists (select 1 from public.friendships f where f.requester = (select auth.uid()) and f.addressee = p_user and f.status = 'pending') then 'pending_out'
      when exists (select 1 from public.friendships f where f.requester = p_user and f.addressee = (select auth.uid()) and f.status = 'pending') then 'pending_in'
      else 'none' end
  )
  from public.profiles p
  where p.user_id = p_user
    and (p.user_id = (select auth.uid()) or not coalesce(p.is_private, false));
$function$;

-- 3. "En ce moment": private readers never broadcast their current read.
create or replace function public.friends_current_reading()
returns table (user_id uuid, display_name text, pseudo text, avatar_path text, title text, cover_url text, isbn13 text, current_page int, total_pages int)
language sql security definer stable set search_path = public
as $function$
  with friends as (
    select case when f.requester = auth.uid() then f.addressee else f.requester end as fid
    from public.friendships f
    where f.status = 'accepted' and (f.requester = auth.uid() or f.addressee = auth.uid())
  ),
  ranked as (
    select it.user_id as fid, bm.title as title,
      coalesce(it.cover_override, bm.cover_url) as cover_url, it.isbn13 as isbn13,
      rs.current_page as current_page, rs.total_pages as total_pages,
      row_number() over (partition by it.user_id order by rs.started_on desc nulls last, rs.created_at desc) as rn
    from public.reading_sessions rs
    join public.items it on it.id = rs.item_id
    join friends fr on fr.fid = it.user_id
    join public.profiles p on p.user_id = it.user_id
    left join public.book_metadata bm on bm.isbn13 = it.isbn13
    where rs.status = 'reading'
      and coalesce(p.share_current_reading, true) = true
      and coalesce(p.is_private, false) = false
  )
  select p.user_id, p.display_name, p.pseudo, p.avatar_path,
    r.title, r.cover_url, r.isbn13, r.current_page, r.total_pages
  from ranked r join public.profiles p on p.user_id = r.fid where r.rn = 1;
$function$;

-- 4. Feed: a private reader's finished books don't appear in followers' feeds.
create or replace function public.reading_feed()
returns table (user_id uuid, display_name text, pseudo text, avatar_path text, title text, cover_url text, isbn13 text, rating numeric, finished_on date, body text)
language sql security definer stable set search_path = public
as $function$
  select p.user_id, p.display_name, p.pseudo, p.avatar_path,
    bm.title, coalesce(it.cover_override, bm.cover_url) as cover_url, it.isbn13,
    it.rating, rs.finished_on,
    case when it.review_shared then nullif(btrim(it.notes), '') end as body
  from public.follows f
  join public.items it on it.user_id = f.followee_id
  join public.reading_sessions rs on rs.item_id = it.id and rs.status = 'finished' and rs.finished_on is not null
  join public.profiles p on p.user_id = f.followee_id
  left join public.book_metadata bm on bm.isbn13 = it.isbn13
  where f.follower_id = auth.uid() and coalesce(p.is_private, false) = false
  order by rs.finished_on desc, rs.created_at desc
  limit 60;
$function$;

-- 5+6. Leaderboards: private readers hidden from others (but still see themselves).
create or replace function public.friends_leaderboard()
returns table(user_id uuid, display_name text, pseudo text, avatar_path text, pages integer)
language sql stable security definer set search_path to 'public'
as $function$
  with people as (
    select auth.uid() as uid
    union
    select case when f.requester = auth.uid() then f.addressee else f.requester end
    from public.friendships f
    where f.status = 'accepted' and (f.requester = auth.uid() or f.addressee = auth.uid())
  )
  select p.user_id, p.display_name, p.pseudo, p.avatar_path,
    coalesce((select sum(dr.pages)::int from public.daily_reading dr where dr.user_id = pe.uid and dr.day >= current_date - 6), 0) as pages
  from people pe
  join public.profiles p on p.user_id = pe.uid
  where p.user_id = auth.uid() or not coalesce(p.is_private, false)
  order by pages desc, p.display_name nulls last;
$function$;

create or replace function public.circle_leaderboard(p_circle uuid)
returns table(user_id uuid, display_name text, pseudo text, avatar_path text, pages integer)
language sql stable security definer set search_path to 'public'
as $function$
  select p.user_id, p.display_name, p.pseudo, p.avatar_path,
    coalesce((select sum(dr.pages)::int from public.daily_reading dr where dr.user_id = cm.user_id and dr.day >= current_date - 6), 0) as pages
  from public.circle_members cm
  join public.profiles p on p.user_id = cm.user_id
  where cm.circle_id = p_circle
    and public.is_circle_member(p_circle, auth.uid())
    and (p.user_id = auth.uid() or not coalesce(p.is_private, false))
  order by pages desc, p.display_name nulls last;
$function$;

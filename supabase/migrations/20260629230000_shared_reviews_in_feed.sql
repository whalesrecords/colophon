-- Opt-in: share your written review (items.notes) into followers' feeds.
alter table public.items add column if not exists review_shared boolean not null default false;

drop function if exists public.reading_feed();

-- Feed now carries the review text when the reader chose to share it.
create function public.reading_feed()
returns table (
  user_id uuid, display_name text, pseudo text, avatar_path text,
  title text, cover_url text, isbn13 text, rating numeric, finished_on date, body text
)
language sql
security definer
stable
set search_path = public
as $function$
  select
    p.user_id, p.display_name, p.pseudo, p.avatar_path,
    bm.title, coalesce(it.cover_override, bm.cover_url) as cover_url, it.isbn13,
    it.rating, rs.finished_on,
    case when it.review_shared then nullif(btrim(it.notes), '') end as body
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

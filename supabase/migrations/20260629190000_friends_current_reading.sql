-- Opt-out privacy flag for sharing your current read (default: shared).
alter table public.profiles
  add column if not exists share_current_reading boolean not null default true;

-- What my accepted friends are reading right now — only those who share it.
-- SECURITY DEFINER + auth.uid()-scoped to friends, so it leaks nothing else.
create or replace function public.friends_current_reading()
returns table (
  user_id uuid,
  display_name text,
  pseudo text,
  avatar_path text,
  title text,
  cover_url text,
  isbn13 text,
  current_page int,
  total_pages int
)
language sql
security definer
stable
set search_path = public
as $function$
  with friends as (
    select case when f.requester = auth.uid() then f.addressee else f.requester end as fid
    from public.friendships f
    where f.status = 'accepted'
      and (f.requester = auth.uid() or f.addressee = auth.uid())
  ),
  ranked as (
    select
      it.user_id as fid,
      bm.title as title,
      coalesce(it.cover_override, bm.cover_url) as cover_url,
      it.isbn13 as isbn13,
      rs.current_page as current_page,
      rs.total_pages as total_pages,
      row_number() over (
        partition by it.user_id
        order by rs.started_on desc nulls last, rs.created_at desc
      ) as rn
    from public.reading_sessions rs
    join public.items it on it.id = rs.item_id
    join friends fr on fr.fid = it.user_id
    join public.profiles p on p.user_id = it.user_id
    left join public.book_metadata bm on bm.isbn13 = it.isbn13
    where rs.status = 'reading'
      and coalesce(p.share_current_reading, true) = true
  )
  select
    p.user_id, p.display_name, p.pseudo, p.avatar_path,
    r.title, r.cover_url, r.isbn13, r.current_page, r.total_pages
  from ranked r
  join public.profiles p on p.user_id = r.fid
  where r.rn = 1;
$function$;
revoke execute on function public.friends_current_reading() from anon, public;
grant execute on function public.friends_current_reading() to authenticated;

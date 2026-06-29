-- Weekly pages leaderboard among me + my accepted friends (last 7 days).
-- SECURITY DEFINER + auth.uid()-scoped; aggregate pages only, no titles/notes.
create or replace function public.friends_leaderboard()
returns table (user_id uuid, display_name text, pseudo text, avatar_path text, pages int)
language sql
security definer
stable
set search_path = public
as $function$
  with people as (
    select auth.uid() as uid
    union
    select case when f.requester = auth.uid() then f.addressee else f.requester end
    from public.friendships f
    where f.status = 'accepted' and (f.requester = auth.uid() or f.addressee = auth.uid())
  )
  select
    p.user_id, p.display_name, p.pseudo, p.avatar_path,
    coalesce((
      select sum(dr.pages)::int from public.daily_reading dr
      where dr.user_id = pe.uid and dr.day >= current_date - 6
    ), 0) as pages
  from people pe
  join public.profiles p on p.user_id = pe.uid
  order by pages desc, p.display_name nulls last;
$function$;
revoke execute on function public.friends_leaderboard() from anon, public;
grant execute on function public.friends_leaderboard() to authenticated;

-- Weekly pages leaderboard for a circle — members only (is_circle_member gate).
create or replace function public.circle_leaderboard(p_circle uuid)
returns table (user_id uuid, display_name text, pseudo text, avatar_path text, pages int)
language sql
security definer
stable
set search_path = public
as $function$
  select
    p.user_id, p.display_name, p.pseudo, p.avatar_path,
    coalesce((
      select sum(dr.pages)::int from public.daily_reading dr
      where dr.user_id = cm.user_id and dr.day >= current_date - 6
    ), 0) as pages
  from public.circle_members cm
  join public.profiles p on p.user_id = cm.user_id
  where cm.circle_id = p_circle
    and public.is_circle_member(p_circle, auth.uid())
  order by pages desc, p.display_name nulls last;
$function$;
revoke execute on function public.circle_leaderboard(uuid) from anon, public;
grant execute on function public.circle_leaderboard(uuid) to authenticated;

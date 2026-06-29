-- Follower / following counts for any reader (RLS-safe via SECURITY DEFINER).
create or replace function public.follow_counts(p_user uuid)
returns table (followers int, following int)
language sql
security definer
stable
set search_path = public
as $function$
  select
    (select count(*)::int from public.follows where followee_id = p_user) as followers,
    (select count(*)::int from public.follows where follower_id = p_user) as following;
$function$;
revoke execute on function public.follow_counts(uuid) from anon, public;
grant execute on function public.follow_counts(uuid) to authenticated;

-- Estimated resale value (what a copy is worth today, vs purchase_price = what it cost).
alter table public.items add column if not exists estimated_value numeric;

-- Reading-TIME tracking (the chronometer): a per-session minutes accumulator + a
-- per-day minutes rollup, mirroring reading_day/daily_reading for pages. Lets the
-- app (and the watchOS app) time a reading session and surface "temps de lecture".
alter table public.reading_sessions add column if not exists minutes int not null default 0;
alter table public.daily_reading add column if not exists minutes int not null default 0;

-- Credit p_minutes to a session's chronometer AND to today's per-day rollup.
-- SECURITY DEFINER: sessions have no user_id, so ownership is checked via the parent
-- item; the function only ever touches the caller's own rows.
create or replace function public.log_reading_minutes(p_session uuid, p_minutes int)
returns void
language plpgsql
security definer
set search_path = public
as $function$
declare v_uid uuid;
begin
  if p_minutes is null or p_minutes <= 0 then return; end if;
  select i.user_id into v_uid
  from public.reading_sessions rs
  join public.items i on i.id = rs.item_id
  where rs.id = p_session and i.user_id = auth.uid();
  if v_uid is null then return; end if;

  update public.reading_sessions
    set minutes = greatest(0, minutes) + p_minutes
    where id = p_session;

  insert into public.daily_reading (user_id, day, minutes)
  values (v_uid, current_date, p_minutes)
  on conflict (user_id, day)
    do update set minutes = public.daily_reading.minutes + excluded.minutes;
end;
$function$;
revoke execute on function public.log_reading_minutes(uuid, int) from anon, public;
grant execute on function public.log_reading_minutes(uuid, int) to authenticated;

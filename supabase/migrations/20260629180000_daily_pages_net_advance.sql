-- Count daily pages as the NET advance per session today (current_page minus the
-- page at the start of today), not the sum of forward deltas — so corrections /
-- back-and-forth don't inflate the count.
create table if not exists public.reading_day (
  session_id uuid not null references public.reading_sessions(id) on delete cascade,
  user_id uuid not null,
  day date not null default current_date,
  start_page int not null default 0,
  end_page int not null default 0,
  primary key (session_id, day)
);
alter table public.reading_day enable row level security;
create policy "reading_day own select" on public.reading_day
  for select to authenticated using (user_id = auth.uid());

create or replace function public.record_reading_page(p_session uuid, p_page int)
returns void
language plpgsql
security definer
set search_path = public
as $function$
declare v_old int; v_uid uuid; v_total int;
begin
  -- ownership check (sessions have no user_id; owner is the item's user) + old page
  select rs.current_page, i.user_id into v_old, v_uid
  from public.reading_sessions rs
  join public.items i on i.id = rs.item_id
  where rs.id = p_session and i.user_id = auth.uid();
  if v_uid is null then return; end if;

  update public.reading_sessions set current_page = greatest(0, p_page) where id = p_session;

  insert into public.reading_day (session_id, user_id, day, start_page, end_page)
  values (p_session, v_uid, current_date, coalesce(v_old, 0), greatest(0, p_page))
  on conflict (session_id, day) do update set end_page = greatest(0, p_page);

  select coalesce(sum(greatest(0, end_page - start_page)), 0) into v_total
  from public.reading_day where user_id = v_uid and day = current_date;

  insert into public.daily_reading (user_id, day, pages)
  values (v_uid, current_date, v_total)
  on conflict (user_id, day) do update set pages = v_total;
end;
$function$;
revoke execute on function public.record_reading_page(uuid, int) from anon, public;
grant execute on function public.record_reading_page(uuid, int) to authenticated;

-- NOTE: today's previously-inflated daily_reading values were corrected as a one-off
-- data fix (not part of this schema migration). From here on, only record_reading_page
-- (genuine page tracking) feeds reading_day → daily_reading, so bulk "mark as read"
-- operations no longer inflate the daily goal.

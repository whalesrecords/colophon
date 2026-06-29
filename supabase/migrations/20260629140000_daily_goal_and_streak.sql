-- Daily reading goal + per-day pages log (the foundation for streaks).
alter table public.profiles add column if not exists daily_goal int;

create table if not exists public.daily_reading (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  day date not null default current_date,
  pages int not null default 0,
  primary key (user_id, day)
);

alter table public.daily_reading enable row level security;
create policy "daily_reading own select" on public.daily_reading
  for select to authenticated using (user_id = auth.uid());
create policy "daily_reading own insert" on public.daily_reading
  for insert to authenticated with check (user_id = auth.uid());
create policy "daily_reading own update" on public.daily_reading
  for update to authenticated using (user_id = auth.uid());

-- Increment today's pages atomically (SECURITY DEFINER so the upsert+increment is
-- one round-trip and RLS-safe — it only ever touches the caller's own row).
create or replace function public.log_daily_pages(p_pages int)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.daily_reading (user_id, day, pages)
  values (auth.uid(), current_date, greatest(0, p_pages))
  on conflict (user_id, day)
  do update set pages = public.daily_reading.pages + greatest(0, excluded.pages);
$$;

revoke execute on function public.log_daily_pages(int) from anon, public;
grant execute on function public.log_daily_pages(int) to authenticated;

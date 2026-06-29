-- Time-boxed reading challenges, scoped to a circle (members create/join/compete).
create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles(id) on delete cascade,
  created_by uuid not null default auth.uid(),
  title text not null,
  goal_type text not null default 'pages' check (goal_type in ('pages', 'books')),
  target int not null check (target > 0),
  starts_on date not null default current_date,
  ends_on date not null,
  created_at timestamptz not null default now()
);
create index if not exists challenges_circle_idx on public.challenges (circle_id);

create table if not exists public.challenge_participants (
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  joined_at timestamptz not null default now(),
  primary key (challenge_id, user_id)
);

alter table public.challenges enable row level security;
alter table public.challenge_participants enable row level security;

create policy "challenges select" on public.challenges
  for select to authenticated using (public.is_circle_member(circle_id, auth.uid()));
create policy "challenges insert" on public.challenges
  for insert to authenticated
  with check (created_by = auth.uid() and public.is_circle_member(circle_id, auth.uid()));
create policy "challenges delete own" on public.challenges
  for delete to authenticated using (created_by = auth.uid());

create policy "participants select" on public.challenge_participants
  for select to authenticated using (
    exists (
      select 1 from public.challenges c
      where c.id = challenge_id and public.is_circle_member(c.circle_id, auth.uid())
    )
  );
create policy "participants join self" on public.challenge_participants
  for insert to authenticated with check (
    user_id = auth.uid() and exists (
      select 1 from public.challenges c
      where c.id = challenge_id and public.is_circle_member(c.circle_id, auth.uid())
    )
  );
create policy "participants leave self" on public.challenge_participants
  for delete to authenticated using (user_id = auth.uid());

-- Live progress: each participant's pages (or books finished) inside the window.
create or replace function public.challenge_progress(p_challenge uuid)
returns table (user_id uuid, display_name text, pseudo text, avatar_path text, value int)
language sql
security definer
stable
set search_path = public
as $function$
  with ch as (
    select c.circle_id, c.goal_type, c.starts_on, c.ends_on
    from public.challenges c where c.id = p_challenge
  )
  select
    p.user_id, p.display_name, p.pseudo, p.avatar_path,
    case (select goal_type from ch)
      when 'pages' then coalesce((
        select sum(dr.pages)::int from public.daily_reading dr
        where dr.user_id = p.user_id
          and dr.day between (select starts_on from ch) and (select ends_on from ch)
      ), 0)
      else coalesce((
        select count(*)::int from public.reading_sessions rs
        join public.items it on it.id = rs.item_id
        where it.user_id = p.user_id and rs.status = 'finished'
          and rs.finished_on between (select starts_on from ch) and (select ends_on from ch)
      ), 0)
    end as value
  from public.challenge_participants cp
  join public.profiles p on p.user_id = cp.user_id
  where cp.challenge_id = p_challenge
    and public.is_circle_member((select circle_id from ch), auth.uid())
  order by value desc, p.display_name nulls last;
$function$;
revoke execute on function public.challenge_progress(uuid) from anon, public;
grant execute on function public.challenge_progress(uuid) to authenticated;

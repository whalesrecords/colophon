-- RSVP / attendance for circle rendez-vous. A member sets their own status;
-- all members of the event's circle can see who's coming. Gated by is_circle_member.
create table public.circle_event_rsvps (
  event_id uuid not null references public.circle_events (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null check (status in ('going', 'maybe', 'no')),
  updated_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

alter table public.circle_event_rsvps enable row level security;

create policy circle_event_rsvps_select on public.circle_event_rsvps
  for select to authenticated
  using (
    exists (
      select 1 from public.circle_events e
      where e.id = event_id and public.is_circle_member(e.circle_id, (select auth.uid()))
    )
  );

create policy circle_event_rsvps_write on public.circle_event_rsvps
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid()) and exists (
      select 1 from public.circle_events e
      where e.id = event_id and public.is_circle_member(e.circle_id, (select auth.uid()))
    )
  );

alter publication supabase_realtime add table public.circle_event_rsvps;

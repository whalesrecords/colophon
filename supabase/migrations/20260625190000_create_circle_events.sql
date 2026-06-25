-- Shared agenda: circle meetings ("rendez-vous"). Member-readable; the creator
-- manages their own event. Gated by is_circle_member (same pattern as messages).
create table public.circle_events (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  location text,
  starts_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index circle_events_circle_starts_idx on public.circle_events (circle_id, starts_at);

alter table public.circle_events enable row level security;

create policy circle_events_select on public.circle_events
  for select to authenticated
  using (public.is_circle_member(circle_id, (select auth.uid())));
create policy circle_events_insert on public.circle_events
  for insert to authenticated
  with check (
    public.is_circle_member(circle_id, (select auth.uid())) and created_by = (select auth.uid())
  );
create policy circle_events_update on public.circle_events
  for update to authenticated
  using (created_by = (select auth.uid()))
  with check (
    public.is_circle_member(circle_id, (select auth.uid())) and created_by = (select auth.uid())
  );
create policy circle_events_delete on public.circle_events
  for delete to authenticated
  using (created_by = (select auth.uid()));

alter publication supabase_realtime add table public.circle_events;

-- Circle moderation (App Store UGC requirement): report messages + block users.

create table if not exists public.message_reports (
  id uuid primary key default gen_random_uuid(),
  message_id uuid references public.messages(id) on delete cascade,
  circle_id uuid not null references public.circles(id) on delete cascade,
  reporter_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  reported_user_id uuid references auth.users(id) on delete set null,
  reason text,
  created_at timestamptz not null default now()
);
alter table public.message_reports enable row level security;

create policy message_reports_insert on public.message_reports
  for insert to authenticated
  with check (reporter_id = auth.uid() and public.is_circle_member(circle_id, auth.uid()));

create policy message_reports_select_own on public.message_reports
  for select to authenticated
  using (reporter_id = auth.uid());

create table if not exists public.user_blocks (
  blocker_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);
alter table public.user_blocks enable row level security;

create policy user_blocks_all_own on public.user_blocks
  for all to authenticated
  using (blocker_id = auth.uid())
  with check (blocker_id = auth.uid());

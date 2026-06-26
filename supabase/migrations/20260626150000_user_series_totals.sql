-- Per-user override of a series' total volume count (editions differ — e.g. an
-- "édition spéciale" of 4 vs a standard edition of 8).
create table if not exists public.user_series_totals (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  normalized_key text not null,
  total_volumes int,
  updated_at timestamptz not null default now(),
  primary key (user_id, normalized_key)
);
alter table public.user_series_totals enable row level security;

create policy ust_all_own on public.user_series_totals
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

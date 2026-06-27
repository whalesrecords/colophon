-- Shared cache of series total volume counts (for "X/Y" library badges).
create table if not exists public.series (
  normalized_key text primary key,
  name text not null,
  total_volumes int,
  source text,
  updated_at timestamptz not null default now()
);
alter table public.series enable row level security;

-- Read-only for clients; only the service role (curated seeds) writes, so a
-- world-shared total can't be poisoned by any authenticated user.
create policy series_read on public.series for select to authenticated using (true);

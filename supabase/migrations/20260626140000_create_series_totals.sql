-- Shared cache of series total volume counts (for "X/Y" library badges).
create table if not exists public.series (
  normalized_key text primary key,
  name text not null,
  total_volumes int,
  source text,
  updated_at timestamptz not null default now()
);
alter table public.series enable row level security;

create policy series_read on public.series for select to authenticated using (true);
create policy series_insert on public.series for insert to authenticated with check (true);
create policy series_update on public.series for update to authenticated using (true) with check (true);

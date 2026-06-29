-- Cache for the semantic reader profile + recommendations (computed by the
-- reader-taste edge function via Claude, re-run only when the library changes).
create table if not exists public.reader_taste (
  user_id uuid primary key,
  clusters jsonb not null default '[]',
  recommendations jsonb not null default '[]',
  library_hash text,
  computed_at timestamptz not null default now()
);
alter table public.reader_taste enable row level security;
create policy "reader_taste own select" on public.reader_taste
  for select to authenticated using (user_id = auth.uid());

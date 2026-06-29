-- Community "boîtes à livres" (little free libraries): a reader marks where one is,
-- with a photo + note, and logs the books they've dropped there.
create table if not exists public.book_boxes (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  lat double precision not null,
  lng double precision not null,
  city text,
  photo_path text,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.book_box_donations (
  id uuid primary key default gen_random_uuid(),
  box_id uuid not null references public.book_boxes(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  isbn13 text,
  donated_on date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists book_box_donations_box_idx on public.book_box_donations(box_id);

alter table public.book_boxes enable row level security;
alter table public.book_box_donations enable row level security;

-- Boxes are a community map: any signed-in reader can see them; only the author edits.
create policy "book_boxes read" on public.book_boxes
  for select to authenticated using (true);
create policy "book_boxes insert own" on public.book_boxes
  for insert to authenticated with check (created_by = auth.uid());
create policy "book_boxes update own" on public.book_boxes
  for update to authenticated using (created_by = auth.uid());
create policy "book_boxes delete own" on public.book_boxes
  for delete to authenticated using (created_by = auth.uid());

-- Donations are public-readable (a box shows all its drops); only the author edits.
create policy "donations read" on public.book_box_donations
  for select to authenticated using (true);
create policy "donations insert own" on public.book_box_donations
  for insert to authenticated with check (user_id = auth.uid());
create policy "donations delete own" on public.book_box_donations
  for delete to authenticated using (user_id = auth.uid());

-- Photo storage bucket (public read; authenticated upload).
insert into storage.buckets (id, name, public) values ('book-boxes', 'book-boxes', true)
  on conflict (id) do nothing;
create policy "book-boxes upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'book-boxes');
create policy "book-boxes read" on storage.objects
  for select to public using (bucket_id = 'book-boxes');

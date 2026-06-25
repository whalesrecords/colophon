-- Colophon core schema: shared book-metadata cache + per-user library,
-- reading sessions and shelves. RLS isolates each user's data; book_metadata
-- is readable by any authenticated user and written only by the service role
-- (the isbn-lookup edge function, which bypasses RLS).

-- book_metadata: shared cache, one row per ISBN-13 ------------------------------
create table public.book_metadata (
  isbn13 text primary key,
  title text,
  subtitle text,
  authors text[],
  publisher text,
  published_date text,
  page_count integer,
  language text,
  cover_url text,
  description text,
  source text,
  raw jsonb,
  fetched_at timestamptz not null default now()
);
comment on table public.book_metadata is
  'Shared bibliographic cache keyed by ISBN-13. Written by the isbn-lookup edge function (service role) only.';

-- items: a physical copy the user owns -----------------------------------------
create table public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  isbn13 text not null references public.book_metadata (isbn13) on delete restrict,
  location text,
  condition text,
  purchase_price numeric(10, 2),
  purchase_date date,
  purchase_store text,
  rating numeric(2, 1) check (rating >= 0 and rating <= 5),
  notes text,
  status text not null default 'to_read'
    check (status in ('to_read', 'reading', 'read', 'abandoned')),
  added_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- reading_sessions: one row per reading stint of an item -----------------------
create table public.reading_sessions (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items (id) on delete cascade,
  started_on date,
  finished_on date,
  status text check (status in ('reading', 'finished', 'abandoned')),
  current_page integer,
  total_pages integer,
  reader text,
  created_at timestamptz not null default now()
);

-- shelves & item_shelves (many-to-many) ----------------------------------------
create table public.shelves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null
);

create table public.item_shelves (
  item_id uuid not null references public.items (id) on delete cascade,
  shelf_id uuid not null references public.shelves (id) on delete cascade,
  primary key (item_id, shelf_id)
);

-- indexes ----------------------------------------------------------------------
create index items_user_id_idx on public.items (user_id);
create index items_isbn13_idx on public.items (isbn13);
create index items_user_status_idx on public.items (user_id, status);
create index items_user_added_idx on public.items (user_id, added_at desc);
create index reading_sessions_item_id_idx on public.reading_sessions (item_id);
create index shelves_user_id_idx on public.shelves (user_id);
create index item_shelves_shelf_id_idx on public.item_shelves (shelf_id);

-- updated_at maintenance for items ---------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger items_set_updated_at
  before update on public.items
  for each row execute function public.set_updated_at();

-- row level security -----------------------------------------------------------
alter table public.book_metadata enable row level security;
alter table public.items enable row level security;
alter table public.reading_sessions enable row level security;
alter table public.shelves enable row level security;
alter table public.item_shelves enable row level security;

-- book_metadata: any authenticated user may read; writes go through the service
-- role (bypasses RLS), so no write policies are defined.
create policy book_metadata_select_authenticated on public.book_metadata
  for select to authenticated using (true);

-- items: full CRUD scoped to the owner.
create policy items_select_own on public.items
  for select to authenticated using (user_id = (select auth.uid()));
create policy items_insert_own on public.items
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy items_update_own on public.items
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy items_delete_own on public.items
  for delete to authenticated using (user_id = (select auth.uid()));

-- reading_sessions: ownership derived from the parent item.
create policy reading_sessions_select_own on public.reading_sessions
  for select to authenticated
  using (exists (select 1 from public.items i where i.id = item_id and i.user_id = (select auth.uid())));
create policy reading_sessions_insert_own on public.reading_sessions
  for insert to authenticated
  with check (exists (select 1 from public.items i where i.id = item_id and i.user_id = (select auth.uid())));
create policy reading_sessions_update_own on public.reading_sessions
  for update to authenticated
  using (exists (select 1 from public.items i where i.id = item_id and i.user_id = (select auth.uid())))
  with check (exists (select 1 from public.items i where i.id = item_id and i.user_id = (select auth.uid())));
create policy reading_sessions_delete_own on public.reading_sessions
  for delete to authenticated
  using (exists (select 1 from public.items i where i.id = item_id and i.user_id = (select auth.uid())));

-- shelves: full CRUD scoped to the owner.
create policy shelves_select_own on public.shelves
  for select to authenticated using (user_id = (select auth.uid()));
create policy shelves_insert_own on public.shelves
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy shelves_update_own on public.shelves
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy shelves_delete_own on public.shelves
  for delete to authenticated using (user_id = (select auth.uid()));

-- item_shelves: the item (and, on insert, the shelf) must belong to the user.
create policy item_shelves_select_own on public.item_shelves
  for select to authenticated
  using (exists (select 1 from public.items i where i.id = item_id and i.user_id = (select auth.uid())));
create policy item_shelves_insert_own on public.item_shelves
  for insert to authenticated
  with check (
    exists (select 1 from public.items i where i.id = item_id and i.user_id = (select auth.uid()))
    and exists (select 1 from public.shelves s where s.id = shelf_id and s.user_id = (select auth.uid()))
  );
create policy item_shelves_delete_own on public.item_shelves
  for delete to authenticated
  using (exists (select 1 from public.items i where i.id = item_id and i.user_id = (select auth.uid())));

-- realtime (multi-device sync) -------------------------------------------------
alter publication supabase_realtime add table public.items;
alter publication supabase_realtime add table public.reading_sessions;
alter publication supabase_realtime add table public.shelves;
alter publication supabase_realtime add table public.item_shelves;

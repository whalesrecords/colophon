-- Friendships (directed request → mutual on accept) + reader discovery RPCs.
-- See apply_migration "friends_and_reader_discovery". Highlights:
--   friendships(requester, addressee, status) + RLS (see your own rows; insert as
--   requester; addressee accepts; either party deletes). are_friends() SECURITY
--   DEFINER. profiles become SELECT-able by authenticated (discovery).
--   suggested_readers(limit) — other readers by shared-genre overlap.
--   reader_profile(user) — JSON: basics + aggregates + recent reads (no notes).
create table public.friendships (
  requester uuid not null references auth.users (id) on delete cascade,
  addressee uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  primary key (requester, addressee),
  check (requester <> addressee)
);
create index friendships_addressee_idx on public.friendships (addressee);
alter table public.friendships enable row level security;
create policy friendships_select on public.friendships for select to authenticated
  using (requester = (select auth.uid()) or addressee = (select auth.uid()));
create policy friendships_insert on public.friendships for insert to authenticated
  with check (requester = (select auth.uid()) and status = 'pending');
create policy friendships_update on public.friendships for update to authenticated
  using (addressee = (select auth.uid())) with check (addressee = (select auth.uid()));
create policy friendships_delete on public.friendships for delete to authenticated
  using (requester = (select auth.uid()) or addressee = (select auth.uid()));
alter publication supabase_realtime add table public.friendships;
create policy profiles_select_authenticated on public.profiles for select to authenticated using (true);
-- are_friends(a,b), suggested_readers(limit), reader_profile(user): see apply_migration.

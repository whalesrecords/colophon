-- Customizable free-form tags on items (cross-cutting keywords), parallel to
-- shelves. Owner-only, same EXISTS-on-parent pattern as item_shelves.
create table public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);
create index tags_user_id_idx on public.tags (user_id);

create table public.item_tags (
  item_id uuid not null references public.items (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  primary key (item_id, tag_id)
);

alter table public.tags enable row level security;
alter table public.item_tags enable row level security;

create policy tags_select_own on public.tags
  for select to authenticated using (user_id = (select auth.uid()));
create policy tags_insert_own on public.tags
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy tags_update_own on public.tags
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy tags_delete_own on public.tags
  for delete to authenticated using (user_id = (select auth.uid()));

create policy item_tags_select on public.item_tags
  for select to authenticated
  using (exists (select 1 from public.items i where i.id = item_tags.item_id and i.user_id = (select auth.uid())));
create policy item_tags_insert on public.item_tags
  for insert to authenticated
  with check (exists (select 1 from public.items i where i.id = item_tags.item_id and i.user_id = (select auth.uid())));
create policy item_tags_delete on public.item_tags
  for delete to authenticated
  using (exists (select 1 from public.items i where i.id = item_tags.item_id and i.user_id = (select auth.uid())));

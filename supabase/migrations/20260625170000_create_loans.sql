-- Lending history per item. A loan is "active" while returned_on is null;
-- at most one active loan per item (enforced by a partial unique index).
-- RLS via EXISTS on the parent item (loans carries no user_id), like reading_sessions.
create table public.loans (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items (id) on delete cascade,
  borrower text not null,
  lent_on date not null default current_date,
  due_on date,
  returned_on date,
  notes text,
  created_at timestamptz not null default now()
);
create index loans_item_id_idx on public.loans (item_id);
create unique index loans_one_active_per_item on public.loans (item_id) where returned_on is null;

alter table public.loans enable row level security;

create policy loans_select on public.loans
  for select to authenticated
  using (exists (select 1 from public.items i where i.id = loans.item_id and i.user_id = (select auth.uid())));
create policy loans_insert on public.loans
  for insert to authenticated
  with check (exists (select 1 from public.items i where i.id = loans.item_id and i.user_id = (select auth.uid())));
create policy loans_update on public.loans
  for update to authenticated
  using (exists (select 1 from public.items i where i.id = loans.item_id and i.user_id = (select auth.uid())))
  with check (exists (select 1 from public.items i where i.id = loans.item_id and i.user_id = (select auth.uid())));
create policy loans_delete on public.loans
  for delete to authenticated
  using (exists (select 1 from public.items i where i.id = loans.item_id and i.user_id = (select auth.uid())));

-- Possession axis, separate from reading status. Additive + non-destructive:
-- every existing copy becomes 'owned'. Idempotent (already applied on prod).
alter table public.items
  add column if not exists ownership text not null default 'owned';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'items_ownership_check'
  ) then
    alter table public.items
      add constraint items_ownership_check
      check (ownership in ('owned', 'wishlist', 'borrowed'));
  end if;
end $$;

alter table public.items add column if not exists borrowed_from text;

create index if not exists items_user_ownership_idx on public.items (user_id, ownership);

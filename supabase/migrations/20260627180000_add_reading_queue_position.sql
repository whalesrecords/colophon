-- Manual priority order for the "to read" pile (a reading queue). Null = not yet
-- prioritised (sorts after positioned items). Per-user via items.user_id; existing
-- owner-only RLS already covers it.
alter table public.items add column if not exists queue_position integer;
create index if not exists items_user_queue_idx on public.items (user_id, queue_position);

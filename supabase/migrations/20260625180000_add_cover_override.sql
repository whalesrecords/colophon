-- Per-copy cover override: lets a user pick a different cover / paste an image
-- URL for their own item without touching the shared book_metadata row.
-- Covered by the existing owner-only RLS policies on items.
alter table public.items add column cover_override text;

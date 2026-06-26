-- Physical/digital format of a copy. Nullable (unknown by default), additive.
alter table public.items add column if not exists format text
  check (format is null or format in ('paperback', 'hardcover', 'pocket', 'ebook', 'audio'));

-- Shareable wishlist ("liste de cadeaux"). Public access is via SECURITY DEFINER
-- RPCs callable by anon (no edge function). A wishlist share reuses the `shares`
-- table with scope='wishlist'; the public gift page lives at /g/[token].

-- Allow the wishlist scope on shares.
alter table public.shares drop constraint if exists shares_scope_check;
alter table public.shares add constraint shares_scope_check
  check (scope in ('library', 'shelf', 'wishlist'));

-- 1. Public read of a wishlist share's books (no private notes, wishlist only).
create or replace function public.gift_by_token(p_token text)
returns table (isbn13 text, title text, authors text[], cover_url text, owner_name text)
language sql security definer set search_path = public as $$
  select bm.isbn13, bm.title, bm.authors,
         coalesce(i.cover_override, bm.cover_url) as cover_url,
         coalesce(pr.display_name, 'Un lecteur') as owner_name
  from shares s
  join items i on i.user_id = s.user_id and i.ownership = 'wishlist'
  join book_metadata bm on bm.isbn13 = i.isbn13
  left join profiles pr on pr.user_id = s.user_id
  where s.token = p_token and s.scope = 'wishlist'
  order by i.added_at desc;
$$;

-- 2. Claims — one per (list, book). RLS on with NO policies: the table is only
-- reachable through the SECURITY DEFINER RPCs below (surprise-preserving — nobody
-- can read who claimed what directly).
create table if not exists public.gift_claims (
  id uuid primary key default gen_random_uuid(),
  token text not null,
  isbn13 text not null,
  giver_name text,
  created_at timestamptz not null default now(),
  unique (token, isbn13)
);
alter table public.gift_claims enable row level security;

-- 3. A gift-giver claims a book ("je l'offre"). Validates the token is a real
-- wishlist share that contains the book. Returns true iff newly claimed.
create or replace function public.claim_gift(p_token text, p_isbn13 text, p_giver text default null)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from shares s
    join items i on i.user_id = s.user_id and i.ownership = 'wishlist' and i.isbn13 = p_isbn13
    where s.token = p_token and s.scope = 'wishlist'
  ) then
    return false;
  end if;
  insert into gift_claims (token, isbn13, giver_name)
  values (p_token, p_isbn13, nullif(btrim(coalesce(p_giver, '')), ''))
  on conflict (token, isbn13) do nothing;
  return found;
end; $$;

-- 4. Which books are already claimed (isbns only — no giver identity).
create or replace function public.gift_status_by_token(p_token text)
returns table (isbn13 text) language sql security definer set search_path = public as $$
  select isbn13 from gift_claims where token = p_token;
$$;

revoke execute on function public.gift_by_token(text) from public;
revoke execute on function public.claim_gift(text, text, text) from public;
revoke execute on function public.gift_status_by_token(text) from public;
grant execute on function public.gift_by_token(text) to anon, authenticated;
grant execute on function public.claim_gift(text, text, text) to anon, authenticated;
grant execute on function public.gift_status_by_token(text) to anon, authenticated;

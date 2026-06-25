-- Owner check (SECURITY DEFINER, mirrors is_circle_member) for moderation.
create function public.is_circle_owner(c_id uuid, u_id uuid)
returns boolean language sql security definer set search_path = '' stable as $$
  select exists (select 1 from public.circles c where c.id = c_id and c.owner_id = u_id);
$$;
revoke execute on function public.is_circle_owner(uuid, uuid) from anon, public;
grant execute on function public.is_circle_owner(uuid, uuid) to authenticated;

-- ── Per-member circle library + reading status ───────────────────────────────
drop table if exists public.circle_books cascade;
create table public.circle_books (
  circle_id uuid not null references public.circles (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  isbn13 text not null references public.book_metadata (isbn13) on delete cascade,
  reading_status text not null default 'to_read'
    check (reading_status in ('to_read', 'reading', 'read', 'abandoned')),
  rating numeric(2, 1) check (rating >= 0 and rating <= 5),
  finished_on date,
  added_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (circle_id, user_id, isbn13)
);
create index circle_books_circle_idx on public.circle_books (circle_id);
create index circle_books_circle_user_idx on public.circle_books (circle_id, user_id);

alter table public.circle_books enable row level security;
create policy circle_books_select on public.circle_books for select to authenticated
  using (public.is_circle_member(circle_id, (select auth.uid())));
create policy circle_books_insert on public.circle_books for insert to authenticated
  with check (user_id = (select auth.uid()) and public.is_circle_member(circle_id, (select auth.uid())));
create policy circle_books_update on public.circle_books for update to authenticated
  using (user_id = (select auth.uid()) and public.is_circle_member(circle_id, (select auth.uid())))
  with check (user_id = (select auth.uid()) and public.is_circle_member(circle_id, (select auth.uid())));
create policy circle_books_delete on public.circle_books for delete to authenticated
  using (user_id = (select auth.uid()) and public.is_circle_member(circle_id, (select auth.uid())));

-- ── Per-book comments ────────────────────────────────────────────────────────
create table public.circle_book_comments (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  isbn13 text not null references public.book_metadata (isbn13) on delete cascade,
  body text not null check (length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index circle_book_comments_idx on public.circle_book_comments (circle_id, isbn13, created_at);

alter table public.circle_book_comments enable row level security;
create policy ccc_select on public.circle_book_comments for select to authenticated
  using (public.is_circle_member(circle_id, (select auth.uid())));
create policy ccc_insert on public.circle_book_comments for insert to authenticated
  with check (user_id = (select auth.uid()) and public.is_circle_member(circle_id, (select auth.uid())));
create policy ccc_delete on public.circle_book_comments for delete to authenticated
  using (user_id = (select auth.uid()) or public.is_circle_owner(circle_id, (select auth.uid())));

-- ── Reading proposals + votes ────────────────────────────────────────────────
create table public.circle_proposals (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles (id) on delete cascade,
  isbn13 text not null references public.book_metadata (isbn13) on delete cascade,
  proposed_by uuid not null references auth.users (id) on delete cascade,
  note text,
  status text not null default 'open' check (status in ('open', 'selected', 'archived')),
  created_at timestamptz not null default now()
);
create unique index circle_proposals_open_unique on public.circle_proposals (circle_id, isbn13)
  where status = 'open';
create index circle_proposals_idx on public.circle_proposals (circle_id, status, created_at desc);

alter table public.circle_proposals enable row level security;
create policy cp_select on public.circle_proposals for select to authenticated
  using (public.is_circle_member(circle_id, (select auth.uid())));
create policy cp_insert on public.circle_proposals for insert to authenticated
  with check (proposed_by = (select auth.uid()) and public.is_circle_member(circle_id, (select auth.uid())));
create policy cp_update on public.circle_proposals for update to authenticated
  using (public.is_circle_member(circle_id, (select auth.uid())) and (proposed_by = (select auth.uid()) or public.is_circle_owner(circle_id, (select auth.uid()))))
  with check (public.is_circle_member(circle_id, (select auth.uid())));
create policy cp_delete on public.circle_proposals for delete to authenticated
  using (public.is_circle_member(circle_id, (select auth.uid())) and (proposed_by = (select auth.uid()) or public.is_circle_owner(circle_id, (select auth.uid()))));

create table public.circle_proposal_votes (
  proposal_id uuid not null references public.circle_proposals (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  circle_id uuid not null references public.circles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (proposal_id, user_id)
);
create index cpv_proposal_idx on public.circle_proposal_votes (proposal_id);

alter table public.circle_proposal_votes enable row level security;
create policy cpv_select on public.circle_proposal_votes for select to authenticated
  using (public.is_circle_member(circle_id, (select auth.uid())));
create policy cpv_delete on public.circle_proposal_votes for delete to authenticated
  using (user_id = (select auth.uid()));

-- Race-free interest toggle: sets circle_id from the proposal, asserts membership.
create function public.toggle_proposal_vote(p_proposal_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_circle uuid; v_uid uuid := auth.uid(); v_exists boolean;
begin
  select circle_id into v_circle from public.circle_proposals where id = p_proposal_id;
  if v_circle is null then raise exception 'proposal_not_found'; end if;
  if not public.is_circle_member(v_circle, v_uid) then raise exception 'not_a_member'; end if;
  select exists (
    select 1 from public.circle_proposal_votes where proposal_id = p_proposal_id and user_id = v_uid
  ) into v_exists;
  if v_exists then
    delete from public.circle_proposal_votes where proposal_id = p_proposal_id and user_id = v_uid;
    return false;
  end if;
  insert into public.circle_proposal_votes (proposal_id, user_id, circle_id)
    values (p_proposal_id, v_uid, v_circle);
  return true;
end;
$$;
revoke execute on function public.toggle_proposal_vote(uuid) from anon, public;
grant execute on function public.toggle_proposal_vote(uuid) to authenticated;

alter publication supabase_realtime add table public.circle_book_comments;
alter publication supabase_realtime add table public.circle_proposals;
alter publication supabase_realtime add table public.circle_proposal_votes;

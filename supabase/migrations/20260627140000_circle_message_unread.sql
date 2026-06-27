-- Per-member read marker + unread message counts for in-app notifications.
alter table public.circle_members
  add column if not exists last_read_at timestamptz not null default now();

create or replace function public.circle_unread_counts()
returns table(circle_id uuid, unread integer)
language sql security definer set search_path = ''
as $$
  select m.circle_id, count(msg.id)::int as unread
  from public.circle_members m
  left join public.messages msg
    on msg.circle_id = m.circle_id
   and msg.created_at > m.last_read_at
   and msg.user_id <> m.user_id
  where m.user_id = (select auth.uid())
  group by m.circle_id;
$$;
revoke execute on function public.circle_unread_counts() from anon, public;
grant execute on function public.circle_unread_counts() to authenticated;

create or replace function public.mark_circle_read(p_circle uuid)
returns void
language sql security definer set search_path = ''
as $$
  update public.circle_members
  set last_read_at = now()
  where circle_id = p_circle and user_id = (select auth.uid());
$$;
revoke execute on function public.mark_circle_read(uuid) from anon, public;
grant execute on function public.mark_circle_read(uuid) to authenticated;

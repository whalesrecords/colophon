-- Owners must always see their own circle even if not in circle_members (a member-
-- only SELECT policy orphaned owners who left their own circle).
drop policy if exists circles_select_member on public.circles;
create policy circles_select_member on public.circles
  for select
  using (
    owner_id = (select auth.uid())
    or public.is_circle_member(id, (select auth.uid()))
  );

-- Data repair: re-add every circle owner as a member where missing.
insert into public.circle_members (circle_id, user_id, display_name)
select c.id, c.owner_id, split_part(u.email, '@', 1)
from public.circles c
join auth.users u on u.id = c.owner_id
where not exists (
  select 1 from public.circle_members m
  where m.circle_id = c.id and m.user_id = c.owner_id
)
on conflict (circle_id, user_id) do nothing;

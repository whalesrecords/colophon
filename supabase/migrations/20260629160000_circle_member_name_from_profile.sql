-- Circle member display name should be the reader's profile name (nom/prénom or
-- pseudo), never their email. Fix create_circle/join_circle + backfill.
create or replace function public.create_circle(p_name text)
returns public.circles
language plpgsql
security definer
set search_path to ''
as $function$
declare c public.circles; dn text;
begin
  select coalesce(p.display_name, p.pseudo, split_part(u.email, '@', 1))
    into dn
    from auth.users u
    left join public.profiles p on p.user_id = u.id
    where u.id = auth.uid();
  insert into public.circles (name, owner_id) values (p_name, auth.uid()) returning * into c;
  insert into public.circle_members (circle_id, user_id, display_name) values (c.id, auth.uid(), dn);
  return c;
end;
$function$;

create or replace function public.join_circle(p_code text)
returns public.circles
language plpgsql
security definer
set search_path to ''
as $function$
declare c public.circles; dn text; n int; already boolean;
begin
  select * into c from public.circles where invite_code = lower(trim(p_code));
  if c.id is null then raise exception 'circle_not_found'; end if;

  select exists(
    select 1 from public.circle_members where circle_id = c.id and user_id = auth.uid()
  ) into already;

  if not already then
    select count(*) into n from public.circle_members where circle_id = c.id;
    if n >= 5 and not coalesce(c.is_premium, false) then
      raise exception 'circle_full_free';
    end if;
  end if;

  select coalesce(p.display_name, p.pseudo, split_part(u.email, '@', 1))
    into dn
    from auth.users u
    left join public.profiles p on p.user_id = u.id
    where u.id = auth.uid();
  insert into public.circle_members (circle_id, user_id, display_name)
    values (c.id, auth.uid(), dn)
    on conflict (circle_id, user_id) do nothing;
  return c;
end;
$function$;

-- Backfill: replace email-prefix names with the profile name where we have one.
update public.circle_members cm
set display_name = coalesce(p.display_name, p.pseudo, cm.display_name)
from public.profiles p
where p.user_id = cm.user_id
  and coalesce(p.display_name, p.pseudo) is not null;

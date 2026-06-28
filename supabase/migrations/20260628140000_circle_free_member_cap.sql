-- Freemium circles: free up to 5 members; beyond that the circle must be premium
-- (1,99 $/membre/mois — payment not wired yet, so is_premium stays false for now).
alter table public.circles
  add column if not exists is_premium boolean not null default false,
  add column if not exists premium_until timestamptz;

create or replace function public.join_circle(p_code text)
returns circles
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
    -- Free tier caps a circle at 5 members; premium circles are uncapped here.
    if n >= 5 and not coalesce(c.is_premium, false) then
      raise exception 'circle_full_free';
    end if;
  end if;

  select split_part(email, '@', 1) into dn from auth.users where id = auth.uid();
  insert into public.circle_members (circle_id, user_id, display_name)
    values (c.id, auth.uid(), dn)
    on conflict (circle_id, user_id) do nothing;
  return c;
end;
$function$;

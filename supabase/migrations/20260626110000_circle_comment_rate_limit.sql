-- Anti comment-bombing: a SECURITY DEFINER trigger enforcing a flood window and
-- a repeated-text guard on circle chat + per-book comments.
create or replace function public.enforce_comment_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  recent int;
begin
  -- Flood: too many posts in a short window (across the user's circles).
  execute format(
    'select count(*) from public.%I where user_id = $1 and created_at > now() - interval ''10 seconds''',
    tg_table_name
  ) into recent using new.user_id;
  if recent >= 8 then
    raise exception 'Trop de messages d''affilée. Patientez quelques secondes.';
  end if;

  -- Duplicate bombing: the same text repeated in the same circle.
  execute format(
    'select count(*) from public.%I where user_id = $1 and circle_id = $2 and body = $3 and created_at > now() - interval ''30 seconds''',
    tg_table_name
  ) into recent using new.user_id, new.circle_id, new.body;
  if recent >= 2 then
    raise exception 'Message identique répété trop de fois.';
  end if;

  return new;
end;
$$;

create trigger trg_rate_limit_messages
  before insert on public.messages
  for each row execute function public.enforce_comment_rate_limit();

create trigger trg_rate_limit_book_comments
  before insert on public.circle_book_comments
  for each row execute function public.enforce_comment_rate_limit();

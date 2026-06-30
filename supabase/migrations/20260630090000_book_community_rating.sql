-- Average rating + count across ALL Colophon readers for a book (by ISBN).
create or replace function public.book_community_rating(p_isbn13 text)
returns table (avg numeric, count int)
language sql
security definer
stable
set search_path = public
as $function$
  select round(avg(i.rating)::numeric, 1) as avg, count(*)::int as count
  from public.items i
  where i.isbn13 = p_isbn13 and i.rating is not null;
$function$;
revoke execute on function public.book_community_rating(text) from anon, public;
grant execute on function public.book_community_rating(text) to authenticated;

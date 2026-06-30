-- "Ce que lit la communauté": rank genres/authors/tags by the number of DISTINCT
-- readers, not by item (tome) count. Otherwise a prolific series (e.g. a 72-volume
-- manga) counts its author/genre once per tome per owner, drowning out everyone else
-- (a single owner of all of Naruto would add 72 to Kishimoto). CREATE OR REPLACE keeps
-- the existing EXECUTE grants (authenticated only).
create or replace function public.community_trends()
 returns jsonb
 language sql
 stable security definer
 set search_path to ''
as $function$
  select jsonb_build_object(
    'genres', coalesce((
      select jsonb_agg(jsonb_build_object('label', g, 'count', c) order by c desc)
      from (
        select unnest(bm.genres) as g, count(distinct i.user_id)::int as c
        from public.items i
        join public.book_metadata bm on bm.isbn13 = i.isbn13
        where bm.genres is not null
        group by 1 order by c desc limit 8
      ) gt
    ), '[]'::jsonb),
    'authors', coalesce((
      select jsonb_agg(jsonb_build_object('label', a, 'count', c) order by c desc)
      from (
        select unnest(bm.authors) as a, count(distinct i.user_id)::int as c
        from public.items i
        join public.book_metadata bm on bm.isbn13 = i.isbn13
        where bm.authors is not null
        group by 1 order by c desc limit 8
      ) au
    ), '[]'::jsonb),
    'tags', coalesce((
      select jsonb_agg(jsonb_build_object('label', label, 'count', c) order by c desc)
      from (
        select t.name as label, count(distinct i.user_id)::int as c
        from public.item_tags it
        join public.tags t on t.id = it.tag_id
        join public.items i on i.id = it.item_id
        group by t.name order by c desc limit 8
      ) tg
    ), '[]'::jsonb),
    'readers', coalesce((select count(distinct user_id)::int from public.items), 0),
    'books', coalesce((select count(*)::int from public.items), 0)
  );
$function$;

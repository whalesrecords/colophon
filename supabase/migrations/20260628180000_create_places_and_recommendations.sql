-- Lieux de lecture (librairies, festivals, cafés philo, cercles) for the map.
-- Display reads the bundled GeoJSON (public/lieux.geojson); this table backs the
-- social layer (reader recommendations / coups de cœur) and future bbox queries.
create table if not exists public.places (
  id            text primary key,
  type          text not null check (type in ('librairie','festival','cafe_philo','cercle_lecture')),
  name          text not null,
  description   text,
  address       text,
  postal_code   text,
  city          text,
  department    text,
  region        text,
  latitude      double precision,
  longitude     double precision,
  website       text,
  email         text,
  period        text,
  precision     text,
  source        text,
  source_ref    text,
  last_updated  date
);

create index if not exists places_type_idx on public.places (type);
create index if not exists places_geo_idx  on public.places (latitude, longitude);

alter table public.places enable row level security;
create policy "places readable by all" on public.places for select using (true);

create table if not exists public.place_recommendations (
  id          uuid primary key default gen_random_uuid(),
  place_id    text not null references public.places(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  rating      numeric(2,1),
  comment     text,
  created_at  timestamptz not null default now(),
  unique (place_id, user_id)
);
alter table public.place_recommendations enable row level security;
create policy "recos readable by all" on public.place_recommendations for select using (true);
create policy "users manage own recos" on public.place_recommendations for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

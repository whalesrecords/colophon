-- New place type: writing workshops.
alter table public.places drop constraint if exists places_type_check;
alter table public.places
  add constraint places_type_check
  check (type in ('librairie','festival','cafe_philo','cercle_lecture','atelier_ecriture'));

-- A reader's personal marks on a place (coup de cœur / visité), keyed by the
-- GeoJSON place id (no FK — the places table stays optional for display).
create table if not exists public.user_places (
  user_id     uuid not null references auth.users(id) on delete cascade,
  place_id    text not null,
  place_type  text,
  place_name  text,
  place_city  text,
  favorite    boolean not null default false,
  visited     boolean not null default false,
  rating      numeric(2,1),
  note        text,
  updated_at  timestamptz not null default now(),
  primary key (user_id, place_id)
);
alter table public.user_places enable row level security;
create policy "own user_places" on public.user_places for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

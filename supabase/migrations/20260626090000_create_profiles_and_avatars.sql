-- Per-user public profile: display name / pseudo / avatar.
create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  pseudo text unique,
  avatar_path text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
create policy profiles_select on public.profiles for select to authenticated using (true);
create policy profiles_insert_own on public.profiles for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy profiles_update_own on public.profiles for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, split_part(new.email, '@', 1))
  on conflict (user_id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

insert into public.profiles (user_id, display_name)
  select id, split_part(email, '@', 1) from auth.users
  on conflict (user_id) do nothing;

insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
  on conflict (id) do nothing;

create policy avatars_read on storage.objects for select to public
  using (bucket_id = 'avatars');
create policy avatars_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy avatars_update_own on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy avatars_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

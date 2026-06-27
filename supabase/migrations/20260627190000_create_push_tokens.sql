create table public.push_tokens (
  user_id uuid not null references auth.users (id) on delete cascade,
  token text not null,
  platform text,
  updated_at timestamptz not null default now(),
  primary key (user_id, token)
);
alter table public.push_tokens enable row level security;
create policy push_tokens_select on public.push_tokens for select to authenticated using (user_id = (select auth.uid()));
create policy push_tokens_insert on public.push_tokens for insert to authenticated with check (user_id = (select auth.uid()));
create policy push_tokens_update on public.push_tokens for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy push_tokens_delete on public.push_tokens for delete to authenticated using (user_id = (select auth.uid()));

-- Let a member delete their own message; circle owners can moderate any message.
create policy messages_delete_own on public.messages
  for delete to authenticated
  using (
    user_id = (select auth.uid())
    or is_circle_owner(circle_id, (select auth.uid()))
  );

-- Per-book discussion channels: a default "Généralités" + topic channels for
-- specific points. Existing comments fall into Généralités.
alter table public.circle_book_comments
  add column if not exists channel text not null default 'Généralités';

create index if not exists circle_book_comments_channel_idx
  on public.circle_book_comments (circle_id, isbn13, channel);

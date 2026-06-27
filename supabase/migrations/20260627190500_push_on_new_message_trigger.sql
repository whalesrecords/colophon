create extension if not exists pg_net;

-- On a new message, fire-and-forget a call to the send-push edge function. pg_net
-- is async, so this never blocks the insert; push failures are silent.
create or replace function public.notify_new_message()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  begin
    perform net.http_post(
      url := 'https://bwmhbnozduuoyavqkaha.supabase.co/functions/v1/send-push',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer sb_publishable_iyTMZg2N9AsgKEKN-_Favw_prMbfshN',
        'apikey', 'sb_publishable_iyTMZg2N9AsgKEKN-_Favw_prMbfshN'
      ),
      body := jsonb_build_object('record', jsonb_build_object(
        'circle_id', new.circle_id, 'user_id', new.user_id, 'body', new.body
      ))
    );
  exception when others then null;
  end;
  return new;
end $$;

drop trigger if exists messages_push_notify on public.messages;
create trigger messages_push_notify
  after insert on public.messages
  for each row execute function public.notify_new_message();

// Sends an Expo push to a circle's members (except the author) when a new message
// is posted. Called by the `messages` insert trigger via pg_net. Uses the service
// role to read members + their push tokens. Real delivery needs the app shipped in
// a native build with EAS push credentials (APNs / FCM).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const EXPO_PUSH = 'https://exp.host/--/api/v2/push/send';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('method_not_allowed', { status: 405 });

  // Optional shared-secret hardening (set PUSH_TRIGGER_SECRET in the function env
  // and include it in the trigger's x-push-secret header).
  const secret = Deno.env.get('PUSH_TRIGGER_SECRET');
  if (secret && req.headers.get('x-push-secret') !== secret) {
    return new Response('forbidden', { status: 403 });
  }

  let payload: { record?: Record<string, unknown>; [k: string]: unknown };
  try {
    payload = await req.json();
  } catch {
    return new Response('invalid_body', { status: 400 });
  }
  const rec = (payload.record ?? payload) as {
    circle_id?: string;
    user_id?: string;
    body?: string;
  };
  const circleId = rec.circle_id;
  const senderId = rec.user_id;
  if (!circleId || !senderId) return new Response('missing_fields', { status: 400 });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const [{ data: circle }, { data: members }, { data: senderProfile }] = await Promise.all([
    supabase.from('circles').select('name').eq('id', circleId).maybeSingle(),
    supabase.from('circle_members').select('user_id, display_name').eq('circle_id', circleId),
    // Resolve the sender's name from their profile (nom/prénom or pseudo) so the
    // notification never shows an email — and stays current if they rename.
    supabase.from('profiles').select('display_name, pseudo').eq('user_id', senderId).maybeSingle(),
  ]);

  const recipients = (members ?? []).filter((m) => m.user_id !== senderId).map((m) => m.user_id);
  const senderName =
    senderProfile?.display_name ||
    senderProfile?.pseudo ||
    (members ?? []).find((m) => m.user_id === senderId)?.display_name ||
    'Quelqu’un';
  if (recipients.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data: tokens } = await supabase
    .from('push_tokens')
    .select('token')
    .in('user_id', recipients);

  const body = (rec.body ?? '').slice(0, 140);
  const messages = (tokens ?? []).map((t) => ({
    to: t.token,
    sound: 'default',
    title: circle?.name ?? 'Cercle de lecture',
    body: `${senderName} : ${body}`.trim(),
    data: { circleId },
    // Android: route to the app's channel + deliver with high priority so the
    // banner is shown promptly (matches the channel created on the device).
    channelId: 'default',
    priority: 'high',
  }));

  if (messages.length > 0) {
    await fetch(EXPO_PUSH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(messages),
    });
  }

  return new Response(JSON.stringify({ sent: messages.length }), {
    headers: { 'Content-Type': 'application/json' },
  });
});

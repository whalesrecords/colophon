import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from '@supabase/supabase-js';

// Semantic reader profile + "Dans ton style" recommendations.
// Claude (Haiku) reads the user's library → taste clusters (for the camembert) +
// recommended series in the same vein (NOT owned). Each recommendation is resolved
// to a FRENCH edition (Google Books langRestrict=fr) so covers + résumés are French.
// Result cached in reader_taste; recomputed only when the library changes (hash) or
// after 14 days.

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), {
    status: s,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });

const MODEL = 'claude-haiku-4-5-20251001';
const STALE_DAYS = 14;

function norm(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function seriesKey(title: string | null | undefined): string {
  if (!title) return '';
  let t = norm(title);
  t = t.replace(/[,\-:–—]?\s*(tome|tomes|volume|vol\.?|t\.?|n°)\s*\d+.*$/i, '');
  t = t.replace(/\s+\d+\s*$/, '');
  return t.trim();
}

interface Rec {
  title: string;
  author: string;
  isbn13: string;
  cover_url: string;
  universe: string;
  why: string;
}

async function resolveFrenchEdition(
  title: string,
  author: string,
  key: string | undefined,
): Promise<{ isbn13: string; cover_url: string } | null> {
  if (!key) return null;
  const q = `intitle:"${title.replace(/"/g, '')}"${author ? `+inauthor:"${author.replace(/"/g, '')}"` : ''}`;
  const url =
    `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}` +
    `&langRestrict=fr&maxResults=5&printType=books&key=${key}`;
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const data = await res.json();
    for (const item of data.items ?? []) {
      const info = item.volumeInfo ?? {};
      const ids: { type: string; identifier: string }[] = info.industryIdentifiers ?? [];
      const isbn13 = ids.find((i) => i.type === 'ISBN_13')?.identifier;
      const cover = info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail;
      if (isbn13 && cover) {
        return {
          isbn13,
          cover_url: cover.replace('http://', 'https://').replace('&edge=curl', ''),
        };
      }
    }
  } catch {
    // ignore
  }
  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
  const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY');
  const GOOGLE_KEY = Deno.env.get('GOOGLE_BOOKS_KEY');

  // Identify the caller from their JWT.
  const authHeader = req.headers.get('Authorization') ?? '';
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData } = await userClient.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) return json({ error: 'unauthorized' }, 401);

  const db = createClient(SUPABASE_URL, SERVICE_KEY);

  // The reader's library (favour rated / recently-added, exclude wishlist).
  const { data: rows } = await db
    .from('items')
    .select('isbn13, rating, book:book_metadata(title, authors)')
    .eq('user_id', uid)
    .neq('ownership', 'wishlist')
    .order('rating', { ascending: false, nullsFirst: false })
    .order('added_at', { ascending: false })
    .limit(60);

  const library = (rows ?? []) as unknown as {
    isbn13: string | null;
    rating: number | null;
    book: { title: string | null; authors: string[] | null } | null;
  }[];

  if (library.length === 0) return json({ clusters: [], recommendations: [] });

  const ownedSeries = new Set<string>();
  const lines: string[] = [];
  for (const r of library) {
    const t = r.book?.title;
    if (!t) continue;
    ownedSeries.add(seriesKey(t));
    const a = r.book?.authors?.[0] ?? '';
    lines.push(`- ${t}${a ? ` — ${a}` : ''}`);
  }
  const libraryHash =
    norm([...ownedSeries].sort().join('|')).slice(0, 200) + `#${ownedSeries.size}`;

  // Serve from cache when the library hasn't changed and the row is fresh.
  const { data: cached } = await db
    .from('reader_taste')
    .select('clusters, recommendations, library_hash, computed_at')
    .eq('user_id', uid)
    .maybeSingle();
  if (
    cached &&
    cached.library_hash === libraryHash &&
    Date.now() - new Date(cached.computed_at).getTime() < STALE_DAYS * 86_400_000 &&
    Array.isArray(cached.recommendations) &&
    cached.recommendations.length > 0
  ) {
    return json({ clusters: cached.clusters, recommendations: cached.recommendations });
  }

  if (!ANTHROPIC_KEY) {
    return json({
      clusters: cached?.clusters ?? [],
      recommendations: cached?.recommendations ?? [],
      note: 'no_api_key',
    });
  }

  // Ask Claude for clusters + new-series recommendations (strict JSON, in French).
  const prompt =
    `Bibliothèque d'un lecteur (titre — auteur) :\n${lines.slice(0, 50).join('\n')}\n\n` +
    `Réponds UNIQUEMENT en JSON valide, en français, avec exactement cette forme :\n` +
    `{"clusters":[{"label":"...","percent":0}],"recommendations":[{"title":"...","author":"...","universe":"...","why":"..."}]}\n\n` +
    `1. "clusters" : 5 à 7 univers de lecture sémantiques décrivant ses goûts (ex. "Seinen sombre", "Imaginaire épique", "Polar/thriller", "BD franco-belge", "Littérature contemplative", "Essais & idées"), chacun avec un "percent" entier ; le total fait 100.\n` +
    `2. "recommendations" : 8 livres ou séries qu'il ne possède PAS, dans la même veine, en VARIANT les univers, UNE SEULE entrée par série. "why" = une phrase courte en français. Évite les séries déjà possédées.`;

  let parsed: {
    clusters?: unknown;
    recommendations?: { title: string; author: string; universe?: string; why?: string }[];
  } = {};
  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1600,
        system:
          'Tu es un libraire expert en mangas, BD et littérature. Tu réponds uniquement en JSON valide, en français.',
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!resp.ok) return json({ error: 'llm_error', status: resp.status }, 502);
    const j = await resp.json();
    const text: string = j.content?.[0]?.text ?? '';
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) parsed = JSON.parse(text.slice(start, end + 1));
  } catch (e) {
    return json({ error: 'llm_parse', detail: String(e) }, 502);
  }

  // Resolve each recommendation to a French edition (cover + ISBN), drop owned series.
  const recs: Rec[] = [];
  const seen = new Set<string>();
  for (const r of parsed.recommendations ?? []) {
    if (recs.length >= 6) break;
    if (!r?.title) continue;
    const sk = seriesKey(r.title);
    if (!sk || ownedSeries.has(sk) || seen.has(sk)) continue;
    const ed = await resolveFrenchEdition(r.title, r.author ?? '', GOOGLE_KEY);
    if (!ed) continue;
    seen.add(sk);
    recs.push({
      title: r.title,
      author: r.author ?? '',
      isbn13: ed.isbn13,
      cover_url: ed.cover_url,
      universe: r.universe ?? '',
      why: r.why ?? '',
    });
  }

  const clusters = Array.isArray(parsed.clusters) ? parsed.clusters : [];

  await db.from('reader_taste').upsert({
    user_id: uid,
    clusters,
    recommendations: recs,
    library_hash: libraryHash,
    computed_at: new Date().toISOString(),
  });

  return json({ clusters, recommendations: recs });
});

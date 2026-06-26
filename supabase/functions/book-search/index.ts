import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import {
  type BookSearchResult,
  parseGoogleBooksSearch,
  parseOpenLibrarySearch,
} from './_shared/book-search-parsers.ts';

const USER_AGENT = 'Colophon/1.0 (personal library app; +mailto:hello@whalesrecords.com)';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

interface SearchParams {
  q?: string;
  title?: string;
  author?: string;
  publisher?: string;
  subject?: string;
  /** Series mode: fetch several pages so long runs (e.g. Berserk, 40+ vol.) surface. */
  deep?: boolean;
}

function withTimeout(ms: number): { signal: AbortSignal; done: () => void } {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  return { signal: ctrl.signal, done: () => clearTimeout(id) };
}

const phrase = (s: string) => `"${s.trim().replace(/"/g, '')}"`;

function hasQuery(p: SearchParams): boolean {
  return Boolean(
    p.q?.trim() || p.title?.trim() || p.author?.trim() || p.publisher?.trim() || p.subject?.trim(),
  );
}

async function searchOpenLibrary(p: SearchParams, limit: number): Promise<BookSearchResult[]> {
  const url = new URL('https://openlibrary.org/search.json');
  if (p.title?.trim()) url.searchParams.set('title', p.title.trim());
  if (p.author?.trim()) url.searchParams.set('author', p.author.trim());
  const q: string[] = [];
  if (p.q?.trim()) q.push(p.q.trim());
  if (p.publisher?.trim()) q.push(`publisher:${phrase(p.publisher)}`);
  if (p.subject?.trim()) q.push(`subject:${phrase(p.subject)}`);
  if (q.length) url.searchParams.set('q', q.join(' '));
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('fields', 'title,author_name,publisher,first_publish_year,isbn,cover_i');

  const t = withTimeout(9000);
  try {
    const res = await fetch(url.toString(), {
      signal: t.signal,
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    });
    if (!res.ok) return [];
    return parseOpenLibrarySearch(await res.json());
  } catch {
    return [];
  } finally {
    t.done();
  }
}

async function searchGoogleBooks(
  p: SearchParams,
  key: string,
  pages: number,
): Promise<BookSearchResult[]> {
  const parts: string[] = [];
  if (p.q?.trim()) parts.push(p.q.trim());
  if (p.title?.trim()) parts.push(`intitle:${phrase(p.title)}`);
  if (p.author?.trim()) parts.push(`inauthor:${phrase(p.author)}`);
  if (p.publisher?.trim()) parts.push(`inpublisher:${phrase(p.publisher)}`);
  if (p.subject?.trim()) parts.push(`subject:${phrase(p.subject)}`);
  const query = parts.join(' ').trim();
  if (!query) return [];

  const out: BookSearchResult[] = [];
  for (let page = 0; page < pages; page++) {
    const url =
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}` +
      `&startIndex=${page * 40}&maxResults=40&printType=books&key=${key}`;
    const t = withTimeout(9000);
    try {
      const res = await fetch(url, {
        signal: t.signal,
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      });
      if (!res.ok) break;
      const parsed = parseGoogleBooksSearch(await res.json());
      if (parsed.length === 0) break; // no more pages
      out.push(...parsed);
    } catch {
      break;
    } finally {
      t.done();
    }
  }
  return out;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  let params: SearchParams;
  try {
    params = (await req.json()) as SearchParams;
  } catch {
    return json({ error: 'invalid_body' }, 400);
  }
  if (!hasQuery(params)) return json({ error: 'empty_query' }, 400);

  // Query Google Books (when keyed — richer metadata + covers) AND Open Library
  // in parallel, then merge: more editions means a better chance of finding the
  // right version/cover. Google first, deduped by ISBN-13.
  const deep = params.deep === true;
  const key = Deno.env.get('GOOGLE_BOOKS_KEY');
  const [google, openlib] = await Promise.all([
    key
      ? searchGoogleBooks(params, key, deep ? 3 : 1)
      : Promise.resolve([] as BookSearchResult[]),
    searchOpenLibrary(params, deep ? 60 : 20),
  ]);

  const seen = new Set<string>();
  const results: BookSearchResult[] = [];
  for (const r of [...google, ...openlib]) {
    if (seen.has(r.isbn13)) continue;
    seen.add(r.isbn13);
    results.push(r);
  }

  return json({ results: results.slice(0, deep ? 120 : 30) }, 200);
});

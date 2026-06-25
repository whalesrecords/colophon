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

async function searchOpenLibrary(p: SearchParams): Promise<BookSearchResult[]> {
  const url = new URL('https://openlibrary.org/search.json');
  if (p.title?.trim()) url.searchParams.set('title', p.title.trim());
  if (p.author?.trim()) url.searchParams.set('author', p.author.trim());
  const q: string[] = [];
  if (p.q?.trim()) q.push(p.q.trim());
  if (p.publisher?.trim()) q.push(`publisher:${phrase(p.publisher)}`);
  if (p.subject?.trim()) q.push(`subject:${phrase(p.subject)}`);
  if (q.length) url.searchParams.set('q', q.join(' '));
  url.searchParams.set('limit', '20');
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

async function searchGoogleBooks(p: SearchParams, key: string): Promise<BookSearchResult[]> {
  const parts: string[] = [];
  if (p.q?.trim()) parts.push(p.q.trim());
  if (p.title?.trim()) parts.push(`intitle:${phrase(p.title)}`);
  if (p.author?.trim()) parts.push(`inauthor:${phrase(p.author)}`);
  if (p.publisher?.trim()) parts.push(`inpublisher:${phrase(p.publisher)}`);
  if (p.subject?.trim()) parts.push(`subject:${phrase(p.subject)}`);
  const query = parts.join(' ').trim();
  if (!query) return [];

  const url =
    `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}` +
    `&maxResults=20&printType=books&key=${key}`;
  const t = withTimeout(9000);
  try {
    const res = await fetch(url, {
      signal: t.signal,
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    });
    if (!res.ok) return [];
    return parseGoogleBooksSearch(await res.json());
  } catch {
    return [];
  } finally {
    t.done();
  }
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

  // Open Library search is keyless and reliable; Google Books is used only when
  // a key is configured (keyless Google Books frequently rate-limits).
  const key = Deno.env.get('GOOGLE_BOOKS_KEY');
  let results: BookSearchResult[] = [];
  if (key) results = await searchGoogleBooks(params, key);
  if (results.length === 0) results = await searchOpenLibrary(params);

  return json({ results }, 200);
});

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from '@supabase/supabase-js';
import { isbn13To10, normalizeIsbn } from './_shared/isbn.ts';
import type { BookSource, NormalizedBook, ParsedBook } from './_shared/book.ts';
import { hasUsableData } from './_shared/book.ts';
import { parseBnfDublinCore, parseGoogleBooks, parseOpenLibrary } from './_shared/book-parsers.ts';

// Descriptive User-Agent so Open Library / BnF can identify the client.
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

async function fetchWithUa(url: string, signal: AbortSignal): Promise<Response> {
  return fetch(url, {
    signal,
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json, text/xml, */*' },
  });
}

function withTimeout(ms: number): { signal: AbortSignal; done: () => void } {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  return { signal: ctrl.signal, done: () => clearTimeout(id) };
}

// --- sources -----------------------------------------------------------------

async function fromGoogleBooks(isbn13: string): Promise<ParsedBook | null> {
  const key = Deno.env.get('GOOGLE_BOOKS_KEY');
  const url =
    `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn13}` + (key ? `&key=${key}` : '');
  const t = withTimeout(8000);
  try {
    const res = await fetchWithUa(url, t.signal);
    if (!res.ok) return null; // 429 (keyless rate limit) etc. -> fall through
    return parseGoogleBooks(await res.json());
  } catch {
    return null;
  } finally {
    t.done();
  }
}

async function fromOpenLibrary(isbn13: string): Promise<ParsedBook | null> {
  const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn13}&format=json&jscmd=data`;
  const t = withTimeout(8000);
  try {
    const res = await fetchWithUa(url, t.signal);
    if (!res.ok) return null;
    return parseOpenLibrary(await res.json(), isbn13);
  } catch {
    return null;
  } finally {
    t.done();
  }
}

async function fromBnf(isbn13: string): Promise<ParsedBook | null> {
  // The BnF catalogue indexes older books by their ISBN-10.
  const isbn10 = isbn13To10(isbn13);
  if (!isbn10) return null; // 979-prefixed ISBNs have no ISBN-10 form
  const url =
    `https://catalogue.bnf.fr/api/SRU?version=1.2&operation=searchRetrieve` +
    `&query=bib.isbn%20all%20%22${isbn10}%22&recordSchema=dublincore`;
  const t = withTimeout(8000);
  try {
    const res = await fetchWithUa(url, t.signal);
    if (!res.ok) return null;
    return parseBnfDublinCore(await res.text());
  } catch {
    return null;
  } finally {
    t.done();
  }
}

const CASCADE: Array<{ source: BookSource; run: (isbn13: string) => Promise<ParsedBook | null> }> =
  [
    { source: 'google_books', run: fromGoogleBooks },
    { source: 'open_library', run: fromOpenLibrary },
    { source: 'bnf', run: fromBnf },
  ];

async function resolve(isbn13: string): Promise<NormalizedBook | null> {
  for (const step of CASCADE) {
    const parsed = await step.run(isbn13);
    if (hasUsableData(parsed)) {
      return { ...parsed, isbn13, source: step.source, raw: parsed };
    }
  }
  return null;
}

function toRow(book: NormalizedBook) {
  return {
    isbn13: book.isbn13,
    title: book.title,
    subtitle: book.subtitle,
    authors: book.authors,
    publisher: book.publisher,
    published_date: book.publishedDate,
    page_count: book.pageCount,
    language: book.language,
    cover_url: book.coverUrl,
    description: book.description,
    source: book.source,
    raw: book.raw as Record<string, unknown>,
    fetched_at: new Date().toISOString(),
  };
}

// --- handler -----------------------------------------------------------------

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  let payload: { isbn?: unknown; force_refresh?: unknown };
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'invalid_body' }, 400);
  }

  const norm = normalizeIsbn(String(payload.isbn ?? ''));
  if (!norm.ok) return json({ error: 'invalid_isbn', reason: norm.error }, 400);
  const isbn13 = norm.isbn13;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // 1. Serve from cache unless a refresh was explicitly requested.
  if (payload.force_refresh !== true) {
    const { data: cached } = await supabase
      .from('book_metadata')
      .select('*')
      .eq('isbn13', isbn13)
      .maybeSingle();
    if (cached) return json({ book: cached, cached: true }, 200);
  }

  // 2. Run the cascade.
  const resolved = await resolve(isbn13);
  if (!resolved) return json({ error: 'not_found', isbn13 }, 404);

  // 3. Upsert into the shared cache (service role bypasses RLS).
  const { data: upserted, error } = await supabase
    .from('book_metadata')
    .upsert(toRow(resolved))
    .select('*')
    .single();

  if (error) return json({ error: 'db_error', detail: error.message }, 500);
  return json({ book: upserted, cached: false }, 200);
});

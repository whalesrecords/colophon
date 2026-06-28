/**
 * Pure parsers that map each lookup source onto the common ParsedBook schema.
 * No network, no Deno/RN APIs — so they run in jest and inside the Deno edge
 * function unchanged. XML is parsed with tolerant regexes; those regexes avoid
 * backslash escapes (using [0-9], [^], [(], [/], lookaheads) so the module can
 * be embedded verbatim in an edge-function deploy without escaping headaches.
 */

import { EMPTY_PARSED, type ParsedBook } from './book.ts';

// --- shared helpers ----------------------------------------------------------

/** ISO 639-2/B (3-letter) -> ISO 639-1 (2-letter); passes through 2-letter codes. */
export function normalizeLanguage(value: string | null | undefined): string | null {
  if (!value) return null;
  const v = value.trim().toLowerCase();
  if (v.length === 2) return v;
  const map: Record<string, string> = {
    fre: 'fr',
    fra: 'fr',
    eng: 'en',
    ger: 'de',
    deu: 'de',
    spa: 'es',
    ita: 'it',
    por: 'pt',
    dut: 'nl',
    nld: 'nl',
    jpn: 'ja',
    chi: 'zh',
    zho: 'zh',
    rus: 'ru',
    ara: 'ar',
    lat: 'la',
    gre: 'el',
    ell: 'el',
    heb: 'he',
    kor: 'ko',
    pol: 'pl',
    swe: 'sv',
    dan: 'da',
    nor: 'no',
    fin: 'fi',
    tur: 'tr',
    ces: 'cs',
    cze: 'cs',
  };
  return map[v] ?? null;
}

function firstInt(value: string | null | undefined): number | null {
  if (!value) return null;
  const m = value.match(/[0-9]+/);
  return m ? parseInt(m[0], 10) : null;
}

/** Normalize a list of genre/subject values (strings or {name}) into a clean set. */
function cleanGenres(values: unknown): string[] | null {
  if (!Array.isArray(values)) return null;
  const out: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const raw =
      typeof value === 'string'
        ? value
        : value && typeof value === 'object' && 'name' in value
          ? String((value as { name: unknown }).name ?? '')
          : '';
    for (const part of raw.split('/')) {
      const genre = part.trim();
      if (!genre || genre.length > 40) continue;
      const key = genre.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(genre);
      if (out.length >= 8) return out;
    }
  }
  return out.length ? out : null;
}

// --- Google Books ------------------------------------------------------------

/** Upgrade a Google Books image link to a clean https URL. */
function cleanGoogleCover(links: Record<string, string> | undefined): string | null {
  if (!links) return null;
  const raw = links.thumbnail ?? links.smallThumbnail;
  if (!raw) return null;
  return raw.replace(/^http:/, 'https:').replace(/&edge=curl/, '');
}

export function parseGoogleBooks(json: unknown): ParsedBook | null {
  const root = json as { items?: Array<{ volumeInfo?: Record<string, any> }> };
  const info = root?.items?.[0]?.volumeInfo;
  if (!info || !info.title) return null;
  return {
    ...EMPTY_PARSED,
    title: info.title ?? null,
    subtitle: info.subtitle ?? null,
    authors: Array.isArray(info.authors) && info.authors.length ? info.authors : null,
    publisher: info.publisher ?? null,
    publishedDate: info.publishedDate ?? null,
    pageCount: typeof info.pageCount === 'number' ? info.pageCount : null,
    language: normalizeLanguage(info.language),
    coverUrl: cleanGoogleCover(info.imageLinks),
    description: info.description ?? null,
    genres: cleanGenres(info.categories),
  };
}

// --- Open Library (jscmd=data) ----------------------------------------------

export function parseOpenLibrary(json: unknown, isbn13: string): ParsedBook | null {
  const root = json as Record<string, any>;
  const entry = root?.[`ISBN:${isbn13}`];
  if (!entry || !entry.title) return null;

  const cover =
    entry.cover?.large ??
    entry.cover?.medium ??
    `https://covers.openlibrary.org/b/isbn/${isbn13}-L.jpg`;

  return {
    ...EMPTY_PARSED,
    title: entry.title ?? null,
    subtitle: entry.subtitle ?? null,
    authors: Array.isArray(entry.authors)
      ? entry.authors.map((a: { name: string }) => a.name).filter(Boolean)
      : null,
    publisher: entry.publishers?.[0]?.name ?? null,
    publishedDate: entry.publish_date ?? null,
    pageCount: typeof entry.number_of_pages === 'number' ? entry.number_of_pages : null,
    language: null, // jscmd=data does not expose a reliable language code
    coverUrl: cover,
    description: typeof entry.notes === 'string' ? entry.notes : null,
    genres: cleanGenres(entry.subjects),
  };
}

// --- BnF SRU (Dublin Core) ---------------------------------------------------

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#([0-9]+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&amp;/g, '&');
}

/** Extract all values of a Dublin Core element, tolerant of any namespace prefix. */
function extractDc(xml: string, field: string): string[] {
  const re = new RegExp(
    `<(?:[A-Za-z0-9]+:)?${field}(?=[ />])[^>]*>([^]*?)</(?:[A-Za-z0-9]+:)?${field}>`,
    'gi',
  );
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    out.push(decodeXmlEntities(m[1].replace(/<[^>]+>/g, '').trim()));
  }
  return out.filter(Boolean);
}

/** "Camus, Albert (1913-1960). Auteur du texte" -> "Albert Camus". */
export function cleanBnfCreator(raw: string): string {
  let s = raw.replace(/[(][^)]*[)]/g, ''); // drop (dates)
  s = s.split(/[.][ ]/)[0].trim(); // drop trailing ". Role"
  s = s.replace(/[ ]+/g, ' ').trim();
  const comma = s.indexOf(',');
  if (comma > -1) {
    const last = s.slice(0, comma).trim();
    const first = s.slice(comma + 1).trim();
    if (first) return `${first} ${last}`;
  }
  return s;
}

/** "Main : sub / Statement of responsibility" -> { title, subtitle }. */
function cleanBnfTitle(raw: string): { title: string; subtitle: string | null } {
  const beforeResp = raw.split(' / ')[0].trim();
  const parts = beforeResp.split(' : ');
  return {
    title: parts[0].trim(),
    subtitle: parts.length > 1 ? parts.slice(1).join(' : ').trim() : null,
  };
}

export function parseBnfDublinCore(fullXml: string): ParsedBook | null {
  // A single ISBN can match several editions; scope to the first DC record.
  const firstRecord = fullXml.match(/<(?:[A-Za-z0-9]+:)?dc(?=[ >])[^]*?<[/](?:[A-Za-z0-9]+:)?dc>/i);
  const xml = firstRecord ? firstRecord[0] : fullXml;

  const titles = extractDc(xml, 'title');
  if (titles.length === 0) return null;

  const { title, subtitle } = cleanBnfTitle(titles[0]);
  const creators = extractDc(xml, 'creator').map(cleanBnfCreator).filter(Boolean);
  const publisher =
    (extractDc(xml, 'publisher')[0] ?? '').replace(/[ ]*[(][^)]*[)][ ]*$/, '') || null;
  const date = extractDc(xml, 'date')[0] ?? null;
  const language = normalizeLanguage(extractDc(xml, 'language')[0]);
  const format = extractDc(xml, 'format')[0] ?? '';
  const pageMatch = format.match(/([0-9]+)[ ]*p(?![A-Za-z])/);
  const description = extractDc(xml, 'description')[0] ?? null;

  return {
    ...EMPTY_PARSED,
    title,
    subtitle,
    authors: creators.length ? creators : null,
    publisher,
    publishedDate: date ? (firstInt(date)?.toString() ?? date) : null,
    pageCount: pageMatch ? parseInt(pageMatch[1], 10) : null,
    language,
    coverUrl: null, // BnF Dublin Core carries no cover image
    description,
    genres: cleanGenres(extractDc(xml, 'subject')),
  };
}

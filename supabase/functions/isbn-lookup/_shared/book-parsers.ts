/**
 * Pure parsers that map each lookup source onto the common ParsedBook schema.
 * No network, no Deno/RN APIs — so they run in jest and inside the Deno edge
 * function unchanged. XML is parsed with tolerant regexes (the BnF Dublin Core
 * payload is flat), avoiding any XML-library dependency.
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
  const m = value.match(/\d+/);
  return m ? parseInt(m[0], 10) : null;
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
  };
}

// --- BnF SRU (Dublin Core) ---------------------------------------------------

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&amp;/g, '&');
}

/** Extract all values of a Dublin Core element, tolerant of any namespace prefix. */
function extractDc(xml: string, field: string): string[] {
  const re = new RegExp(`<(?:\\w+:)?${field}\\b[^>]*>([\\s\\S]*?)</(?:\\w+:)?${field}>`, 'gi');
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    out.push(decodeXmlEntities(m[1].replace(/<[^>]+>/g, '').trim()));
  }
  return out.filter(Boolean);
}

/** "Camus, Albert (1913-1960). Auteur du texte" -> "Albert Camus". */
export function cleanBnfCreator(raw: string): string {
  let s = raw.replace(/\([^)]*\)/g, ''); // drop (dates)
  s = s.split(/\.\s/)[0].trim(); // drop trailing ". Role"
  s = s.replace(/\s+/g, ' ').trim();
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
  const firstRecord = fullXml.match(/<(?:\w+:)?dc\b[^>]*>[\s\S]*?<\/(?:\w+:)?dc>/i);
  const xml = firstRecord ? firstRecord[0] : fullXml;

  const titles = extractDc(xml, 'title');
  if (titles.length === 0) return null;

  const { title, subtitle } = cleanBnfTitle(titles[0]);
  const creators = extractDc(xml, 'creator').map(cleanBnfCreator).filter(Boolean);
  const publisher = (extractDc(xml, 'publisher')[0] ?? '').replace(/\s*\([^)]*\)\s*$/, '') || null;
  const date = extractDc(xml, 'date')[0] ?? null;
  const language = normalizeLanguage(extractDc(xml, 'language')[0]);
  const format = extractDc(xml, 'format')[0] ?? '';
  const pageMatch = format.match(/(\d+)\s*p\b/);
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
  };
}

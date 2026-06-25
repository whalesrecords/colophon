/**
 * Detect a series + volume number from a book title/subtitle, client-side.
 * French BD/manga almost always carry a "Tome N" / "Vol. N" / "T.N" / "#N"
 * marker, so we can group what the user already owns without any external API.
 */

export interface SeriesRef {
  name: string;
  volume: number;
}

// A volume marker: "tome 3", "tomes 3", "volume 3", "vol. 3", "vol 3", "t. 3",
// "t3", or "#3". Case-insensitive; the number is captured.
const VOLUME_RE = /(?:\btome|\btomes|\bvolume|\bvol|\bt|#)\.?\s*°?\s*(\d{1,3})(?!\d)/i;

/** Normalize a series name for grouping (case/space/punct-insensitive key). */
export function seriesKey(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function parseSeries(
  title: string | null | undefined,
  subtitle?: string | null,
): SeriesRef | null {
  const t = (title ?? '').trim();
  if (!t) return null;
  const combined = [t, subtitle ?? ''].join(' ');

  const match = combined.match(VOLUME_RE);
  if (!match) return null;
  const volume = parseInt(match[1], 10);
  if (!volume || volume > 300) return null;

  // Series name = the title up to the marker (if the marker is in the title),
  // otherwise the whole title (the volume came from the subtitle).
  const inTitle = t.match(VOLUME_RE);
  let name = inTitle && inTitle.index !== undefined ? t.slice(0, inTitle.index) : t;
  name = name.replace(/[\s,:;\-–—]+$/, '').trim();
  if (!name || name.length < 2) return null;

  return { name, volume };
}

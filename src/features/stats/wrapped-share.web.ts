/**
 * Web "Wrapped"-style year-recap share. Renders a vertical poster on a <canvas>
 * in Colophon's colours — big numbers, top author/genre, reading rhythm — and
 * exports it as a PNG image or an animated WebM video (numbers counting up,
 * bars growing). No remote book covers are drawn (cross-origin would taint the
 * canvas and block export); the poster is typographic + colour, on brand.
 */

export interface WrappedShareData {
  year: number;
  booksRead: number;
  pages: number;
  pagesApproximate: boolean;
  topAuthor: string | null;
  topTheme: string | null;
  busiestMonth: { label: string; count: number } | null;
  byMonth: number[];
  avgRating: number | null;
}

export interface WrappedCapabilities {
  image: boolean;
  video: boolean;
}

const W = 1080;
const H = 1920;

const C = {
  nuit: '#221B14',
  panel: '#2C241B',
  paper: '#F4EEE2',
  soft: '#CDC3B1',
  brique: '#C25A48',
  prusse: '#5191AB',
  foret: '#62A57E',
  ocre: '#CBA255',
  muted: '#8E867A',
};

const HEAD = 'Spectral_600SemiBold';
const HEAD_MED = 'Spectral_500Medium';
const BODY = 'SchibstedGrotesk_500Medium';
const BODY_SEMI = 'SchibstedGrotesk_600SemiBold';

export function wrappedCapabilities(): WrappedCapabilities {
  const canCanvas = typeof document !== 'undefined';
  const canVideo =
    canCanvas &&
    typeof (HTMLCanvasElement.prototype as { captureStream?: unknown }).captureStream ===
      'function' &&
    typeof window !== 'undefined' &&
    typeof window.MediaRecorder === 'function';
  return { image: canCanvas, video: canVideo };
}

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const reveal = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);

function font(family: string, px: number) {
  return `normal ${px}px "${family}", Georgia, system-ui, sans-serif`;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Draw the whole poster at animation time t∈[0,1] (use t=1 for the still image). */
function drawPoster(ctx: CanvasRenderingContext2D, d: WrappedShareData, t: number) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = C.nuit;
  ctx.fillRect(0, 0, W, H);
  ctx.textBaseline = 'alphabetic';

  // Top tranche stripe (the four series colours).
  const stripes = [C.brique, C.prusse, C.foret, C.ocre];
  stripes.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect((W / 4) * i, 0, W / 4, 12);
  });

  const cx = W / 2;

  // Wordmark + heading.
  const titleA = reveal(t, 0, 0.1);
  ctx.globalAlpha = titleA;
  ctx.textAlign = 'center';
  ctx.fillStyle = C.ocre;
  ctx.font = font(BODY_SEMI, 34);
  ctx.letterSpacing = '8px';
  ctx.fillText('COLOPHON', cx, 150);
  ctx.letterSpacing = '0px';

  ctx.fillStyle = C.soft;
  ctx.font = font(BODY, 30);
  ctx.fillText('MON ANNÉE LECTURE', cx, 232);

  ctx.fillStyle = C.paper;
  ctx.font = font(HEAD, 150);
  ctx.fillText(String(d.year), cx, 380);
  ctx.globalAlpha = 1;

  // Headline numbers.
  const books = Math.round(d.booksRead * easeOut(reveal(t, 0.1, 0.36)));
  ctx.globalAlpha = reveal(t, 0.1, 0.2);
  ctx.fillStyle = C.brique;
  ctx.font = font(HEAD, 230);
  ctx.fillText(String(books), cx, 660);
  ctx.fillStyle = C.soft;
  ctx.font = font(BODY, 36);
  ctx.fillText(d.booksRead === 1 ? 'livre lu' : 'livres lus', cx, 720);
  ctx.globalAlpha = 1;

  const pages = Math.round(d.pages * easeOut(reveal(t, 0.34, 0.56)));
  ctx.globalAlpha = reveal(t, 0.34, 0.44);
  ctx.fillStyle = C.prusse;
  ctx.font = font(HEAD, 120);
  ctx.fillText(`${d.pagesApproximate ? '~' : ''}${pages.toLocaleString('fr-FR')}`, cx, 880);
  ctx.fillStyle = C.soft;
  ctx.font = font(BODY, 32);
  ctx.fillText('pages lues', cx, 932);
  ctx.globalAlpha = 1;

  // Meta rows.
  const rows: { label: string; value: string; dot: string }[] = [];
  if (d.topAuthor) rows.push({ label: "AUTEUR DE L'ANNÉE", value: d.topAuthor, dot: C.foret });
  if (d.topTheme) rows.push({ label: 'GENRE PHARE', value: d.topTheme, dot: C.ocre });
  if (d.busiestMonth)
    rows.push({
      label: 'MOIS LE PLUS ACTIF',
      value: `${d.busiestMonth.label} · ${d.busiestMonth.count}`,
      dot: C.brique,
    });
  if (d.avgRating != null)
    rows.push({ label: 'NOTE MOYENNE', value: `${d.avgRating.toFixed(1)} / 5`, dot: C.prusse });

  const rowsA = reveal(t, 0.5, 0.74);
  ctx.globalAlpha = rowsA;
  let ry = 1010;
  const rx = 90;
  const rw = W - rx * 2;
  for (const r of rows.slice(0, 4)) {
    ctx.fillStyle = C.panel;
    roundRect(ctx, rx, ry, rw, 112, 22);
    ctx.fill();
    ctx.fillStyle = r.dot;
    ctx.beginPath();
    ctx.arc(rx + 44, ry + 56, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.textAlign = 'left';
    ctx.fillStyle = C.muted;
    ctx.font = font(BODY_SEMI, 22);
    ctx.letterSpacing = '2px';
    ctx.fillText(r.label, rx + 78, ry + 50);
    ctx.letterSpacing = '0px';
    ctx.fillStyle = C.paper;
    ctx.font = font(HEAD_MED, 40);
    const maxW = rw - 110;
    let v = r.value;
    while (ctx.measureText(v).width > maxW && v.length > 4) v = v.slice(0, -2);
    if (v !== r.value) v = v.slice(0, -1) + '…';
    ctx.fillText(v, rx + 78, ry + 92);
    ry += 128;
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'center';

  // Reading rhythm bars (12 months).
  const months = d.byMonth.length === 12 ? d.byMonth : Array.from({ length: 12 }, () => 0);
  const maxM = Math.max(1, ...months);
  const barsA = reveal(t, 0.6, 0.88);
  const baseY = 1756;
  const gap = 16;
  const bw = (W - rx * 2 - gap * 11) / 12;
  const maxBar = 150;
  ctx.fillStyle = C.muted;
  ctx.font = font(BODY_SEMI, 22);
  ctx.letterSpacing = '2px';
  ctx.textAlign = 'left';
  ctx.fillText('VOTRE RYTHME', rx, 1576);
  ctx.letterSpacing = '0px';
  const monthLetters = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
  months.forEach((m, i) => {
    const x = rx + i * (bw + gap);
    const full = (m / maxM) * maxBar;
    const h = Math.max(4, full * easeOut(barsA));
    ctx.fillStyle = m > 0 ? C.ocre : C.panel;
    roundRect(ctx, x, baseY - h, bw, h, 6);
    ctx.fill();
    ctx.fillStyle = C.muted;
    ctx.font = font(BODY, 20);
    ctx.textAlign = 'center';
    ctx.fillText(monthLetters[i], x + bw / 2, baseY + 32);
  });

  // Footer.
  ctx.globalAlpha = reveal(t, 0.85, 1);
  ctx.textAlign = 'center';
  ctx.fillStyle = C.muted;
  ctx.font = font(BODY, 28);
  ctx.fillText('colophon-app.com', cx, 1850);
  ctx.globalAlpha = 1;
}

async function makeCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no 2d context');
  // Make sure the brand fonts are ready so the poster isn't drawn in a fallback.
  try {
    const f = (document as Document & { fonts?: FontFaceSet }).fonts;
    if (f?.ready) await f.ready;
  } catch {
    // ignore — fall back to system fonts
  }
  return { canvas, ctx };
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

async function shareOrDownload(blob: Blob, filename: string, type: string) {
  const nav = navigator as Navigator & {
    canShare?: (data: { files: File[] }) => boolean;
    share?: (data: { files?: File[]; title?: string; text?: string }) => Promise<void>;
  };
  try {
    const file = new File([blob], filename, { type });
    if (nav.canShare && nav.canShare({ files: [file] }) && nav.share) {
      await nav.share({ files: [file], title: 'Mon année lecture Colophon' });
      return;
    }
  } catch {
    // user cancelled or share failed — fall back to a download
  }
  triggerDownload(blob, filename);
}

export async function shareWrappedImage(d: WrappedShareData): Promise<void> {
  const { canvas, ctx } = await makeCanvas();
  drawPoster(ctx, d, 1);
  const blob: Blob = await new Promise((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error('toBlob failed'))), 'image/png'),
  );
  await shareOrDownload(blob, `colophon-bilan-${d.year}.png`, 'image/png');
}

export async function shareWrappedVideo(
  d: WrappedShareData,
  onProgress?: (p: number) => void,
): Promise<void> {
  const { canvas, ctx } = await makeCanvas();
  drawPoster(ctx, d, 0);
  const stream = (
    canvas as HTMLCanvasElement & { captureStream: (fps: number) => MediaStream }
  ).captureStream(30);
  const mime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find((m) =>
    window.MediaRecorder.isTypeSupported(m),
  );
  const rec = new MediaRecorder(stream, {
    mimeType: mime,
    videoBitsPerSecond: 6_000_000,
  });
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => {
    if (e.data.size) chunks.push(e.data);
  };
  const stopped = new Promise<void>((res) => {
    rec.onstop = () => res();
  });
  rec.start();

  const DUR = 7000;
  const start = performance.now();
  await new Promise<void>((res) => {
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DUR);
      drawPoster(ctx, d, t);
      onProgress?.(t);
      if (t < 1) requestAnimationFrame(tick);
      else res();
    };
    requestAnimationFrame(tick);
  });
  // Hold the final frame for a beat so the video doesn't cut on the last number.
  await new Promise((r) => setTimeout(r, 600));
  rec.stop();
  await stopped;

  const blob = new Blob(chunks, { type: 'video/webm' });
  await shareOrDownload(blob, `colophon-bilan-${d.year}.webm`, 'video/webm');
}

/** Plain-text fallback (kept for parity with the native module). */
export function shareWrappedText(d: WrappedShareData): void {
  const msg =
    `Mon année lecture ${d.year} sur Colophon : ${d.booksRead} livres, ` +
    `${d.pagesApproximate ? '~' : ''}${d.pages.toLocaleString('fr-FR')} pages lues` +
    (d.topTheme ? ` · thème phare : ${d.topTheme}` : '') +
    '. 📚';
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(msg).catch(() => undefined);
  }
}

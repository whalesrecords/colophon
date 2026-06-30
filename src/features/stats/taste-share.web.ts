/**
 * Web share for the "Profil de lecture" — renders a Colophon-coloured poster of the
 * reader's semantic universes (the cluster bars) on a <canvas> and exports it as a
 * PNG (Web Share when available, else download). Mirrors wrapped-share.web.ts.
 */

export interface TasteShareData {
  clusters: { label: string; percent: number }[];
}

const W = 1080;
const H = 1350;

const C = {
  nuit: '#221B14',
  panel: '#2C241B',
  paper: '#F4EEE2',
  soft: '#CDC3B1',
  track: '#3A3025',
  muted: '#8E867A',
  ocre: '#CBA255',
};
const TRANCHES = ['#C25A48', '#5191AB', '#62A57E', '#CBA255', '#8E867A', '#9B7A53'];

const HEAD = 'Spectral_600SemiBold';
const BODY = 'SchibstedGrotesk_500Medium';
const BODY_SEMI = 'SchibstedGrotesk_600SemiBold';

export function tasteShareImageSupported(): boolean {
  return typeof document !== 'undefined';
}

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

function drawPoster(ctx: CanvasRenderingContext2D, d: TasteShareData) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = C.nuit;
  ctx.fillRect(0, 0, W, H);
  ctx.textBaseline = 'alphabetic';

  // Top tranche stripe.
  TRANCHES.slice(0, 4).forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect((W / 4) * i, 0, W / 4, 12);
  });

  const cx = W / 2;
  ctx.textAlign = 'center';
  ctx.fillStyle = C.ocre;
  ctx.font = font(BODY_SEMI, 32);
  ctx.letterSpacing = '8px';
  ctx.fillText('COLOPHON', cx, 140);
  ctx.letterSpacing = '0px';

  ctx.fillStyle = C.paper;
  ctx.font = font(HEAD, 76);
  ctx.fillText('Mon profil de lecture', cx, 250);

  ctx.fillStyle = C.soft;
  ctx.font = font(BODY, 30);
  ctx.fillText('Mes univers, par affinité', cx, 308);

  // Cluster bars.
  const clusters = [...d.clusters]
    .filter((c) => c && c.label && c.percent > 0)
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 6);
  const rx = 90;
  const rw = W - rx * 2;
  let ry = 430;
  const rowH = 132;
  ctx.textAlign = 'left';
  clusters.forEach((c, i) => {
    const color = TRANCHES[i % TRANCHES.length];
    ctx.fillStyle = C.paper;
    ctx.font = font(BODY_SEMI, 38);
    let label = c.label;
    const maxW = rw - 130;
    while (ctx.measureText(label).width > maxW && label.length > 4) label = label.slice(0, -2);
    if (label !== c.label) label = label.slice(0, -1) + '…';
    ctx.fillText(label, rx, ry);
    ctx.textAlign = 'right';
    ctx.fillStyle = color;
    ctx.font = font(HEAD, 44);
    ctx.fillText(`${Math.round(c.percent)}%`, rx + rw, ry);
    ctx.textAlign = 'left';
    // bar
    ctx.fillStyle = C.track;
    roundRect(ctx, rx, ry + 24, rw, 26, 8);
    ctx.fill();
    ctx.fillStyle = color;
    roundRect(ctx, rx, ry + 24, (rw * Math.min(100, c.percent)) / 100, 26, 8);
    ctx.fill();
    ry += rowH;
  });

  ctx.textAlign = 'center';
  ctx.fillStyle = C.muted;
  ctx.font = font(BODY, 28);
  ctx.fillText('colophon-app.com', cx, H - 70);
}

async function makeCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no 2d context');
  try {
    const f = (document as Document & { fonts?: FontFaceSet }).fonts;
    if (f?.ready) await f.ready;
  } catch {
    // ignore
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

export async function shareTasteImage(d: TasteShareData): Promise<void> {
  const { canvas, ctx } = await makeCanvas();
  drawPoster(ctx, d);
  const blob: Blob = await new Promise((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error('toBlob failed'))), 'image/png'),
  );
  const nav = navigator as Navigator & {
    canShare?: (data: { files: File[] }) => boolean;
    share?: (data: { files?: File[]; title?: string }) => Promise<void>;
  };
  try {
    const file = new File([blob], 'colophon-profil-lecture.png', { type: 'image/png' });
    if (nav.canShare && nav.canShare({ files: [file] }) && nav.share) {
      await nav.share({ files: [file], title: 'Mon profil de lecture Colophon' });
      return;
    }
  } catch {
    // fall through to download
  }
  triggerDownload(blob, 'colophon-profil-lecture.png');
}

/** Plain-text summary (for the in-app post + native fallback). */
export function tasteShareText(d: TasteShareData): string {
  const top = [...d.clusters]
    .filter((c) => c && c.label && c.percent > 0)
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 4)
    .map((c) => `${c.label} ${Math.round(c.percent)}%`)
    .join(' · ');
  return `📚 Mon profil de lecture sur Colophon : ${top}.`;
}

/**
 * Web share for the "Profil de lecture" — a Colophon-coloured poster of the reader's
 * semantic universes (cluster bars) on a <canvas>, exported as a PNG. Now carries the
 * Colophon mark, the reader's name, and a QR code that opens their profile so anyone
 * can follow them. Mirrors wrapped-share.web.ts.
 */
import qrcode from 'qrcode-generator';

export interface TasteShareData {
  clusters: { label: string; percent: number }[];
  name: string;
  /** URL the QR encodes — opens the reader's profile so it can be followed. */
  followUrl: string;
}

const W = 1080;
const H = 1350;

const C = {
  nuit: '#221B14',
  paper: '#F4EEE2',
  soft: '#CDC3B1',
  track: '#3A3025',
  muted: '#8E867A',
  ocre: '#CBA255',
  ink: '#2A1E15',
};
const TRANCHES = ['#C25A48', '#5191AB', '#62A57E', '#CBA255', '#8E867A', '#9B7A53'];
// Logo slices (dark variant — the poster sits on nuit): ocre/forêt/prusse/brique.
const MARK_SLICES = ['#D8B36A', '#3E9460', '#2E78A6', '#C0533C'];

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

/** The Colophon mark (pyramid of 4 tranche slices on a shelf + § medallion). */
function drawMark(ctx: CanvasRenderingContext2D, mx: number, my: number, S: number) {
  const sc = (v: number) => (v / 100) * S;
  const rows = [
    { w: 44, y: 16 },
    { w: 60, y: 30.5 },
    { w: 72, y: 45 },
    { w: 82, y: 59.5 },
  ];
  rows.forEach((r, i) => {
    ctx.fillStyle = MARK_SLICES[i];
    roundRect(ctx, mx + sc(50 - r.w / 2), my + sc(r.y), sc(r.w), sc(11), sc(3));
    ctx.fill();
  });
  // shelf
  ctx.fillStyle = C.paper;
  roundRect(ctx, mx + sc(6), my + sc(74), sc(88), sc(3), sc(1.5));
  ctx.fill();
  // § medallion
  ctx.beginPath();
  ctx.arc(mx + sc(82), my + sc(80), sc(15), 0, Math.PI * 2);
  ctx.fillStyle = C.paper;
  ctx.fill();
  ctx.fillStyle = C.nuit;
  ctx.font = font(HEAD, sc(20));
  ctx.textAlign = 'center';
  ctx.fillText('§', mx + sc(82), my + sc(87));
}

/** A branded QR (espresso modules) for `url`, fit inside a square at (x,y,size). */
function drawQR(ctx: CanvasRenderingContext2D, url: string, x: number, y: number, size: number) {
  const qr = qrcode(0, 'M');
  qr.addData(url);
  qr.make();
  const count = qr.getModuleCount();
  const pad = 18;
  // paper panel
  ctx.fillStyle = C.paper;
  roundRect(ctx, x, y, size, size, 22);
  ctx.fill();
  const cell = (size - pad * 2) / count;
  ctx.fillStyle = C.ink;
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (qr.isDark(r, c)) {
        ctx.fillRect(
          Math.floor(x + pad + c * cell),
          Math.floor(y + pad + r * cell),
          Math.ceil(cell),
          Math.ceil(cell),
        );
      }
    }
  }
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
  drawMark(ctx, cx - 60, 48, 120);

  ctx.textAlign = 'center';
  ctx.fillStyle = C.ocre;
  ctx.font = font(BODY_SEMI, 26);
  ctx.letterSpacing = '7px';
  ctx.fillText('COLOPHON', cx, 214);
  ctx.letterSpacing = '0px';

  ctx.fillStyle = C.paper;
  ctx.font = font(HEAD, 58);
  ctx.fillText('Mon profil de lecture', cx, 286);

  // Reader name.
  ctx.fillStyle = C.ocre;
  ctx.font = font(HEAD, 40);
  let nm = d.name || 'Lecteur';
  while (ctx.measureText(nm).width > W - 200 && nm.length > 3) nm = nm.slice(0, -2);
  if (nm !== (d.name || 'Lecteur')) nm = nm.slice(0, -1) + '…';
  ctx.fillText(nm, cx, 344);

  // Cluster bars.
  const clusters = [...d.clusters]
    .filter((c) => c && c.label && c.percent > 0)
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 5);
  const rx = 90;
  const rw = W - rx * 2;
  let ry = 430;
  const rowH = 104;
  ctx.textAlign = 'left';
  clusters.forEach((c, i) => {
    const color = TRANCHES[i % TRANCHES.length];
    ctx.fillStyle = C.paper;
    ctx.font = font(BODY_SEMI, 34);
    let label = c.label;
    const maxW = rw - 120;
    while (ctx.measureText(label).width > maxW && label.length > 4) label = label.slice(0, -2);
    if (label !== c.label) label = label.slice(0, -1) + '…';
    ctx.fillText(label, rx, ry);
    ctx.textAlign = 'right';
    ctx.fillStyle = color;
    ctx.font = font(HEAD, 40);
    ctx.fillText(`${Math.round(c.percent)}%`, rx + rw, ry);
    ctx.textAlign = 'left';
    ctx.fillStyle = C.track;
    roundRect(ctx, rx, ry + 22, rw, 24, 8);
    ctx.fill();
    ctx.fillStyle = color;
    roundRect(ctx, rx, ry + 22, (rw * Math.min(100, c.percent)) / 100, 24, 8);
    ctx.fill();
    ry += rowH;
  });

  // Follow QR.
  const qrSize = 200;
  const qrY = 968;
  drawQR(ctx, d.followUrl, cx - qrSize / 2, qrY, qrSize);
  ctx.textAlign = 'center';
  ctx.fillStyle = C.soft;
  ctx.font = font(BODY_SEMI, 26);
  ctx.fillText('Scanne pour me suivre', cx, qrY + qrSize + 44);

  ctx.fillStyle = C.muted;
  ctx.font = font(BODY, 24);
  ctx.fillText('colophon-app.com', cx, H - 40);
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
  return `📚 Le profil de lecture de ${d.name || 'un lecteur'} sur Colophon : ${top}. Suis-moi : ${d.followUrl}`;
}

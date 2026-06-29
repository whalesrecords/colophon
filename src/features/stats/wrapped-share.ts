import { Share as RNShare } from 'react-native';

/**
 * Native fallback for the "Wrapped" share. Rich image/video export is web-only
 * for now (it draws on a <canvas>); on iOS/Android we share a text summary via
 * the system sheet. A native build can later add react-native-view-shot / Skia
 * to render the same poster — this keeps the call sites identical.
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

export function wrappedCapabilities(): WrappedCapabilities {
  return { image: false, video: false };
}

function textOf(d: WrappedShareData): string {
  return (
    `Mon année lecture ${d.year} sur Colophon : ${d.booksRead} livres, ` +
    `${d.pagesApproximate ? '~' : ''}${d.pages.toLocaleString('fr-FR')} pages lues` +
    (d.topTheme ? ` · thème phare : ${d.topTheme}` : '') +
    '. 📚'
  );
}

export function shareWrappedText(d: WrappedShareData): void {
  RNShare.share({ message: textOf(d) }).catch(() => undefined);
}

export async function shareWrappedImage(
  d: WrappedShareData,
  _onProgress?: (p: number) => void,
): Promise<void> {
  shareWrappedText(d);
}

export async function shareWrappedVideo(
  d: WrappedShareData,
  _onProgress?: (p: number) => void,
): Promise<void> {
  shareWrappedText(d);
}

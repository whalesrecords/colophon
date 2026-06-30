import { Share } from 'react-native';

/**
 * Native share for the "Profil de lecture". No canvas on native (a future build can
 * add view-shot/Skia to render the same poster), so we share the text summary + the
 * follow link.
 */

export interface TasteShareData {
  clusters: { label: string; percent: number }[];
  name: string;
  followUrl: string;
}

export function tasteShareImageSupported(): boolean {
  return false;
}

export function tasteShareText(d: TasteShareData): string {
  const top = [...d.clusters]
    .filter((c) => c && c.label && c.percent > 0)
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 4)
    .map((c) => `${c.label} ${Math.round(c.percent)}%`)
    .join(' · ');
  return `📚 Le profil de lecture de ${d.name || 'un lecteur'} sur Colophon : ${top}. Suis-moi : ${d.followUrl}`;
}

export async function shareTasteImage(d: TasteShareData): Promise<void> {
  await Share.share({ message: tasteShareText(d) }).catch(() => undefined);
}

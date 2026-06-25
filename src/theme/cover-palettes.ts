// Background / foreground pairs from the handoff's demo covers, used to compose
// a typographic cover when no real cover image is available. Chosen
// deterministically per ISBN so a given book always gets the same palette.
const PAIRS: readonly [string, string][] = [
  ['#26231F', '#E8E0CF'],
  ['#2B3A55', '#EFE9DC'],
  ['#B65D3C', '#F6EFE2'],
  ['#DCD6C8', '#1C1A17'],
  ['#B0853A', '#211C12'],
  ['#7E8A6F', '#F4EFE2'],
  ['#6E7C8C', '#F2ECDE'],
  ['#9B968C', '#1C1A17'],
  ['#46384A', '#EDE4E0'],
  ['#2E4A47', '#EAE6D8'],
  ['#28324A', '#E7E2D4'],
  ['#C2A29A', '#1C1A17'],
];

export function composedPalette(seed: string): { bg: string; fg: string } {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const [bg, fg] = PAIRS[hash % PAIRS.length];
  return { bg, fg };
}

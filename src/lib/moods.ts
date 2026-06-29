/**
 * Mood / ambiance search (à la StoryGraph) — the reader answers how they feel, and we
 * cross that with the genres already in their library to suggest what to read tonight.
 *
 * We don't have crowd-sourced per-book mood tags, so each mood maps to a set of
 * genre/subject keywords, matched (accent-insensitive substring) against each book's
 * `book_metadata.genres`. Pure + tested so the mapping can evolve safely.
 */

export type MoodKey = 'mood' | 'rhythm' | 'ambiance';

export interface MoodOption {
  id: string;
  label: string;
  keywords: string[];
}

export interface MoodQuestion {
  key: MoodKey;
  question: string;
  options: MoodOption[];
}

export const MOOD_QUESTIONS: MoodQuestion[] = [
  {
    key: 'mood',
    question: 'Comment te sens-tu, là ?',
    options: [
      {
        id: 'funny',
        label: 'Léger et drôle',
        keywords: ['humor', 'humour', 'comed', 'comic', 'feel-good'],
      },
      {
        id: 'cry',
        label: 'Envie de pleurer un bon coup',
        keywords: ['drama', 'dram', 'romance', 'traged', 'sentiment'],
      },
      {
        id: 'thrill',
        label: 'Adrénaline et suspense',
        keywords: ['thriller', 'suspense', 'crime', 'polar', 'action', 'mystery', 'mystere'],
      },
      {
        id: 'escape',
        label: "M'évader dans un autre monde",
        keywords: ['fantasy', 'fantast', 'science fiction', 'sci-fi', 'imaginaire', 'heroic'],
      },
      {
        id: 'think',
        label: 'Réfléchir profondément',
        keywords: [
          'philosoph',
          'essai',
          'essay',
          'histoire',
          'history',
          'science',
          'politiq',
          'sociolog',
        ],
      },
    ],
  },
  {
    key: 'rhythm',
    question: 'Quel rythme ?',
    options: [
      {
        id: 'fast',
        label: 'Rapide, happé dès la 1ʳᵉ page',
        keywords: ['thriller', 'action', 'comic', 'manga', 'bande dessinee'],
      },
      {
        id: 'slow',
        label: 'Lent et contemplatif',
        keywords: ['poetry', 'poesie', 'literary', 'litterature', 'essai', 'classic'],
      },
      { id: 'balanced', label: 'Équilibré', keywords: [] },
    ],
  },
  {
    key: 'ambiance',
    question: 'Quelle ambiance ?',
    options: [
      {
        id: 'dark',
        label: 'Sombre et intense',
        keywords: ['thriller', 'horror', 'horreur', 'drame', 'noir', 'dark', 'dram'],
      },
      {
        id: 'feelgood',
        label: 'Légère et feel-good',
        keywords: ['feel-good', 'humor', 'humour', 'comed', 'romance', 'jeunesse'],
      },
      {
        id: 'mystery',
        label: 'Mystérieuse',
        keywords: ['mystery', 'mystere', 'crime', 'polar', 'enquete', 'thriller'],
      },
      { id: 'romance', label: 'Romantique', keywords: ['romance', 'romanc', 'sentiment', 'amour'] },
      {
        id: 'inspiring',
        label: 'Inspirante',
        keywords: ['inspir', 'developpement', 'biograph', 'spiritu', 'essai'],
      },
    ],
  },
];

export interface MoodAnswers {
  mood?: string;
  rhythm?: string;
  ambiance?: string;
}

export function normalizeText(s: string): string {
  // Strip combining diacritics (̀-ͯ) so "mystère" matches "mystere".
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Union of the genre keywords implied by the selected answers. */
export function keywordsFor(answers: MoodAnswers): string[] {
  const set = new Set<string>();
  for (const q of MOOD_QUESTIONS) {
    const sel = answers[q.key];
    const opt = q.options.find((o) => o.id === sel);
    for (const k of opt?.keywords ?? []) set.add(k);
  }
  return [...set];
}

/** How many of the keywords appear in the book's genres (0 = no match). */
export function scoreGenres(genres: string[] | null | undefined, keywords: string[]): number {
  if (!genres || genres.length === 0 || keywords.length === 0) return 0;
  const hay = genres.map(normalizeText).join(' | ');
  let score = 0;
  for (const k of keywords) {
    if (hay.includes(normalizeText(k))) score += 1;
  }
  return score;
}

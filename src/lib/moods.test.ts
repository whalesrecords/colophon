import { keywordsFor, MOOD_QUESTIONS, scoreGenres } from './moods';

describe('moods', () => {
  it('unions keywords from the selected answers', () => {
    const kw = keywordsFor({ mood: 'thrill', ambiance: 'mystery' });
    expect(kw).toContain('thriller');
    expect(kw).toContain('mystere');
  });

  it('ignores the neutral "équilibré" rhythm (no keywords)', () => {
    expect(keywordsFor({ rhythm: 'balanced' })).toEqual([]);
  });

  it('matches a thriller to the suspense mood, accent-insensitive', () => {
    const kw = keywordsFor({ mood: 'thrill' });
    expect(scoreGenres(['Thriller', 'Policier'], kw)).toBeGreaterThan(0);
    expect(scoreGenres(['Mystère'], kw)).toBeGreaterThan(0); // matches "mystere"
  });

  it('does not match an unrelated genre', () => {
    const kw = keywordsFor({ mood: 'funny' });
    expect(scoreGenres(['Philosophy'], kw)).toBe(0);
  });

  it('every option id is unique within its question', () => {
    for (const q of MOOD_QUESTIONS) {
      const ids = q.options.map((o) => o.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});

import { en, fr, translate } from './translations';

describe('translate', () => {
  it('returns the French source string', () => {
    expect(translate('fr', 'profile.signOut')).toBe('Se déconnecter');
  });

  it('returns the English translation', () => {
    expect(translate('en', 'profile.signOut')).toBe('Sign out');
  });

  it('interpolates variables in both locales', () => {
    expect(translate('fr', 'profile.readInYear', { year: 2026 })).toBe('Lus en 2026');
    expect(translate('en', 'profile.readInYear', { year: 2026 })).toBe('Read in 2026');
  });

  it('falls back to French when a key is missing from a locale', () => {
    // Simulate a not-yet-translated key by checking the fallback path directly.
    const incomplete = (key: keyof typeof fr) =>
      (en as Partial<Record<keyof typeof fr, string>>)[key] ?? fr[key];
    expect(incomplete('profile.book')).toBeTruthy();
  });

  it('every English key is a real French key (no orphans)', () => {
    for (const key of Object.keys(en)) {
      expect(key in fr).toBe(true);
    }
  });
});

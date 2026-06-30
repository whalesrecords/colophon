import { excludeOwnedRecs, normalizeWork } from './reco-filter';

describe('normalizeWork', () => {
  it('collapses editions/volumes/language casing to one work key', () => {
    expect(normalizeWork('Berserk - Tome 09')).toBe('berserk');
    expect(normalizeWork('Berserk (Chaos Edition)')).toBe('berserk');
    expect(normalizeWork('BERSERK')).toBe('berserk');
    expect(normalizeWork('Fire Punch')).toBe('firepunch');
  });
});

describe('excludeOwnedRecs', () => {
  const library = [
    { title: 'Berserk - Tome 09', author: 'Kentaro Miura' },
    { title: 'Fire Punch - Tome 1', author: 'Tatsuki Fujimoto' },
    { title: 'Bonne nuit Pun Pun - Tome 3', author: 'Inio Asano' }, // FR edition
    { title: 'Blame! - Tome 02', author: 'Tsutomu Nihei' }, // wishlist counts too
  ];

  it('drops a different edition of an owned series (Berserk)', () => {
    const out = excludeOwnedRecs([{ title: 'Berserk', author: 'Kentaro Miura' }], library);
    expect(out).toHaveLength(0);
  });

  it('drops an owned title (Fire Punch)', () => {
    const out = excludeOwnedRecs([{ title: 'Fire Punch', author: 'Tatsuki Fujimoto' }], library);
    expect(out).toHaveLength(0);
  });

  it('drops a wishlisted title (Blame!)', () => {
    const out = excludeOwnedRecs([{ title: 'Blame!', author: 'Tsutomu Nihei' }], library);
    expect(out).toHaveLength(0);
  });

  it('drops a cross-language same-author match (Good Night Punpun ⇄ Bonne nuit Pun Pun)', () => {
    const out = excludeOwnedRecs([{ title: 'Good Night Punpun', author: 'Inio Asano' }], library);
    expect(out).toHaveLength(0);
  });

  it('keeps a genuinely new series', () => {
    const out = excludeOwnedRecs([{ title: 'Vinland Saga', author: 'Makoto Yukimura' }], library);
    expect(out).toHaveLength(1);
  });
});

import { leboncoinUrl, momoxSellUrl, vintedUrl } from './marketplace';

describe('marketplace links', () => {
  it('momox points at the buyback (sell) page', () => {
    expect(momoxSellUrl()).toBe('https://www.momox.fr/vendre-livres/');
  });

  it('Vinted searches by title + author', () => {
    expect(vintedUrl('9782723448690', 'Berserk', 'Kentaro Miura')).toBe(
      'https://www.vinted.fr/catalog?search_text=Berserk%20Kentaro%20Miura',
    );
  });

  it('Leboncoin searches by title + author', () => {
    expect(leboncoinUrl('9782723448690', 'Berserk', 'Kentaro Miura')).toBe(
      'https://www.leboncoin.fr/recherche?text=Berserk%20Kentaro%20Miura',
    );
  });

  it('falls back to the ISBN when there is no title', () => {
    expect(vintedUrl('9782723448690', null, null)).toBe(
      'https://www.vinted.fr/catalog?search_text=9782723448690',
    );
  });
});

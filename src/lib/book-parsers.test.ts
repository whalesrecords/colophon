import {
  cleanBnfCreator,
  normalizeLanguage,
  parseBnfDublinCore,
  parseGoogleBooks,
  parseOpenLibrary,
} from './book-parsers';

describe('normalizeLanguage', () => {
  it('maps 3-letter codes and passes 2-letter codes through', () => {
    expect(normalizeLanguage('fre')).toBe('fr');
    expect(normalizeLanguage('eng')).toBe('en');
    expect(normalizeLanguage('fr')).toBe('fr');
    expect(normalizeLanguage('xxx')).toBeNull();
    expect(normalizeLanguage(undefined)).toBeNull();
  });
});

describe('parseGoogleBooks', () => {
  const fixture = {
    totalItems: 1,
    items: [
      {
        volumeInfo: {
          title: "L'Étranger",
          authors: ['Albert Camus'],
          publisher: 'Gallimard',
          publishedDate: '1942',
          pageCount: 159,
          language: 'fr',
          categories: ['Fiction'],
          description: 'Aujourd’hui, maman est morte.',
          imageLinks: {
            smallThumbnail: 'http://books.google.com/books/content?id=A&img=1&zoom=5&edge=curl',
            thumbnail: 'http://books.google.com/books/content?id=A&img=1&zoom=1&edge=curl',
          },
          industryIdentifiers: [{ type: 'ISBN_13', identifier: '9782070360024' }],
        },
      },
    ],
  };

  it('maps volumeInfo onto the common schema', () => {
    expect(parseGoogleBooks(fixture)).toEqual({
      title: "L'Étranger",
      subtitle: null,
      authors: ['Albert Camus'],
      publisher: 'Gallimard',
      publishedDate: '1942',
      pageCount: 159,
      language: 'fr',
      coverUrl: 'https://books.google.com/books/content?id=A&img=1&zoom=1',
      description: 'Aujourd’hui, maman est morte.',
      genres: ['Fiction'],
    });
  });

  it('returns null when there are no results', () => {
    expect(parseGoogleBooks({ totalItems: 0, items: [] })).toBeNull();
    expect(parseGoogleBooks({})).toBeNull();
  });
});

describe('parseOpenLibrary', () => {
  const isbn13 = '9782070360024';
  const fixture = {
    [`ISBN:${isbn13}`]: {
      url: 'https://openlibrary.org/books/OL123M/Letranger',
      key: '/books/OL123M',
      title: "L'étranger",
      authors: [{ url: 'https://openlibrary.org/authors/OL1A', name: 'Albert Camus' }],
      number_of_pages: 159,
      identifiers: { isbn_13: [isbn13], openlibrary: ['OL123M'] },
      publishers: [{ name: 'Gallimard' }],
      publish_date: '1972',
      subjects: [{ name: 'Fiction', url: 'https://openlibrary.org/subjects/fiction' }],
    },
  };

  it('maps an Open Library data entry onto the common schema', () => {
    expect(parseOpenLibrary(fixture, isbn13)).toEqual({
      title: "L'étranger",
      subtitle: null,
      authors: ['Albert Camus'],
      publisher: 'Gallimard',
      publishedDate: '1972',
      pageCount: 159,
      language: null,
      coverUrl: `https://covers.openlibrary.org/b/isbn/${isbn13}-L.jpg`,
      description: null,
      genres: ['Fiction'],
    });
  });

  it('prefers an explicit cover when present', () => {
    const withCover = {
      [`ISBN:${isbn13}`]: {
        ...fixture[`ISBN:${isbn13}`],
        cover: { large: 'https://covers.openlibrary.org/b/id/42-L.jpg' },
      },
    };
    expect(parseOpenLibrary(withCover, isbn13)?.coverUrl).toBe(
      'https://covers.openlibrary.org/b/id/42-L.jpg',
    );
  });

  it('returns null when the ISBN key is absent', () => {
    expect(parseOpenLibrary({}, isbn13)).toBeNull();
  });
});

describe('cleanBnfCreator', () => {
  it('rewrites "Last, First (dates). Role" as "First Last"', () => {
    expect(cleanBnfCreator('Camus, Albert (1913-1960). Auteur du texte')).toBe('Albert Camus');
    expect(cleanBnfCreator('Tournier, Michel (1924-2016)')).toBe('Michel Tournier');
    expect(cleanBnfCreator('Collectif')).toBe('Collectif');
  });
});

describe('parseBnfDublinCore', () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<srw:searchRetrieveResponse xmlns:srw="http://www.loc.gov/zing/srw/">
  <srw:numberOfRecords>1</srw:numberOfRecords>
  <srw:records>
    <srw:record>
      <srw:recordData>
        <oai_dc:dc xmlns:oai_dc="http://www.openarchives.org/OAI/2.0/oai_dc/" xmlns:dc="http://purl.org/dc/elements/1.1/">
          <dc:title>L'Étranger / Albert Camus</dc:title>
          <dc:creator>Camus, Albert (1913-1960). Auteur du texte</dc:creator>
          <dc:publisher>Gallimard (Paris)</dc:publisher>
          <dc:date>1971</dc:date>
          <dc:language>fre</dc:language>
          <dc:description>Collection : Folio ; 2</dc:description>
          <dc:format>191 p. : couv. ill. en coul. ; 18 cm</dc:format>
          <dc:type>texte imprimé</dc:type>
          <dc:identifier>ISBN 2070360024</dc:identifier>
        </oai_dc:dc>
      </srw:recordData>
    </srw:record>
  </srw:records>
</srw:searchRetrieveResponse>`;

  it('extracts and cleans Dublin Core fields', () => {
    expect(parseBnfDublinCore(xml)).toEqual({
      title: "L'Étranger",
      subtitle: null,
      authors: ['Albert Camus'],
      publisher: 'Gallimard',
      publishedDate: '1971',
      pageCount: 191,
      language: 'fr',
      coverUrl: null,
      description: 'Collection : Folio ; 2',
      genres: null,
    });
  });

  it('splits a "Title : subtitle / author" title', () => {
    const xml2 = xml.replace(
      "<dc:title>L'Étranger / Albert Camus</dc:title>",
      '<dc:title>Les Villes invisibles : roman / Italo Calvino</dc:title>',
    );
    const parsed = parseBnfDublinCore(xml2);
    expect(parsed?.title).toBe('Les Villes invisibles');
    expect(parsed?.subtitle).toBe('roman');
  });

  it('returns null when there are no records', () => {
    const empty = `<srw:searchRetrieveResponse xmlns:srw="http://www.loc.gov/zing/srw/">
      <srw:numberOfRecords>0</srw:numberOfRecords><srw:records/></srw:searchRetrieveResponse>`;
    expect(parseBnfDublinCore(empty)).toBeNull();
  });
});

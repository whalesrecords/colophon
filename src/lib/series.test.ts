import { parseSeries, seriesKey } from './series';

describe('parseSeries', () => {
  it('detects common French BD/manga volume markers', () => {
    expect(parseSeries('One Piece - Tome 3')).toEqual({ name: 'One Piece', volume: 3 });
    expect(parseSeries('Naruto, tome 5')).toEqual({ name: 'Naruto', volume: 5 });
    expect(parseSeries('Berserk Vol. 12')).toEqual({ name: 'Berserk', volume: 12 });
    expect(parseSeries('Lastman, T1')).toEqual({ name: 'Lastman', volume: 1 });
    expect(parseSeries('Astérix - Tome 1 - Astérix le Gaulois')).toEqual({
      name: 'Astérix',
      volume: 1,
    });
  });

  it('reads the volume from the subtitle, name from the title', () => {
    expect(parseSeries('Naruto', 'Tome 5')).toEqual({ name: 'Naruto', volume: 5 });
  });

  it('returns null for standalone books', () => {
    expect(parseSeries("L'Étranger")).toBeNull();
    expect(parseSeries('Cosmos 1999')).toBeNull(); // no marker (1999 > 300 anyway)
    expect(parseSeries('T 34')).toBeNull(); // no series name before the marker
    expect(parseSeries('')).toBeNull();
  });

  it('keys series names case/accent/punct-insensitively', () => {
    expect(seriesKey('Les Légendaires')).toBe(seriesKey('les legendaires'));
    expect(seriesKey('One Piece')).toBe('one piece');
  });
});

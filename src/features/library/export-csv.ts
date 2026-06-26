import { Platform, Share } from 'react-native';

import { OWNERSHIP_LABELS, STATUS_LABELS } from '@/theme/tokens';

import type { LibraryItem } from './use-library';

function cell(value: string | number | null | undefined): string {
  const s = value == null ? '' : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const HEADERS = [
  'Titre',
  'Auteurs',
  'ISBN13',
  'Éditeur',
  'Année',
  'Langue',
  'Statut',
  'Possession',
  'Note',
  'Étagères',
  'Tags',
  'Prêté à',
  'Ajouté le',
];

/** Build a UTF-8 CSV of the whole library (one row per book). Pure + testable. */
export function toLibraryCsv(items: LibraryItem[]): string {
  const rows = items.map((i) =>
    [
      cell(i.book?.title),
      cell((i.book?.authors ?? []).join('; ')),
      cell(i.book?.isbn13),
      cell(i.book?.publisher),
      cell(i.book?.published_date),
      cell(i.book?.language),
      cell(STATUS_LABELS[i.status] ?? i.status),
      cell(OWNERSHIP_LABELS[i.ownership] ?? i.ownership),
      cell(i.rating),
      cell(i.shelfNames.join('; ')),
      cell(i.tagNames.join('; ')),
      cell(i.lentTo),
      cell(i.added_at?.slice(0, 10)),
    ].join(','),
  );
  return [HEADERS.join(','), ...rows].join('\n');
}

/** Download/share the CSV: a file on web, the native share sheet otherwise. */
export function downloadCsv(filename: string, csv: string): void {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  } else {
    Share.share({ message: csv, title: filename }).catch(() => undefined);
  }
}

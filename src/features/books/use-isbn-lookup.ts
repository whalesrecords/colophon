import { useMutation } from '@tanstack/react-query';

import type { Database } from '@/lib/database.types';
import { type IsbnError, normalizeIsbn } from '@/lib/isbn';
import { supabase } from '@/lib/supabase';

export type BookMetadata = Database['public']['Tables']['book_metadata']['Row'];

function isbnErrorMessage(error: IsbnError): string {
  switch (error) {
    case 'empty':
      return 'Saisissez un ISBN.';
    case 'bad_length':
      return 'Un ISBN fait 10 ou 13 chiffres.';
    case 'bad_characters':
      return 'Cet ISBN contient des caractères invalides.';
    case 'bad_check_digit':
      return 'Clé de contrôle invalide — vérifiez la saisie.';
    case 'bad_prefix':
      return 'Préfixe invalide (un ISBN-13 commence par 978 ou 979).';
  }
}

/**
 * Normalize an ISBN, call the isbn-lookup edge function (Google Books ->
 * Open Library -> BnF cascade, cached in book_metadata), and return the book.
 */
export function useIsbnLookup() {
  return useMutation({
    mutationFn: async (rawIsbn: string): Promise<BookMetadata> => {
      const norm = normalizeIsbn(rawIsbn);
      if (!norm.ok) throw new Error(isbnErrorMessage(norm.error));

      const { data, error } = await supabase.functions.invoke('isbn-lookup', {
        body: { isbn: norm.isbn13 },
      });
      if (error) throw new Error('Recherche impossible. Vérifiez votre connexion.');
      const book = (data as { book?: BookMetadata } | null)?.book;
      if (!book) throw new Error('Aucun livre trouvé pour cet ISBN.');
      return book;
    },
  });
}

import { useState } from 'react';
import { Pressable, ScrollView } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';

import { BookCover } from '@/components/BookCover';
import type { BookSearchResult } from '@/lib/book-search-parsers';
import { useAddItem } from '@/features/library/use-add-item';
import { useRecommendations } from '@/features/library/use-recommendations';
import { useIsbnLookup } from '@/features/books/use-isbn-lookup';
import { palette } from '@/theme/tokens';

/**
 * "Dans ton style" row at the bottom of the home: up to 5 books to discover,
 * based on the reader's most-owned authors. Tapping one adds it to Envies
 * (looks up the metadata first, since useAddItem needs the book_metadata row).
 */
export function RecommendationsShelf({ userId }: { userId: string | undefined }) {
  const { data: recs } = useRecommendations(userId);
  const lookup = useIsbnLookup();
  const add = useAddItem(userId);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);

  if (!userId || !recs || recs.length === 0) return null;

  const onAdd = async (b: BookSearchResult) => {
    if (added.has(b.isbn13) || busy) return;
    setBusy(b.isbn13);
    try {
      await lookup.mutateAsync(b.isbn13);
      await add.mutateAsync({ isbn13: b.isbn13, ownership: 'wishlist' });
      setAdded((s) => new Set(s).add(b.isbn13));
    } catch {
      // ignore — leave the card tappable to retry
    } finally {
      setBusy(null);
    }
  };

  return (
    <YStack gap="$2">
      <Text fontFamily="$heading" fontSize={20} fontWeight="500" color="$color">
        Dans ton style
      </Text>
      <Text fontFamily="$body" fontSize={13} color="$colorMuted" marginTop={-2}>
        À découvrir, d'après tes auteurs — touche pour l'ajouter à tes envies.
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <XStack gap="$3" paddingRight="$4" paddingVertical="$1">
          {recs.map((b) => {
            const isAdded = added.has(b.isbn13);
            const isBusy = busy === b.isbn13;
            return (
              <Pressable key={b.isbn13} onPress={() => onAdd(b)} disabled={isAdded}>
                <YStack width={104} gap="$1">
                  <BookCover
                    title={b.title ?? ''}
                    author={b.authors?.[0]}
                    coverUrl={b.coverUrl}
                    isbn={b.isbn13}
                    width={104}
                  />
                  <Text fontFamily="$body" fontSize={12} color="$colorSoft" numberOfLines={1}>
                    {b.title ?? 'Sans titre'}
                  </Text>
                  {b.authors?.[0] ? (
                    <Text fontFamily="$body" fontSize={11} color="$colorMuted" numberOfLines={1}>
                      {b.authors[0]}
                    </Text>
                  ) : null}
                  <Text
                    fontFamily="$body"
                    fontSize={12}
                    fontWeight="700"
                    color={isAdded ? palette.forest : palette.brick}
                  >
                    {isAdded ? 'Ajouté ✓' : isBusy ? '…' : '+ Envies'}
                  </Text>
                </YStack>
              </Pressable>
            );
          })}
        </XStack>
      </ScrollView>
    </YStack>
  );
}

import { useRouter } from 'expo-router';
import { Pressable, ScrollView } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';

import { BookCover } from '@/components/BookCover';
import { useReaderTaste } from '@/features/library/use-reader-taste';

/**
 * "Dans ton style" row at the bottom of the home: books to discover (not owned), in
 * the same vein as the reader's library — computed semantically by Claude
 * (reader-taste), one per series, varied universes, French editions. Tapping one opens
 * a preview (/discover/[isbn]) with the résumé up top + add actions.
 */
export function RecommendationsShelf({ userId }: { userId: string | undefined }) {
  const router = useRouter();
  const { data, isLoading } = useReaderTaste(userId);
  const recs = data?.recommendations ?? [];

  if (!userId) return null;
  if (recs.length === 0) {
    if (isLoading) {
      return (
        <YStack gap="$2">
          <Text fontFamily="$heading" fontSize={20} fontWeight="500" color="$color">
            Dans ton style
          </Text>
          <Text fontFamily="$body" fontSize={13} color="$colorMuted">
            Je prépare tes recommandations…
          </Text>
        </YStack>
      );
    }
    return null;
  }

  return (
    <YStack gap="$2">
      <Text fontFamily="$heading" fontSize={20} fontWeight="500" color="$color">
        Dans ton style
      </Text>
      <Text fontFamily="$body" fontSize={13} color="$colorMuted" marginTop={-2}>
        Choisis pour toi, dans la veine de ta bibliothèque — touche pour le résumé.
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <XStack gap="$3" paddingRight="$4" paddingVertical="$1">
          {recs.map((b) => (
            <Pressable key={b.isbn13} onPress={() => router.push(`/discover/${b.isbn13}`)}>
              <YStack width={112} gap="$1">
                <BookCover
                  title={b.title}
                  author={b.author}
                  coverUrl={b.cover_url}
                  isbn={b.isbn13}
                  width={112}
                />
                <Text fontFamily="$body" fontSize={12} color="$colorSoft" numberOfLines={1}>
                  {b.title}
                </Text>
                {b.universe ? (
                  <Text fontFamily="$body" fontSize={11} color="$colorMuted" numberOfLines={1}>
                    {b.universe}
                  </Text>
                ) : null}
              </YStack>
            </Pressable>
          ))}
        </XStack>
      </ScrollView>
    </YStack>
  );
}

import { useRouter } from 'expo-router';
import { Pressable, ScrollView } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';

import { BookCover } from '@/components/BookCover';
import { useRecommendations } from '@/features/library/use-recommendations';

/**
 * "Dans ton style" row at the bottom of the home: up to 5 books to discover (not
 * owned), in the same vein as the reader's library. Tapping one opens a preview
 * (/discover/[isbn]) with the résumé up top + add actions.
 */
export function RecommendationsShelf({ userId }: { userId: string | undefined }) {
  const router = useRouter();
  const { data: recs } = useRecommendations(userId);

  if (!userId || !recs || recs.length === 0) return null;

  return (
    <YStack gap="$2">
      <Text fontFamily="$heading" fontSize={20} fontWeight="500" color="$color">
        Dans ton style
      </Text>
      <Text fontFamily="$body" fontSize={13} color="$colorMuted" marginTop={-2}>
        À découvrir, dans la veine de ta bibliothèque — touche pour voir le résumé.
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <XStack gap="$3" paddingRight="$4" paddingVertical="$1">
          {recs.map((b) => (
            <Pressable key={b.isbn13} onPress={() => router.push(`/discover/${b.isbn13}`)}>
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
              </YStack>
            </Pressable>
          ))}
        </XStack>
      </ScrollView>
    </YStack>
  );
}

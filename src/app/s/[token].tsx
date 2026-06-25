import { useLocalSearchParams } from 'expo-router';
import { ScrollView, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Spinner, Text, XStack, YStack } from 'tamagui';

import { BookCover } from '@/components/BookCover';
import { useSharedLibrary } from '@/features/sharing/use-shared-library';
import { composedPalette } from '@/theme/cover-palettes';

const H_PADDING = 20;
const GAP = 16;

function columnsFor(width: number): number {
  if (width >= 1100) return 6;
  if (width >= 760) return 4;
  return 3;
}

export default function SharedScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { data, isLoading, error } = useSharedLibrary(token);

  const contentWidth = Math.min(width, 1200) - H_PADDING * 2;
  const cols = columnsFor(width);
  const coverWidth = Math.floor((contentWidth - GAP * (cols - 1)) / cols);

  return (
    <YStack flex={1} backgroundColor="$background" paddingTop={insets.top}>
      <YStack paddingHorizontal={H_PADDING} paddingTop="$5" paddingBottom="$3" gap="$1">
        <Text fontFamily="$heading" fontSize={28} fontWeight="500" color="$color">
          Colophon
        </Text>
        {data ? (
          <Text fontFamily="$body" fontSize={13} color="$colorMuted">
            {(data.scope === 'shelf' && data.shelfName
              ? `Étagère « ${data.shelfName} »`
              : 'Bibliothèque partagée') + ` · ${data.count} livre${data.count > 1 ? 's' : ''}`}
          </Text>
        ) : null}
      </YStack>

      {isLoading ? (
        <YStack flex={1} alignItems="center" justifyContent="center">
          <Spinner color="$accent" size="large" />
        </YStack>
      ) : error || !data ? (
        <YStack flex={1} alignItems="center" justifyContent="center" paddingHorizontal="$8">
          <Text fontFamily="$body" color="$colorMuted" textAlign="center">
            Ce lien de partage est invalide ou a expiré.
          </Text>
        </YStack>
      ) : data.items.length === 0 ? (
        <YStack flex={1} alignItems="center" justifyContent="center" paddingHorizontal="$8">
          <Text fontFamily="$body" color="$colorMuted" textAlign="center">
            Cette bibliothèque est vide pour le moment.
          </Text>
        </YStack>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: H_PADDING, paddingBottom: insets.bottom + 40 }}>
          <XStack flexWrap="wrap" gap={GAP}>
            {data.items.map((item, i) => {
              const seed = item.book?.isbn13 ?? String(i);
              const { bg, fg } = composedPalette(seed);
              return (
                <YStack key={seed} width={coverWidth} gap="$2">
                  <BookCover
                    title={item.book?.title ?? 'Sans titre'}
                    author={item.book?.authors?.[0]}
                    coverUrl={item.book?.cover_url}
                    isbn={item.book?.isbn13}
                    bg={bg}
                    fg={fg}
                    width={coverWidth}
                  />
                  <YStack gap={2}>
                    <Text fontFamily="$heading" fontSize={13} color="$color" numberOfLines={1}>
                      {item.book?.title ?? 'Sans titre'}
                    </Text>
                    {item.book?.authors?.[0] ? (
                      <Text fontFamily="$body" fontSize={12} color="$colorMuted" numberOfLines={1}>
                        {item.book.authors[0]}
                      </Text>
                    ) : null}
                  </YStack>
                </YStack>
              );
            })}
          </XStack>
        </ScrollView>
      )}
    </YStack>
  );
}

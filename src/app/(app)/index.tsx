import { Link } from 'expo-router';
import { ScrollView, useWindowDimensions } from 'react-native';
import { Button, Spinner, Text, XStack, YStack } from 'tamagui';

import { BookCover } from '@/components/BookCover';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/features/auth/auth-context';
import { useLibrary, type LibraryItem } from '@/features/library/use-library';
import { composedPalette } from '@/theme/cover-palettes';
import { palette } from '@/theme/tokens';

const H_PADDING = 20;
const GAP = 16;

function columnsFor(width: number): number {
  if (width >= 1100) return 6;
  if (width >= 760) return 4;
  return 3;
}

export default function LibraryScreen() {
  const { session } = useAuth();
  const { width } = useWindowDimensions();
  const { data: items, isLoading, error } = useLibrary(session?.user.id);

  const contentWidth = Math.min(width, 1200) - H_PADDING * 2;
  const cols = columnsFor(width);
  const coverWidth = Math.floor((contentWidth - GAP * (cols - 1)) / cols);

  return (
    <Screen>
      <YStack paddingHorizontal={H_PADDING} paddingTop="$4" paddingBottom="$2" gap="$1">
        <Text
          fontFamily="$body"
          fontSize={11}
          fontWeight="600"
          letterSpacing={2.4}
          textTransform="uppercase"
          color="$colorMuted"
        >
          Ma bibliothèque
        </Text>
        <XStack alignItems="flex-end" justifyContent="space-between">
          <Text fontFamily="$heading" fontSize={33} fontWeight="500" color="$color">
            Bibliothèque
          </Text>
          {items && items.length > 0 ? (
            <Text fontFamily="$body" fontSize={13} color="$colorMuted" marginBottom={6}>
              {items.length} {items.length > 1 ? 'livres' : 'livre'}
            </Text>
          ) : null}
        </XStack>
      </YStack>

      {isLoading ? (
        <YStack flex={1} alignItems="center" justifyContent="center">
          <Spinner color="$accent" size="large" />
        </YStack>
      ) : error ? (
        <YStack flex={1} alignItems="center" justifyContent="center" paddingHorizontal="$8">
          <Text color="$signal" fontFamily="$body" textAlign="center">
            Impossible de charger la bibliothèque. Vérifiez votre connexion.
          </Text>
        </YStack>
      ) : !items || items.length === 0 ? (
        <EmptyLibrary coverWidth={Math.min(coverWidth, 110)} />
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: H_PADDING, paddingBottom: 32 }}>
          <XStack flexWrap="wrap" gap={GAP}>
            {items.map((item) => (
              <LibraryCard key={item.id} item={item} width={coverWidth} />
            ))}
          </XStack>
        </ScrollView>
      )}
    </Screen>
  );
}

function LibraryCard({ item, width }: { item: LibraryItem; width: number }) {
  const isbn = item.book?.isbn13 ?? item.id;
  const { bg, fg } = composedPalette(isbn);
  return (
    <YStack width={width} gap="$2">
      <BookCover
        title={item.book?.title ?? 'Sans titre'}
        author={item.book?.authors?.[0]}
        coverUrl={item.book?.cover_url}
        bg={bg}
        fg={fg}
        width={width}
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
}

function EmptyLibrary({ coverWidth }: { coverWidth: number }) {
  const demo = [
    { title: "Éloge de l'ombre", author: 'Tanizaki', seed: 'a' },
    { title: 'Les Villes invisibles', author: 'Calvino', seed: 'bb' },
    { title: "L'Usage du monde", author: 'Bouvier', seed: 'ccc' },
  ];
  return (
    <YStack flex={1} alignItems="center" justifyContent="center" gap="$6" paddingHorizontal="$6">
      <XStack gap={12} opacity={0.45}>
        {demo.map((d) => {
          const { bg, fg } = composedPalette(d.seed);
          return (
            <BookCover
              key={d.seed}
              title={d.title}
              author={d.author}
              bg={bg}
              fg={fg}
              width={coverWidth}
            />
          );
        })}
      </XStack>
      <YStack alignItems="center" gap="$2" maxWidth={320}>
        <Text
          fontFamily="$heading"
          fontSize={24}
          fontWeight="500"
          color="$color"
          textAlign="center"
        >
          Votre bibliothèque vous attend
        </Text>
        <Text
          fontFamily="$body"
          fontSize={15}
          color="$colorMuted"
          textAlign="center"
          lineHeight={22}
        >
          Scannez le code-barres d'un livre pour l'ajouter. Ses informations sont récupérées
          automatiquement.
        </Text>
      </YStack>
      <Link href="/scan" asChild>
        <Button
          backgroundColor="$accent"
          color={palette.paper}
          borderRadius={2}
          height={50}
          paddingHorizontal="$6"
          fontFamily="$body"
          fontWeight="600"
          pressStyle={{ opacity: 0.9, backgroundColor: '$accentDeep' }}
        >
          Scanner un livre
        </Button>
      </Link>
    </YStack>
  );
}

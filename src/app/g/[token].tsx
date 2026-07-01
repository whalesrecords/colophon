import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, Platform, Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Spinner, Text, XStack, YStack } from 'tamagui';

import { BookCover } from '@/components/BookCover';
import { Icon, PackIcon } from '@/components/icons';
import { getCurrentLocation } from '@/features/places/use-book-boxes';
import { useClaimGift, useGiftList, type GiftBook } from '@/features/sharing/use-gift-list';
import { bookshopUrl, indieBookshopsNearUrl } from '@/lib/bookshop';
import { palette } from '@/theme/tokens';

const H_PADDING = 20;
const GAP = 16;

function columnsFor(width: number): number {
  if (width >= 1100) return 5;
  if (width >= 760) return 4;
  if (width >= 480) return 3;
  return 2;
}

/** Confirm before an irreversible action (claiming = reserving for everyone) —
 *  UX guide §8. web → window.confirm, native → Alert. */
function confirmAsync(message: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(typeof window !== 'undefined' && window.confirm(message));
  }
  return new Promise((resolve) => {
    Alert.alert('Confirmer', message, [
      { text: 'Annuler', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Je l’offre', onPress: () => resolve(true) },
    ]);
  });
}

function GiftCard({
  book,
  width,
  onClaim,
}: {
  book: GiftBook;
  width: number;
  onClaim: (b: GiftBook) => void;
}) {
  const author = book.authors?.[0] ?? null;
  return (
    <YStack width={width} gap="$2">
      <YStack opacity={book.claimed ? 0.5 : 1}>
        <BookCover
          title={book.title ?? ''}
          coverUrl={book.cover_url}
          isbn={book.isbn13}
          width={width}
        />
      </YStack>
      <YStack gap={1}>
        <Text fontFamily="$heading" fontSize={14} fontWeight="600" color="$color" numberOfLines={2}>
          {book.title}
        </Text>
        {author ? (
          <Text fontFamily="$body" fontSize={12} color="$colorMuted" numberOfLines={1}>
            {author}
          </Text>
        ) : null}
      </YStack>
      {book.claimed ? (
        <XStack alignItems="center" gap={5} height={44}>
          <Icon name="check" size={16} color={palette.forest} />
          <Text fontFamily="$body" fontSize={13.5} fontWeight="600" color={palette.forest}>
            Déjà réservé
          </Text>
        </XStack>
      ) : (
        <Pressable onPress={() => onClaim(book)} accessibilityRole="button">
          <XStack
            height={44}
            borderRadius={999}
            backgroundColor="$accent"
            alignItems="center"
            justifyContent="center"
            paddingHorizontal="$3"
            pressStyle={{ opacity: 0.85 }}
          >
            <Text fontFamily="$body" fontSize={13.5} fontWeight="600" color={palette.paper}>
              Je l’offre
            </Text>
          </XStack>
        </Pressable>
      )}
    </YStack>
  );
}

/** Public gift-list page — a reader's Envies shared as a wedding-registry-style list.
 *  "Je l'offre" reserves the book (anti-double-gift, surprise-preserving) and opens an
 *  indie bookshop (leslibraires — never Amazon). No account needed. */
export default function GiftScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { data, isLoading, error } = useGiftList(token);
  const claim = useClaimGift(token);

  const contentWidth = Math.min(width, 1200) - H_PADDING * 2;
  const cols = columnsFor(width);
  const coverWidth = Math.floor((contentWidth - GAP * (cols - 1)) / cols);

  const [locating, setLocating] = useState(false);
  const findNearby = async () => {
    setLocating(true);
    try {
      const loc = await getCurrentLocation();
      await Linking.openURL(indieBookshopsNearUrl(loc));
    } finally {
      setLocating(false);
    }
  };

  const onClaim = async (book: GiftBook) => {
    const ok = await confirmAsync(
      `Tu offres « ${book.title} » ?\n\nIl passera en « réservé » pour les autres (surprise préservée), et on t’emmène chez un libraire indépendant.`,
    );
    if (!ok) return;
    try {
      const claimed = await claim.mutateAsync(book.isbn13);
      if (!claimed) {
        // Someone reserved it a moment ago.
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.alert('Ce livre vient d’être réservé par quelqu’un d’autre.');
        }
        return;
      }
      await Linking.openURL(bookshopUrl(book.isbn13, book.title, book.authors?.[0]));
    } catch {
      // best-effort
    }
  };

  return (
    <YStack flex={1} backgroundColor="$background" paddingTop={insets.top}>
      <YStack paddingHorizontal={H_PADDING} paddingTop="$5" paddingBottom="$3" gap="$1">
        <Text
          fontFamily="$body"
          fontSize={11}
          fontWeight="700"
          letterSpacing={2}
          textTransform="uppercase"
          color="$colorMuted"
        >
          Liste de cadeaux · Colophon
        </Text>
        <Text fontFamily="$heading" fontSize={28} fontWeight="500" color="$color">
          {data?.owner ? `Les envies de ${data.owner}` : 'Liste d’envies'}
        </Text>
        <Text fontFamily="$body" fontSize={14} color="$colorSoft" lineHeight={20}>
          Offre-lui un livre — chez un libraire indépendant, jamais Amazon. Ce que tu réserves passe
          en « réservé » pour les autres, sans gâcher la surprise.
        </Text>
        <XStack marginTop="$3" alignItems="center" gap="$3" flexWrap="wrap">
          <Button
            onPress={findNearby}
            disabled={locating}
            height={44}
            paddingHorizontal="$4"
            borderRadius={999}
            backgroundColor="$backgroundStrong"
            borderColor="$accent"
            borderWidth={1}
            color="$accent"
            fontFamily="$body"
            fontWeight="600"
            fontSize={14}
            pressStyle={{ opacity: 0.85 }}
            gap="$2"
          >
            <PackIcon name="location" size={16} color={palette.aizome} />
            {locating ? 'Localisation…' : 'Trouver une librairie près de toi'}
          </Button>
          {/* Loi Lang: new-book prices are fixed nationwide, so the value is the local
              shop, not price-hunting. leslibraires lets the buyer pick it at checkout. */}
          <Text fontFamily="$body" fontSize={12.5} color="$colorMuted" flex={1} minWidth={180}>
            Prix du neuf fixe partout — tu choisis ta librairie au moment de commander.
          </Text>
        </XStack>
      </YStack>

      {isLoading ? (
        <YStack flex={1} alignItems="center" justifyContent="center">
          <Spinner color="$accent" size="large" />
        </YStack>
      ) : error || !data ? (
        <YStack flex={1} alignItems="center" justifyContent="center" paddingHorizontal="$8">
          <Text fontFamily="$body" color="$colorMuted" textAlign="center">
            Liste introuvable ou lien expiré.
          </Text>
        </YStack>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: H_PADDING, paddingBottom: 48 }}>
          <XStack flexWrap="wrap" gap={GAP}>
            {data.books.map((b) => (
              <GiftCard key={b.isbn13} book={b} width={coverWidth} onClaim={onClaim} />
            ))}
          </XStack>
        </ScrollView>
      )}
    </YStack>
  );
}

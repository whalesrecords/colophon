import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Spinner, Text, XStack, YStack } from 'tamagui';

import { BookCover } from '@/components/BookCover';
import { type BookMetadata, useIsbnLookup } from '@/features/books/use-isbn-lookup';
import { useAuth } from '@/features/auth/auth-context';
import { useAddItem } from '@/features/library/use-add-item';
import { useCommunityRating, useReaderTaste } from '@/features/library/use-reader-taste';
import { composedPalette } from '@/theme/cover-palettes';
import {
  OWNERSHIP_LABELS,
  OWNERSHIP_ORDER,
  type Ownership,
  palette,
  type ReadingStatus,
  STATUS_LABELS,
  STATUS_ORDER,
  statusColors,
} from '@/theme/tokens';

function Label({ children }: { children: string }) {
  return (
    <Text
      fontFamily="$body"
      fontSize={11}
      fontWeight="700"
      letterSpacing={1.8}
      textTransform="uppercase"
      color="$colorMuted"
    >
      {children}
    </Text>
  );
}

/** Preview of a not-yet-owned book (from "Dans ton style"): cover, résumé up top,
 *  genres, and one-tap add (Je le possède / Je le veux / Emprunté + status). */
export default function DiscoverScreen() {
  const { isbn } = useLocalSearchParams<{ isbn: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const lookup = useIsbnLookup();
  const add = useAddItem(session?.user.id);
  const { data: taste } = useReaderTaste(session?.user.id);
  const rec = taste?.recommendations.find((r) => r.isbn13 === isbn);
  const { data: community } = useCommunityRating(isbn);
  const [book, setBook] = useState<BookMetadata | null>(null);
  const [failed, setFailed] = useState(false);
  const [status, setStatus] = useState<ReadingStatus>('to_read');
  const [addedAs, setAddedAs] = useState<Ownership | null>(null);

  useEffect(() => {
    if (!isbn) return;
    let alive = true;
    lookup
      .mutateAsync(isbn)
      .then((b) => alive && setBook(b))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isbn]);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const onAdd = async (ownership: Ownership) => {
    if (!book || add.isPending) return;
    try {
      await add.mutateAsync({ isbn13: book.isbn13, ownership, status });
      setAddedAs(ownership);
    } catch {
      // ignore — leave the buttons tappable to retry
    }
  };

  const { bg, fg } = composedPalette(isbn ?? '');
  const meta = book
    ? [book.authors?.[0], book.publisher, book.published_date?.slice(0, 4)]
        .filter(Boolean)
        .join(' · ')
    : '';

  return (
    <YStack flex={1} backgroundColor="$background">
      <XStack paddingTop={insets.top + 8} paddingBottom="$2" paddingHorizontal="$4">
        <Text
          onPress={goBack}
          fontFamily="$body"
          fontSize={15}
          color="$accent"
          fontWeight="600"
          paddingVertical="$2"
          pressStyle={{ opacity: 0.6 }}
        >
          ‹ Retour
        </Text>
      </XStack>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}>
        {!book && !failed ? (
          <YStack alignItems="center" paddingVertical="$8">
            <Spinner color="$accent" size="large" />
          </YStack>
        ) : failed || !book ? (
          <Text fontFamily="$body" fontSize={14} color="$colorMuted" textAlign="center">
            Impossible de charger ce livre.
          </Text>
        ) : (
          <YStack gap="$5">
            <YStack alignItems="center" gap="$3">
              <BookCover
                title={book.title ?? ''}
                author={book.authors?.[0]}
                coverUrl={book.cover_url}
                isbn={book.isbn13}
                bg={bg}
                fg={fg}
                width={140}
              />
              <YStack alignItems="center" gap="$1">
                <Text
                  fontFamily="$heading"
                  fontSize={24}
                  fontWeight="500"
                  color="$color"
                  textAlign="center"
                >
                  {book.title ?? 'Sans titre'}
                </Text>
                {meta ? (
                  <Text fontFamily="$body" fontSize={14} color="$colorMuted" textAlign="center">
                    {meta}
                  </Text>
                ) : null}
              </YStack>
            </YStack>

            {rec?.match || (community && community.count > 0) ? (
              <XStack gap="$2" justifyContent="center" flexWrap="wrap">
                {rec?.match ? (
                  <XStack
                    backgroundColor={palette.ink}
                    borderRadius={999}
                    paddingHorizontal="$3"
                    paddingVertical="$2"
                  >
                    <Text fontFamily="$body" fontSize={13} fontWeight="700" color={palette.paper}>
                      {rec.match}% pour toi
                    </Text>
                  </XStack>
                ) : null}
                {community && community.count > 0 ? (
                  <XStack
                    alignItems="center"
                    gap="$1.5"
                    backgroundColor="$backgroundStrong"
                    borderColor="$borderColor"
                    borderWidth={1}
                    borderRadius={999}
                    paddingHorizontal="$3"
                    paddingVertical="$2"
                  >
                    <Text fontFamily="$body" fontSize={13} fontWeight="700" color={palette.gold}>
                      ★ {community.avg}
                    </Text>
                    <Text fontFamily="$body" fontSize={12} color="$colorMuted">
                      · {community.count} lecteur{community.count > 1 ? 's' : ''}
                    </Text>
                  </XStack>
                ) : null}
              </XStack>
            ) : null}

            {rec?.why ? (
              <Text
                fontFamily="$body"
                fontSize={13.5}
                fontStyle="italic"
                color="$colorSoft"
                textAlign="center"
                lineHeight={20}
              >
                « {rec.why} »
              </Text>
            ) : null}

            {rec?.related?.length ? (
              <YStack gap="$2">
                <Label>En lien avec tes lectures</Label>
                <XStack flexWrap="wrap" gap="$2">
                  {rec.related.map((t) => (
                    <XStack
                      key={t}
                      paddingHorizontal="$3"
                      paddingVertical="$2"
                      borderRadius={999}
                      backgroundColor="$backgroundStrong"
                      borderWidth={1}
                      borderColor="$borderColor"
                    >
                      <Text fontFamily="$body" fontSize={13} color="$color">
                        {t}
                      </Text>
                    </XStack>
                  ))}
                </XStack>
              </YStack>
            ) : null}

            {book.description ? (
              <YStack gap="$2">
                <Label>Résumé</Label>
                <Text fontFamily="$body" fontSize={14.5} color="$colorSoft" lineHeight={22}>
                  {book.description}
                </Text>
              </YStack>
            ) : null}

            {book.genres?.length ? (
              <XStack flexWrap="wrap" gap="$2">
                {book.genres.slice(0, 6).map((g) => (
                  <XStack
                    key={g}
                    paddingHorizontal="$3"
                    paddingVertical="$2"
                    borderRadius={999}
                    backgroundColor="$backgroundStrong"
                    borderWidth={1}
                    borderColor="$borderColor"
                  >
                    <Text fontFamily="$body" fontSize={13} color="$color">
                      {g}
                    </Text>
                  </XStack>
                ))}
              </XStack>
            ) : null}

            {addedAs ? (
              <YStack
                backgroundColor="$backgroundStrong"
                borderColor={palette.forest}
                borderWidth={1}
                borderRadius={12}
                padding="$4"
                alignItems="center"
                gap="$1"
              >
                <Text fontFamily="$body" fontSize={15} fontWeight="700" color={palette.forest}>
                  Ajouté ✓ — {OWNERSHIP_LABELS[addedAs]}
                </Text>
                <Text
                  onPress={() => router.replace('/')}
                  fontFamily="$body"
                  fontSize={13}
                  color="$accent"
                  fontWeight="600"
                  pressStyle={{ opacity: 0.6 }}
                >
                  Voir ma bibliothèque
                </Text>
              </YStack>
            ) : (
              <YStack gap="$3">
                <Label>Ajouter à ma bibliothèque</Label>
                <XStack alignItems="center" gap="$2" flexWrap="wrap">
                  <Text fontFamily="$body" fontSize={13} color="$colorMuted">
                    Statut
                  </Text>
                  {STATUS_ORDER.map((s) => {
                    const active = s === status;
                    return (
                      <Button
                        key={s}
                        onPress={() => setStatus(s)}
                        height={32}
                        paddingHorizontal="$3"
                        borderRadius={999}
                        borderWidth={1}
                        borderColor={active ? statusColors[s].dot : '$borderColor'}
                        backgroundColor={active ? statusColors[s].chipBg : 'transparent'}
                        color={active ? statusColors[s].chipText : '$colorMuted'}
                        fontFamily="$body"
                        fontSize={13}
                        fontWeight="600"
                      >
                        {STATUS_LABELS[s]}
                      </Button>
                    );
                  })}
                </XStack>
                <XStack gap="$2">
                  {OWNERSHIP_ORDER.map((o) => {
                    const want = o === 'wishlist';
                    return (
                      <Button
                        key={o}
                        onPress={() => onAdd(o)}
                        disabled={add.isPending}
                        flex={1}
                        height={54}
                        borderRadius={12}
                        borderWidth={1}
                        borderColor={want ? '$accent' : '$borderColor'}
                        backgroundColor={want ? '$accent' : '$backgroundStrong'}
                        color={want ? palette.paper : '$color'}
                        fontFamily="$body"
                        fontWeight="600"
                        fontSize={13.5}
                        pressStyle={{ opacity: 0.85 }}
                      >
                        {OWNERSHIP_LABELS[o]}
                      </Button>
                    );
                  })}
                </XStack>
                {add.isPending ? (
                  <XStack justifyContent="center">
                    <Spinner color="$accent" />
                  </XStack>
                ) : null}
              </YStack>
            )}
          </YStack>
        )}
      </ScrollView>
    </YStack>
  );
}

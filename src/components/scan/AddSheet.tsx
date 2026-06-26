import { useState } from 'react';
import { Pressable } from 'react-native';
import { Button, Spinner, Text, XStack, YStack } from 'tamagui';

import { BookCover } from '@/components/BookCover';
import type { BookMetadata } from '@/features/books/use-isbn-lookup';
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

/**
 * "Possession en 1 tap": after a scan/search resolves a book, pick how to add it
 * (Je le possède / Je le veux / Emprunté) — tapping an ownership button commits
 * with the currently-selected reading status. Presentational; the screen wires
 * lookup + insert.
 */
export function AddSheet({
  book,
  busy,
  onConfirm,
  onCancel,
}: {
  book: BookMetadata;
  busy: boolean;
  onConfirm: (opts: { ownership: Ownership; status: ReadingStatus }) => void;
  onCancel: () => void;
}) {
  const [status, setStatus] = useState<ReadingStatus>('to_read');
  const meta = [book.authors?.[0], book.publisher, book.published_date?.slice(0, 4)]
    .filter(Boolean)
    .join(' · ');

  return (
    <YStack position="absolute" top={0} left={0} right={0} bottom={0}>
      <Pressable style={{ flex: 1 }} onPress={busy ? undefined : onCancel}>
        <YStack flex={1} backgroundColor="rgba(0,0,0,0.45)" />
      </Pressable>

      <YStack
        backgroundColor="$background"
        borderTopLeftRadius={18}
        borderTopRightRadius={18}
        borderTopWidth={1}
        borderTopColor="$borderColor"
        padding="$4"
        paddingBottom="$7"
        gap="$4"
      >
        <XStack gap="$3" alignItems="center">
          <BookCover
            title={book.title ?? ''}
            author={book.authors?.[0]}
            coverUrl={book.cover_url}
            isbn={book.isbn13}
            width={54}
          />
          <YStack flex={1} gap={2}>
            <Text fontFamily="$heading" fontSize={18} color="$color" numberOfLines={2}>
              {book.title ?? 'Sans titre'}
            </Text>
            {meta ? (
              <Text fontFamily="$body" fontSize={13} color="$colorMuted" numberOfLines={1}>
                {meta}
              </Text>
            ) : null}
          </YStack>
        </XStack>

        <YStack gap="$2">
          <Text
            fontFamily="$body"
            fontSize={11}
            fontWeight="600"
            letterSpacing={2}
            textTransform="uppercase"
            color="$colorMuted"
          >
            Je l'ajoute comme…
          </Text>
          <XStack gap="$2">
            {OWNERSHIP_ORDER.map((o) => {
              const owned = o === 'owned';
              return (
                <Button
                  key={o}
                  onPress={() => onConfirm({ ownership: o, status })}
                  disabled={busy}
                  flex={1}
                  height={56}
                  borderRadius={2}
                  borderWidth={1}
                  borderColor={owned ? '$accent' : '$borderColor'}
                  backgroundColor={owned ? '$accent' : '$backgroundStrong'}
                  color={owned ? palette.paper : '$color'}
                  fontFamily="$body"
                  fontWeight="600"
                  fontSize={14}
                  pressStyle={{ opacity: 0.85 }}
                >
                  {OWNERSHIP_LABELS[o]}
                </Button>
              );
            })}
          </XStack>
        </YStack>

        <XStack alignItems="center" gap="$2" flexWrap="wrap">
          <Text fontFamily="$body" fontSize={13} color="$colorMuted">
            Statut de lecture :
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

        {busy ? (
          <XStack justifyContent="center">
            <Spinner color="$accent" />
          </XStack>
        ) : null}
      </YStack>
    </YStack>
  );
}

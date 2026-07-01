import { useEffect, useRef, useState } from 'react';
import { Pressable } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';

import { BookCover } from '@/components/BookCover';
import { Icon, PackIcon } from '@/components/icons';
import { useUpdateItem } from '@/features/library/use-update-item';
import { useReadingNudge } from '@/features/reading/use-reading-nudge';
import type { LibraryItem } from '@/features/library/use-library';
import { palette } from '@/theme/tokens';

/** How long the warm "Merci !" confirmation lingers before the prompt advances. */
const REWARD_MS = 1600;

/**
 * A gentle prompt on Home inviting the reader to complete a finished book's "fiche"
 * (its rating), so the catalogue fills itself over time. Built to the UX brief:
 * ONE question at a time, big tap targets (Fitts), real content, always escapable —
 * "Plus tard" snoozes for ~a day, "Passer" skips just this book — and it never shames
 * (no red, no counters that pressure). Rewards the answer with a warm confirmation.
 */
export function ReadingNudge({
  userId,
  onOpenBook,
}: {
  userId: string | undefined;
  onOpenBook: (id: string) => void;
}) {
  const { next, count, skip, snooze } = useReadingNudge(userId);
  // While the reward lingers we freeze on the just-rated book (the library refetch
  // would otherwise swap it out instantly), then advance to `next`.
  const [reward, setReward] = useState<{ item: LibraryItem; n: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const update = useUpdateItem(reward?.item.id ?? next?.id ?? '', userId);

  useEffect(() => () => clearTimeout(timer.current), []);

  const display = reward?.item ?? next;
  if (!display) return null;

  const title = display.book?.title ?? '';
  const author = display.book?.authors?.[0] ?? null;

  const rate = (n: number) => {
    if (!next) return;
    setReward({ item: next, n });
    update.mutate({ rating: n });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setReward(null), REWARD_MS);
  };

  const justRated = reward?.n ?? null;

  return (
    <YStack
      backgroundColor="$backgroundStrong"
      borderColor="$accent"
      borderWidth={1}
      borderRadius={18}
      padding={16}
      gap="$3"
    >
      {/* header: what & why */}
      <XStack alignItems="center" justifyContent="space-between">
        <Text
          fontFamily="$body"
          fontSize={11}
          fontWeight="700"
          letterSpacing={1.6}
          textTransform="uppercase"
          color="$accent"
        >
          Fiche à compléter
        </Text>
        {count > 1 ? (
          <Text fontFamily="$body" fontSize={12} color="$colorMuted">
            {count} en attente
          </Text>
        ) : null}
      </XStack>

      <XStack gap="$3" alignItems="center">
        <BookCover
          title={title}
          coverUrl={display.coverOverride ?? display.book?.cover_url}
          isbn={display.book?.isbn13}
          width={46}
          onPress={() => onOpenBook(display.id)}
        />
        <YStack flex={1} gap={2}>
          <Text
            fontFamily="$heading"
            fontSize={17}
            fontWeight="600"
            color="$color"
            numberOfLines={2}
          >
            {title}
          </Text>
          {author ? (
            <Text fontFamily="$body" fontSize={13} color="$colorMuted" numberOfLines={1}>
              {author}
            </Text>
          ) : null}
        </YStack>
      </XStack>

      {justRated == null ? (
        <YStack gap="$2">
          <Text fontFamily="$body" fontSize={15} color="$colorSoft">
            Tu l’as terminé — quelle note lui donnes-tu ?
          </Text>
          <XStack gap="$2" alignItems="center" paddingVertical={2}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable key={n} onPress={() => rate(n)} hitSlop={6} accessibilityLabel={`${n} sur 5`}>
                {/* 44×44 tap target (HIG / WCAG AAA 2.5.5) */}
                <YStack
                  width={44}
                  height={44}
                  borderRadius={999}
                  borderWidth={1.5}
                  borderColor="$borderColor"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text fontFamily="$heading" fontSize={16} color="$colorMuted">
                    {n}
                  </Text>
                </YStack>
              </Pressable>
            ))}
          </XStack>
        </YStack>
      ) : (
        <XStack gap="$3" alignItems="center">
          <XStack gap="$3" alignItems="center" flex={1}>
            {[1, 2, 3, 4, 5].map((n) => (
              <YStack
                key={n}
                width={32}
                height={32}
                borderRadius={999}
                backgroundColor={n <= justRated ? palette.forest : 'transparent'}
                borderWidth={1.5}
                borderColor={n <= justRated ? palette.forest : '$borderColor'}
                alignItems="center"
                justifyContent="center"
              >
                <Text
                  fontFamily="$heading"
                  fontSize={14}
                  color={n <= justRated ? palette.paper : '$colorMuted'}
                >
                  {n}
                </Text>
              </YStack>
            ))}
          </XStack>
          <XStack alignItems="center" gap={5}>
            <Icon name="check" size={16} color={palette.forest} />
            <Text fontFamily="$body" fontSize={13.5} fontWeight="600" color={palette.forest}>
              Merci !
            </Text>
          </XStack>
        </XStack>
      )}

      {/* footer: escape hatches + a nudge to go deeper. paddingVertical widens the
          tap zone toward 44px (Fitts / WCAG 2.5.5) without bulking the visual text. */}
      <XStack alignItems="center" justifyContent="space-between">
        {justRated == null ? (
          <>
            <Pressable onPress={snooze} hitSlop={10} style={{ paddingVertical: 12 }}>
              <Text fontFamily="$body" fontSize={13} color="$colorMuted">
                Plus tard
              </Text>
            </Pressable>
            <Pressable onPress={() => skip(display.id)} hitSlop={10} style={{ paddingVertical: 12 }}>
              <Text fontFamily="$body" fontSize={13} color="$colorMuted">
                Passer ce livre
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            <Pressable onPress={() => onOpenBook(display.id)} hitSlop={10} style={{ paddingVertical: 12 }}>
              <Text fontFamily="$body" fontSize={13.5} fontWeight="600" color="$accent">
                Écrire un mot →
              </Text>
            </Pressable>
            <XStack alignItems="center" gap={5}>
              <PackIcon name="star" size={13} color="$gold" />
              <Text fontFamily="$body" fontSize={12.5} color="$gold" fontWeight="600">
                badge Critique
              </Text>
            </XStack>
          </>
        )}
      </XStack>
    </YStack>
  );
}

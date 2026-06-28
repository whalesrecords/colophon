import { Pressable, ScrollView } from 'react-native';
import { Button, Text, XStack, YStack } from 'tamagui';

import { BookCover } from '@/components/BookCover';
import type { CurrentRead } from '@/features/reading/use-reading-sessions';
import type { LibraryItem } from '@/features/library/use-library';
import { palette } from '@/theme/tokens';

/** "Bonjour / Bon après-midi / Bonsoir" + an upper-case day-part label. */
function greeting(hour: number): { hello: string; moment: string } {
  if (hour < 6) return { hello: 'Bonne nuit', moment: 'Nuit' };
  if (hour < 12) return { hello: 'Bonjour', moment: 'Matin' };
  if (hour < 18) return { hello: 'Bon après-midi', moment: 'Après-midi' };
  return { hello: 'Bonsoir', moment: 'Soir' };
}

const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const MONTHS = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
];

function firstName(name: string | null | undefined, fallback: string | undefined): string {
  const n = (name || fallback || '').trim();
  return n ? n.split(/\s+/)[0] : 'lecteur·rice';
}

function Avatar({ initial }: { initial: string }) {
  return (
    <YStack
      width={44}
      height={44}
      borderRadius={22}
      backgroundColor="$backgroundStrong"
      borderColor="$borderColor"
      borderWidth={1}
      alignItems="center"
      justifyContent="center"
    >
      <Text fontFamily="$heading" fontSize={18} color="$colorSoft">
        {initial}
      </Text>
    </YStack>
  );
}

function Hero({ read, onPress }: { read: CurrentRead; onPress: () => void }) {
  const pct =
    read.totalPages && read.totalPages > 0
      ? Math.min(100, Math.round((read.currentPage / read.totalPages) * 100))
      : 0;
  return (
    <YStack
      backgroundColor="$backgroundStrong"
      borderRadius={22}
      padding="$3"
      gap="$3"
      borderColor="$borderColor"
      borderWidth={1}
    >
      <XStack gap="$3">
        <BookCover
          title={read.title ?? ''}
          coverUrl={read.coverUrl}
          isbn={read.isbn13}
          width={92}
        />
        <YStack flex={1} gap="$1" paddingTop="$1">
          <Text
            fontFamily="$body"
            fontSize={11}
            fontWeight="700"
            letterSpacing={1.6}
            textTransform="uppercase"
            color={palette.brick}
          >
            {read.justFinished ? 'Vous venez de lire' : 'En ce moment'}
          </Text>
          <Text
            fontFamily="$heading"
            fontSize={21}
            fontWeight="500"
            color="$color"
            numberOfLines={2}
          >
            {read.title ?? 'Sans titre'}
          </Text>
          {read.author ? (
            <Text fontFamily="$heading" fontSize={14} fontStyle="italic" color="$colorMuted">
              {read.author}
            </Text>
          ) : null}

          {!read.justFinished && read.totalPages ? (
            <YStack gap="$1" marginTop="auto" paddingTop="$2">
              <XStack justifyContent="space-between" alignItems="baseline">
                <Text fontFamily="$body" fontSize={12.5} color="$colorMuted">
                  p. {read.currentPage} / {read.totalPages}
                </Text>
                <Text fontFamily="$body" fontSize={13} fontWeight="700" color={palette.brick}>
                  {pct} %
                </Text>
              </XStack>
              <YStack height={5} borderRadius={999} backgroundColor="$track" overflow="hidden">
                <YStack height={5} width={`${pct}%`} backgroundColor={palette.brick} />
              </YStack>
            </YStack>
          ) : null}
        </YStack>
      </XStack>

      <Button
        onPress={onPress}
        backgroundColor={palette.brick}
        color={palette.paper}
        borderRadius={16}
        height={50}
        fontFamily="$body"
        fontWeight="700"
        fontSize={15.5}
        pressStyle={{ opacity: 0.9 }}
      >
        {read.justFinished ? 'Voir le livre' : '▶  Reprendre la lecture'}
      </Button>
    </YStack>
  );
}

function Shelf({
  title,
  items,
  onOpen,
  onSeeAll,
}: {
  title: string;
  items: LibraryItem[];
  onOpen: (id: string) => void;
  onSeeAll?: () => void;
}) {
  if (items.length === 0) return null;
  return (
    <YStack gap="$2">
      <XStack alignItems="center" justifyContent="space-between">
        <Text fontFamily="$heading" fontSize={20} fontWeight="500" color="$color">
          {title}
        </Text>
        {onSeeAll ? (
          <Text
            onPress={onSeeAll}
            fontFamily="$body"
            fontSize={14}
            fontWeight="600"
            color={palette.brick}
            pressStyle={{ opacity: 0.6 }}
          >
            Tout voir
          </Text>
        ) : null}
      </XStack>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <XStack gap="$3" paddingRight="$4" paddingVertical="$1">
          {items.slice(0, 12).map((it) => (
            <Pressable key={it.id} onPress={() => onOpen(it.id)}>
              <YStack width={96} gap="$1">
                <BookCover
                  title={it.book?.title ?? ''}
                  coverUrl={it.coverOverride ?? it.book?.cover_url}
                  isbn={it.book?.isbn13}
                  width={96}
                />
                <Text fontFamily="$body" fontSize={12} color="$colorSoft" numberOfLines={1}>
                  {it.book?.title ?? 'Sans titre'}
                </Text>
              </YStack>
            </Pressable>
          ))}
        </XStack>
      </ScrollView>
    </YStack>
  );
}

interface LibraryHomeProps {
  name: string | null | undefined;
  emailFallback: string | undefined;
  currentRead: CurrentRead | null;
  reading: LibraryItem[];
  wishlist: LibraryItem[];
  now: Date;
  onOpenBook: (id: string) => void;
  onSeeWishlist: () => void;
}

/** The home header that sits above the library grid: greeting, the book you're
 *  reading now, and quick "on continue" + "vos envies" shelves. */
export function LibraryHome({
  name,
  emailFallback,
  currentRead,
  reading,
  wishlist,
  now,
  onOpenBook,
  onSeeWishlist,
}: LibraryHomeProps) {
  const g = greeting(now.getHours());
  const dateLabel = `${DAYS[now.getDay()]} ${now.getDate()} ${MONTHS[now.getMonth()]}`;
  const who = firstName(name, emailFallback);
  const initial = who.slice(0, 1).toUpperCase();
  // "On continue" excludes the hero book to avoid showing it twice.
  const continueItems = reading.filter((it) => it.id !== currentRead?.itemId);

  return (
    <YStack gap="$5">
      <XStack alignItems="flex-start" justifyContent="space-between">
        <YStack gap="$1" flex={1}>
          <Text
            fontFamily="$body"
            fontSize={11}
            fontWeight="700"
            letterSpacing={2.4}
            textTransform="uppercase"
            color="$colorMuted"
          >
            {dateLabel}
          </Text>
          <Text fontFamily="$heading" fontSize={32} fontWeight="500" color="$color">
            {g.hello}, {who}
          </Text>
        </YStack>
        <Avatar initial={initial} />
      </XStack>

      {currentRead ? (
        <Hero read={currentRead} onPress={() => onOpenBook(currentRead.itemId)} />
      ) : null}

      <Shelf title="On continue" items={continueItems} onOpen={onOpenBook} />
      <Shelf title="Vos envies" items={wishlist} onOpen={onOpenBook} onSeeAll={onSeeWishlist} />
    </YStack>
  );
}

import { useEffect } from 'react';
import { Pressable, ScrollView } from 'react-native';
import { Button, Text, XStack, YStack } from 'tamagui';

import { BookCover } from '@/components/BookCover';
import { RecommendationsShelf } from '@/components/library/RecommendationsShelf';
import { DailyGoalMini } from '@/components/reading/DailyGoalMini';
import { ReadingNudge } from '@/components/reading/ReadingNudge';
import { LibrairieNudge } from '@/components/reading/LibrairieNudge';
import { groupBySeries } from '@/features/library/group-series';
import { useDailyGoal } from '@/features/reading/use-daily-goal';
import { syncCurrentReadWidget } from '@/features/reading/widget-sync';
import { pushToWatch } from '@/features/watch/watch-bridge';
import { useDisplayPrefs } from '@/features/settings/use-display-prefs';
import { KPIRow, KPITile } from '@/components/ui';
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

function Avatar({ initial, onPress }: { initial: string; onPress?: () => void }) {
  return (
    <YStack
      onPress={onPress}
      width={44}
      height={44}
      borderRadius={22}
      backgroundColor="$backgroundStrong"
      borderColor="$borderColor"
      borderWidth={1}
      alignItems="center"
      justifyContent="center"
      pressStyle={{ opacity: 0.6, borderColor: '$accent' }}
      hoverStyle={{ borderColor: '$accent' }}
      {...({ style: { cursor: 'pointer' } } as object)}
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

/** Like Shelf, but series collapse into a single stacked cover with a "N tomes" badge —
 *  so a 12-volume series in the to-read pile shows once, not twelve times. */
function PileShelf({
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
  const { groups, singles } = groupBySeries(items);
  const entries = [
    ...groups.map((g) => ({ kind: 'series' as const, g })),
    ...singles.map((it) => ({ kind: 'single' as const, it })),
  ];

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
          {entries.slice(0, 16).map((e) =>
            e.kind === 'series' ? (
              <Pressable key={e.g.key} onPress={() => onOpen(e.g.cover.id)}>
                <YStack width={96} gap="$1">
                  <YStack width={96} height={144}>
                    {/* Stacked-pile effect: two offset cards peeking behind the cover. */}
                    <YStack
                      position="absolute"
                      top={5}
                      left={6}
                      width={96}
                      height={144}
                      borderRadius={8}
                      backgroundColor="$backgroundStrong"
                      borderColor="$borderColor"
                      borderWidth={1}
                    />
                    <YStack
                      position="absolute"
                      top={2.5}
                      left={3}
                      width={96}
                      height={144}
                      borderRadius={8}
                      backgroundColor="$background"
                      borderColor="$borderColor"
                      borderWidth={1}
                    />
                    <BookCover
                      title={e.g.cover.book?.title ?? ''}
                      coverUrl={e.g.cover.coverOverride ?? e.g.cover.book?.cover_url}
                      isbn={e.g.cover.book?.isbn13}
                      width={96}
                    />
                    <YStack
                      position="absolute"
                      top={6}
                      right={6}
                      backgroundColor={palette.ink}
                      borderRadius={999}
                      paddingHorizontal={8}
                      paddingVertical={3}
                    >
                      <Text fontFamily="$body" fontSize={11} fontWeight="700" color={palette.paper}>
                        {e.g.distinctCount} tomes
                      </Text>
                    </YStack>
                  </YStack>
                  <Text fontFamily="$body" fontSize={12} color="$colorSoft" numberOfLines={1}>
                    {e.g.name}
                  </Text>
                </YStack>
              </Pressable>
            ) : (
              <Pressable key={e.it.id} onPress={() => onOpen(e.it.id)}>
                <YStack width={96} gap="$1">
                  <BookCover
                    title={e.it.book?.title ?? ''}
                    coverUrl={e.it.coverOverride ?? e.it.book?.cover_url}
                    isbn={e.it.book?.isbn13}
                    width={96}
                  />
                  <Text fontFamily="$body" fontSize={12} color="$colorSoft" numberOfLines={1}>
                    {e.it.book?.title ?? 'Sans titre'}
                  </Text>
                </YStack>
              </Pressable>
            ),
          )}
        </XStack>
      </ScrollView>
    </YStack>
  );
}

interface LibraryHomeProps {
  name: string | null | undefined;
  emailFallback: string | undefined;
  currentRead: CurrentRead | null;
  recent: LibraryItem[];
  reading: LibraryItem[];
  toRead: LibraryItem[];
  wishlist: LibraryItem[];
  stats: { read: number; total: number };
  userId: string | undefined;
  now: Date;
  onOpenBook: (id: string) => void;
  onSeeWishlist: () => void;
  onSeeQueue: () => void;
  onOpenProfile: () => void;
}

/** The home header that sits above the library grid: greeting, the book you're
 *  reading now, and quick "on continue" + "vos envies" shelves. */
export function LibraryHome({
  name,
  emailFallback,
  currentRead,
  recent,
  reading,
  toRead,
  wishlist,
  stats,
  userId,
  now,
  onOpenBook,
  onSeeWishlist,
  onSeeQueue,
  onOpenProfile,
}: LibraryHomeProps) {
  const { prefs } = useDisplayPrefs();
  const { data: daily } = useDailyGoal(userId);
  const g = greeting(now.getHours());
  const dateLabel = `${DAYS[now.getDay()]} ${now.getDate()} ${MONTHS[now.getMonth()]}`;
  const who = firstName(name, emailFallback);
  const initial = who.slice(0, 1).toUpperCase();
  // "On continue" excludes the hero book to avoid showing it twice.
  const continueItems = reading.filter((it) => it.id !== currentRead?.itemId);

  // Keep the iOS "où en es-tu ?" widget + watchOS app in sync with the current read.
  const minutesToday = daily?.minutesToday ?? 0;
  useEffect(() => {
    syncCurrentReadWidget({
      title: currentRead && !currentRead.justFinished ? currentRead.title : null,
      author: currentRead?.author ?? null,
      page: currentRead?.currentPage ?? 0,
      totalPages: currentRead?.totalPages ?? null,
      minutesToday,
    });
    // Then relay the same snapshot (+ the open session id) to the Apple Watch.
    pushToWatch(currentRead && !currentRead.justFinished ? currentRead.sessionId : null);
  }, [
    currentRead?.title,
    currentRead?.author,
    currentRead?.currentPage,
    currentRead?.totalPages,
    currentRead?.justFinished,
    currentRead?.sessionId,
    minutesToday,
  ]);

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
        <Avatar initial={initial} onPress={onOpenProfile} />
      </XStack>

      {prefs.gamification ? <DailyGoalMini userId={userId} onPress={onOpenProfile} /> : null}

      {currentRead ? (
        <Hero read={currentRead} onPress={() => onOpenBook(currentRead.itemId)} />
      ) : null}

      <ReadingNudge userId={userId} onOpenBook={onOpenBook} />

      <KPIRow>
        <KPITile value={String(stats.read)} label="Livres lus" accent={palette.forest} />
        <KPITile
          value={String(stats.total)}
          label="Dans ma bibliothèque"
          accent={palette.prussian}
        />
      </KPIRow>

      <Shelf title="Derniers ajouts" items={recent} onOpen={onOpenBook} />
      <Shelf title="On continue" items={continueItems} onOpen={onOpenBook} />
      <PileShelf title="Pile à lire" items={toRead} onOpen={onOpenBook} onSeeAll={onSeeQueue} />
      <Shelf title="Vos envies" items={wishlist} onOpen={onOpenBook} onSeeAll={onSeeWishlist} />

      {prefs.discovery ? <RecommendationsShelf userId={userId} /> : null}

      <LibrairieNudge eligible={stats.read > 0} />
    </YStack>
  );
}

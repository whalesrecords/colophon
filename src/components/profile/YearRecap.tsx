import { useMemo } from 'react';
import { Platform, ScrollView, Share as RNShare, View } from 'react-native';
import { Button, Text, XStack, YStack } from 'tamagui';

import { BookCover } from '@/components/BookCover';
import { displayValue } from '@/components/library/FilterPanel';
import { computeFacets, EMPTY_FILTERS } from '@/features/library/faceting';
import type { LibraryItem } from '@/features/library/use-library';
import type { LibraryStats } from '@/features/stats/use-stats';
import { useT } from '@/i18n';
import { palette } from '@/theme/tokens';

/** A fanned-out spread of the year's book covers, like a hand of cards. */
function CoverFan({ items }: { items: LibraryItem[] }) {
  const books = items.slice(0, 5);
  const mid = (books.length - 1) / 2;
  return (
    <YStack height={210} width="100%" alignItems="center" justifyContent="center">
      {books.map((item, i) => {
        const off = i - mid;
        return (
          <View
            key={item.id}
            style={{
              position: 'absolute',
              transform: [
                { translateX: off * 44 },
                { translateY: Math.abs(off) * 10 },
                { rotate: `${off * 9}deg` },
              ],
              zIndex: i,
              shadowColor: '#1C1A17',
              shadowOpacity: 0.2,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 8 },
              elevation: 8,
            }}
          >
            <BookCover
              title={item.book?.title ?? ''}
              author={item.book?.authors?.[0]}
              coverUrl={item.coverOverride ?? item.book?.cover_url}
              isbn={item.book?.isbn13}
              width={98}
            />
          </View>
        );
      })}
    </YStack>
  );
}

function StatBig({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <YStack flex={1} alignItems="center" gap={2}>
      <Text fontFamily="$heading" fontSize={52} fontWeight="500" color={color} lineHeight={56}>
        {value}
      </Text>
      <Text fontFamily="$body" fontSize={14} color="$colorMuted">
        {label}
      </Text>
    </YStack>
  );
}

function FactRow({ dot, label, value }: { dot: string; label: string; value: string }) {
  return (
    <XStack
      alignItems="center"
      gap="$3"
      paddingVertical="$3"
      paddingHorizontal="$4"
      backgroundColor="$backgroundStrong"
      borderRadius={16}
    >
      <YStack width={9} height={9} borderRadius={999} backgroundColor={dot} />
      <Text
        fontFamily="$body"
        fontSize={11}
        fontWeight="600"
        letterSpacing={1.6}
        textTransform="uppercase"
        color="$colorMuted"
      >
        {label}
      </Text>
      <Text
        fontFamily="$heading"
        fontSize={17}
        color="$color"
        flex={1}
        textAlign="right"
        numberOfLines={1}
      >
        {value}
      </Text>
    </XStack>
  );
}

/** A shareable "year in reading" recap — fanned covers + the year's highlights. */
export function YearRecap({
  items,
  stats,
  onClose,
}: {
  items: LibraryItem[];
  stats: LibraryStats;
  onClose: () => void;
}) {
  const { t } = useT();
  const facets = useMemo(() => computeFacets(items, EMPTY_FILTERS), [items]);
  const topAuthor = facets.author[0] ? displayValue('author', facets.author[0].value) : null;
  const topGenre = facets.genre[0] ? displayValue('genre', facets.genre[0].value) : null;

  // Prefer read (owned/borrowed) books for the fan, newest-first; fall back to any owned.
  const fanItems = useMemo(() => {
    const present = items.filter((i) => i.ownership !== 'wishlist');
    const read = present.filter((i) => i.status === 'read');
    return (read.length >= 3 ? read : present).slice(0, 5);
  }, [items]);

  const onShare = () => {
    const msg = t('recap.shareText', {
      year: stats.year,
      books: stats.readThisYear,
      pages: stats.pagesRead,
    });
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(msg).catch(() => undefined);
    } else {
      RNShare.share({ message: msg }).catch(() => undefined);
    }
  };

  return (
    <YStack position="absolute" top={0} left={0} right={0} bottom={0} backgroundColor="$background">
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
          paddingTop: 56,
          paddingBottom: 16,
          alignItems: 'center',
        }}
      >
        <Text
          fontFamily="$body"
          fontSize={12}
          fontWeight="600"
          letterSpacing={3}
          textTransform="uppercase"
          color="$colorMuted"
        >
          Colophon
        </Text>
        <Text
          fontFamily="$heading"
          fontSize={34}
          fontWeight="500"
          color="$color"
          marginTop="$2"
          textAlign="center"
        >
          {t('recap.title', { year: stats.year })}
        </Text>
        <Text
          fontFamily="$heading"
          fontSize={17}
          fontStyle="italic"
          color={palette.terracotta}
          marginTop="$2"
        >
          {t('recap.subtitle')}
        </Text>

        <YStack width="100%" marginTop="$6" marginBottom="$5">
          <CoverFan items={fanItems} />
        </YStack>

        <XStack width="100%" maxWidth={420} alignItems="center">
          <StatBig
            value={String(stats.readThisYear)}
            label={stats.readThisYear === 1 ? t('recap.bookOne') : t('recap.books')}
            color={palette.terracotta}
          />
          <YStack width={1} height={56} backgroundColor="$borderColor" />
          <StatBig value={String(stats.pagesRead)} label={t('recap.pages')} color={palette.aizome} />
        </XStack>

        <YStack width="100%" maxWidth={420} gap="$2" marginTop="$6">
          {topAuthor ? (
            <FactRow dot={palette.sage} label={t('recap.topAuthor')} value={topAuthor} />
          ) : null}
          {topGenre ? (
            <FactRow dot={palette.ochre} label={t('recap.topGenre')} value={topGenre} />
          ) : null}
        </YStack>
      </ScrollView>

      <XStack
        paddingHorizontal="$5"
        paddingBottom="$7"
        paddingTop="$3"
        gap="$3"
        alignItems="center"
      >
        <Button
          onPress={onShare}
          backgroundColor={palette.terracotta}
          color={palette.paper}
          borderRadius={999}
          height={54}
          flex={1}
          fontFamily="$body"
          fontWeight="600"
          fontSize={16}
          pressStyle={{ opacity: 0.9 }}
        >
          {`↗  ${t('recap.share')}`}
        </Button>
        <Button
          onPress={onClose}
          chromeless
          height={54}
          paddingHorizontal="$4"
          color="$colorMuted"
          fontFamily="$body"
          fontWeight="600"
          fontSize={16}
        >
          {t('recap.close')}
        </Button>
      </XStack>
    </YStack>
  );
}

import { useMemo } from 'react';
import { Platform, Share as RNShare } from 'react-native';
import { Button, Text, XStack, YStack } from 'tamagui';

import { displayValue } from '@/components/library/FilterPanel';
import { computeFacets, EMPTY_FILTERS } from '@/features/library/faceting';
import type { LibraryItem } from '@/features/library/use-library';
import type { LibraryStats } from '@/features/stats/use-stats';
import { useT } from '@/i18n';
import { palette } from '@/theme/tokens';

function RecapStat({ value, label }: { value: string; label: string }) {
  return (
    <YStack alignItems="center">
      <Text fontFamily="$heading" fontSize={56} fontWeight="500" color="$accent" lineHeight={60}>
        {value}
      </Text>
      <Text fontFamily="$body" fontSize={14} color="$colorSoft">
        {label}
      </Text>
    </YStack>
  );
}

function RecapLine({ label, value }: { label: string; value: string }) {
  return (
    <YStack alignItems="center" gap={2}>
      <Text
        fontFamily="$body"
        fontSize={11}
        color="$colorMuted"
        textTransform="uppercase"
        letterSpacing={1.6}
      >
        {label}
      </Text>
      <Text fontFamily="$heading" fontSize={20} fontStyle="italic" color="$colorSoft" numberOfLines={1}>
        {value}
      </Text>
    </YStack>
  );
}

/** A shareable "year in reading" recap card (Spotify-Wrapped effect, calm style). */
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
    <YStack
      position="absolute"
      top={0}
      left={0}
      right={0}
      bottom={0}
      backgroundColor="$background"
      alignItems="center"
      justifyContent="center"
      padding="$5"
      gap="$6"
    >
      <YStack alignItems="center" gap="$2">
        <Text
          fontFamily="$body"
          fontSize={12}
          fontWeight="600"
          letterSpacing={2.4}
          textTransform="uppercase"
          color="$colorMuted"
        >
          Colophon
        </Text>
        <Text fontFamily="$heading" fontSize={34} fontWeight="500" color="$color">
          {t('recap.title', { year: stats.year })}
        </Text>
      </YStack>

      <YStack alignItems="center" gap="$5" width="100%" maxWidth={420}>
        <RecapStat value={String(stats.readThisYear)} label={t('recap.books')} />
        <RecapStat value={String(stats.pagesRead)} label={t('recap.pages')} />
        {topAuthor ? <RecapLine label={t('recap.topAuthor')} value={topAuthor} /> : null}
        {topGenre ? <RecapLine label={t('recap.topGenre')} value={topGenre} /> : null}
      </YStack>

      <XStack gap="$3" alignItems="center">
        <Button
          onPress={onShare}
          backgroundColor="$accent"
          color={palette.paper}
          borderRadius={2}
          height={48}
          paddingHorizontal="$5"
          fontFamily="$body"
          fontWeight="600"
        >
          {t('recap.share')}
        </Button>
        <Button
          onPress={onClose}
          chromeless
          height={48}
          color="$colorMuted"
          fontFamily="$body"
          fontWeight="600"
        >
          {t('recap.close')}
        </Button>
      </XStack>
    </YStack>
  );
}

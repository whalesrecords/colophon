import { useEffect, useState } from 'react';
import { Button, Spinner, Text, XStack, YStack } from 'tamagui';

import { BookCover } from '@/components/BookCover';
import { useSeriesVolumes } from '@/features/books/use-series-volumes';
import { useScanSession } from '@/features/scan/use-scan-session';
import { palette } from '@/theme/tokens';

/**
 * Series completion: fetches the full volume list for a series the user owns
 * part of, and shows the missing tomes with a one-tap "add the missing volumes".
 * The owned-vs-missing view is the dossier's manga killer feature.
 */
export function SeriesCompletion({
  seriesName,
  ownedIsbns,
  userId,
  coverWidth,
}: {
  seriesName: string;
  ownedIsbns: Set<string>;
  userId: string | undefined;
  coverWidth: number;
}) {
  const fetchVols = useSeriesVolumes();
  const { submitMany, bulk } = useScanSession(userId);
  const [added, setAdded] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchVols.mutate(seriesName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seriesName]);

  const volumes = fetchVols.data ?? [];
  const missing = volumes.filter((v) => !ownedIsbns.has(v.isbn13) && !added.has(v.isbn13));
  const ownedCount = ownedIsbns.size;
  const total = Math.max(volumes.length, ownedCount);

  const onAddAll = async () => {
    const isbns = missing.map((v) => v.isbn13);
    if (isbns.length === 0) return;
    await submitMany(isbns);
    setAdded((prev) => new Set([...prev, ...isbns]));
  };

  return (
    <YStack gap="$3">
      <Text
        fontFamily="$body"
        fontSize={11}
        fontWeight="600"
        letterSpacing={2.4}
        textTransform="uppercase"
        color="$colorMuted"
      >
        Complétion
      </Text>

      {fetchVols.isPending ? (
        <XStack gap="$2" alignItems="center">
          <Spinner color="$accent" />
          <Text fontFamily="$body" fontSize={13} color="$colorMuted">
            Recherche des tomes…
          </Text>
        </XStack>
      ) : volumes.length === 0 ? (
        <Text fontFamily="$body" fontSize={13} color="$colorMuted">
          Tomes introuvables automatiquement pour cette série.
        </Text>
      ) : missing.length === 0 ? (
        <Text fontFamily="$body" fontSize={14} fontWeight="600" color="$positive">
          {`Série complète · ${ownedCount} / ${total} ✓`}
        </Text>
      ) : (
        <YStack gap="$3">
          <Text fontFamily="$body" fontSize={14} color="$colorSoft">
            {`${ownedCount} / ${total} tomes · il manque ${missing.length}`}
          </Text>
          <XStack flexWrap="wrap" gap={12}>
            {missing.map((v) => (
              <YStack key={v.isbn13} width={coverWidth} gap={4} alignItems="center" opacity={0.78}>
                <BookCover title={v.title} coverUrl={v.coverUrl} isbn={v.isbn13} width={coverWidth} />
                <Text fontFamily="$body" fontSize={11} color="$colorMuted">
                  {`T${v.volume}`}
                </Text>
              </YStack>
            ))}
          </XStack>
          <Button
            onPress={onAddAll}
            disabled={!!bulk}
            backgroundColor="$accent"
            color={palette.paper}
            borderRadius={2}
            height={48}
            fontFamily="$body"
            fontWeight="600"
            opacity={bulk ? 0.7 : 1}
          >
            {bulk
              ? `Ajout… ${bulk.done}/${bulk.total}`
              : `Ajouter les ${missing.length} tome${missing.length > 1 ? 's' : ''} manquant${missing.length > 1 ? 's' : ''}`}
          </Button>
        </YStack>
      )}
    </YStack>
  );
}

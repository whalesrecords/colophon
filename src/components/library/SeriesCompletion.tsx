import { useEffect, useState } from 'react';
import { Button, Input, Spinner, Text, XStack, YStack } from 'tamagui';

import { BookCover } from '@/components/BookCover';
import {
  useSeriesTotals,
  useSeriesVolumes,
  useSetSeriesTotal,
} from '@/features/books/use-series-volumes';
import { useScanSession } from '@/features/scan/use-scan-session';
import { seriesKey } from '@/lib/series';
import { palette } from '@/theme/tokens';

/**
 * Series completion: shows missing tomes + one-tap "add the missing volumes".
 * Because editions differ (a 4-volume "édition spéciale" vs a standard run), the
 * total is search-derived but a per-user override can correct it / mark complete.
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
  const { data: totals } = useSeriesTotals(userId);
  const setTotal = useSetSeriesTotal(userId);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState(false);
  const [customTotal, setCustomTotal] = useState('');

  useEffect(() => {
    fetchVols.mutate(seriesName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seriesName]);

  const key = seriesKey(seriesName);
  const override = totals?.get(key) ?? null;
  const volumes = fetchVols.data ?? [];
  const ownedCount = ownedIsbns.size;
  const totalKnown = override != null || volumes.length > 0;
  const effectiveTotal = override ?? Math.max(volumes.length, ownedCount);
  const isComplete = totalKnown && ownedCount >= effectiveTotal;
  const missingAll = volumes.filter((v) => !ownedIsbns.has(v.isbn13) && !added.has(v.isbn13));
  const missing = isComplete ? [] : missingAll.slice(0, Math.max(0, effectiveTotal - ownedCount));

  const onAddAll = async () => {
    const isbns = missing.map((v) => v.isbn13);
    if (isbns.length === 0) return;
    await submitMany(isbns);
    setAdded((prev) => new Set([...prev, ...isbns]));
  };

  const saveTotal = (n: number | null) => {
    setTotal.mutate({ key, total: n });
    setEditing(false);
    setCustomTotal('');
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
      ) : (
        <YStack gap="$3">
          {!totalKnown ? (
            <Text fontFamily="$body" fontSize={14} color="$colorSoft">
              {`Vous possédez ${ownedCount} tome${ownedCount > 1 ? 's' : ''}. Total inconnu — corrigez-le ci-dessous.`}
            </Text>
          ) : isComplete ? (
            <Text fontFamily="$body" fontSize={14} fontWeight="600" color="$positive">
              {`Série complète · ${Math.min(ownedCount, effectiveTotal)} / ${effectiveTotal} ✓`}
            </Text>
          ) : (
            <Text fontFamily="$body" fontSize={14} color="$colorSoft">
              {`${ownedCount} / ${effectiveTotal} tomes · il manque ${effectiveTotal - ownedCount}`}
            </Text>
          )}

          {missing.length > 0 ? (
            <>
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
                borderRadius={12}
                height={48}
                fontFamily="$body"
                fontWeight="600"
                opacity={bulk ? 0.7 : 1}
              >
                {bulk
                  ? `Ajout… ${bulk.done}/${bulk.total}`
                  : `Ajouter les ${missing.length} tome${missing.length > 1 ? 's' : ''} manquant${missing.length > 1 ? 's' : ''}`}
              </Button>
            </>
          ) : null}

          {editing ? (
            <XStack gap="$2" alignItems="center">
              <Input
                flex={1}
                value={customTotal}
                onChangeText={setCustomTotal}
                keyboardType="number-pad"
                inputMode="numeric"
                placeholder={`Nombre de tomes (ex. ${effectiveTotal})`}
                placeholderTextColor="$concreteLight"
                backgroundColor="$backgroundStrong"
                borderColor="$borderColor"
                borderWidth={1}
                borderRadius={12}
                height={42}
                paddingHorizontal="$3"
                fontFamily="$body"
                fontSize={15}
                color="$color"
              />
              <Button
                onPress={() => {
                  const n = Number.parseInt(customTotal, 10);
                  if (Number.isFinite(n) && n > 0) saveTotal(Math.min(999, n));
                }}
                disabled={!customTotal.trim()}
                backgroundColor="$accent"
                color={palette.paper}
                borderRadius={12}
                height={42}
                paddingHorizontal="$4"
                fontFamily="$body"
                fontWeight="600"
                opacity={customTotal.trim() ? 1 : 0.6}
              >
                OK
              </Button>
            </XStack>
          ) : (
            <XStack gap="$4" flexWrap="wrap">
              {!isComplete ? (
                <Button
                  onPress={() => saveTotal(ownedCount)}
                  chromeless
                  height={30}
                  paddingHorizontal={0}
                  color="$accent"
                  fontFamily="$body"
                  fontSize={13}
                  fontWeight="600"
                >
                  Marquer complète
                </Button>
              ) : null}
              <Button
                onPress={() => setEditing(true)}
                chromeless
                height={30}
                paddingHorizontal={0}
                color="$colorMuted"
                fontFamily="$body"
                fontSize={13}
              >
                Corriger le total…
              </Button>
              {override != null ? (
                <Button
                  onPress={() => saveTotal(null)}
                  chromeless
                  height={30}
                  paddingHorizontal={0}
                  color="$colorMuted"
                  fontFamily="$body"
                  fontSize={13}
                >
                  Réinitialiser
                </Button>
              ) : null}
            </XStack>
          )}
        </YStack>
      )}
    </YStack>
  );
}

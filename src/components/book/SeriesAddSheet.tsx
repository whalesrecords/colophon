import { useEffect, useMemo, useState } from 'react';
import { ScrollView } from 'react-native';
import { Button, Spinner, Text, XStack, YStack } from 'tamagui';

import { BookCover } from '@/components/BookCover';
import { useSeriesVolumes } from '@/features/books/use-series-volumes';
import { useLibrary } from '@/features/library/use-library';
import { useScanSession } from '@/features/scan/use-scan-session';
import { palette } from '@/theme/tokens';

function Check({ on, disabled }: { on: boolean; disabled?: boolean }) {
  return (
    <YStack
      width={22}
      height={22}
      borderRadius={4}
      borderWidth={1.5}
      borderColor={on ? '$accent' : '$borderColor'}
      backgroundColor={on ? '$accent' : 'transparent'}
      alignItems="center"
      justifyContent="center"
      opacity={disabled ? 0.6 : 1}
    >
      {on ? (
        <Text fontFamily="$body" fontSize={13} fontWeight="700" color={palette.paper}>
          ✓
        </Text>
      ) : null}
    </YStack>
  );
}

export function SeriesAddSheet({
  seriesName,
  userId,
  onClose,
}: {
  seriesName: string;
  userId: string | undefined;
  onClose: () => void;
}) {
  const fetchVolumes = useSeriesVolumes();
  const { data: library } = useLibrary(userId);
  const { submitMany, bulk } = useScanSession(userId);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [added, setAdded] = useState(false);

  const owned = useMemo(
    () => new Set((library ?? []).map((i) => i.book?.isbn13).filter((x): x is string => !!x)),
    [library],
  );

  useEffect(() => {
    fetchVolumes.mutate(seriesName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seriesName]);

  const volumes = fetchVolumes.data ?? [];

  useEffect(() => {
    if (volumes.length) {
      setSelected(new Set(volumes.filter((v) => !owned.has(v.isbn13)).map((v) => v.isbn13)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchVolumes.data, library]);

  const toggle = (isbn: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(isbn)) n.delete(isbn);
      else n.add(isbn);
      return n;
    });

  const toAdd = [...selected].filter((i) => !owned.has(i));

  const onAdd = async () => {
    if (toAdd.length === 0) return;
    await submitMany(toAdd);
    setAdded(true);
    setTimeout(onClose, 700);
  };

  return (
    <YStack position="absolute" top={0} left={0} right={0} bottom={0} backgroundColor="$background">
      <XStack
        paddingHorizontal="$4"
        paddingTop="$6"
        paddingBottom="$3"
        gap="$2"
        alignItems="center"
        borderBottomColor="$borderColor"
        borderBottomWidth={1}
      >
        <YStack flex={1}>
          <Text fontFamily="$heading" fontSize={19} color="$color" numberOfLines={1}>
            {`Série « ${seriesName} »`}
          </Text>
          {volumes.length > 0 ? (
            <Text fontFamily="$body" fontSize={13} color="$colorMuted">
              {`${volumes.length} tome${volumes.length > 1 ? 's' : ''} trouvé${volumes.length > 1 ? 's' : ''}`}
            </Text>
          ) : null}
        </YStack>
        <Button onPress={onClose} chromeless color="$accent" fontFamily="$body" fontWeight="600">
          Fermer
        </Button>
      </XStack>

      {fetchVolumes.isPending ? (
        <YStack flex={1} alignItems="center" justifyContent="center">
          <Spinner color="$accent" size="large" />
        </YStack>
      ) : volumes.length === 0 ? (
        <Text fontFamily="$body" fontSize={14} color="$colorMuted" padding="$5">
          Aucun tome trouvé automatiquement pour cette série. Ajoutez-les en scannant ou par ISBN.
        </Text>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: 110 }}>
          {volumes.map((v) => {
            const isOwned = owned.has(v.isbn13);
            const sel = selected.has(v.isbn13);
            return (
              <Button key={v.isbn13} onPress={() => !isOwned && toggle(v.isbn13)} unstyled padding={0} disabled={isOwned}>
                <XStack
                  gap="$3"
                  alignItems="center"
                  padding="$2"
                  backgroundColor="$backgroundStrong"
                  borderColor="$borderColor"
                  borderWidth={1}
                  borderRadius={2}
                  width="100%"
                  opacity={isOwned ? 0.55 : 1}
                >
                  <BookCover title={v.title} coverUrl={v.coverUrl} isbn={v.isbn13} width={36} />
                  <YStack flex={1} gap={2}>
                    <Text fontFamily="$heading" fontSize={15} color="$color">
                      {`Tome ${v.volume}`}
                    </Text>
                    <Text fontFamily="$body" fontSize={12} color="$colorMuted" numberOfLines={1}>
                      {isOwned ? 'Déjà dans votre bibliothèque' : v.title}
                    </Text>
                  </YStack>
                  <Check on={isOwned || sel} disabled={isOwned} />
                </XStack>
              </Button>
            );
          })}
        </ScrollView>
      )}

      {volumes.length > 0 ? (
        <YStack
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          padding="$4"
          paddingBottom="$6"
          borderTopColor="$borderColor"
          borderTopWidth={1}
          backgroundColor="$background"
        >
          <Button
            onPress={onAdd}
            disabled={!!bulk || toAdd.length === 0}
            backgroundColor="$accent"
            color={palette.paper}
            borderRadius={2}
            height={50}
            fontFamily="$body"
            fontWeight="600"
            fontSize={16}
            opacity={!!bulk || toAdd.length === 0 ? 0.6 : 1}
          >
            {bulk
              ? `Ajout… ${bulk.done}/${bulk.total}`
              : added
                ? 'Ajouté ✓'
                : `Ajouter ${toAdd.length} tome${toAdd.length > 1 ? 's' : ''}`}
          </Button>
        </YStack>
      ) : null}
    </YStack>
  );
}

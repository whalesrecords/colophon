import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Spinner, Text, XStack, YStack } from 'tamagui';

import { BookCover } from '@/components/BookCover';
import { useAuth } from '@/features/auth/auth-context';
import { type UpcomingItem, useUpcoming } from '@/features/books/use-upcoming';
import { useAddItem } from '@/features/library/use-add-item';
import { palette } from '@/theme/tokens';

function monthLabel(raw: string | null): string {
  if (!raw) return 'Date annoncée';
  const m = raw.match(/^(\d{4})(?:-(\d{2}))?/);
  if (!m) return 'Date annoncée';
  const d = new Date(Number(m[1]), m[2] ? Number(m[2]) - 1 : 0, 1);
  const s = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function Section({ children }: { children: string }) {
  return (
    <Text
      fontFamily="$body"
      fontSize={11}
      fontWeight="600"
      letterSpacing={2.4}
      textTransform="uppercase"
      color="$colorMuted"
    >
      {children}
    </Text>
  );
}

function Row({
  item,
  added,
  busy,
  onAdd,
}: {
  item: UpcomingItem;
  added: boolean;
  busy: boolean;
  onAdd: () => void;
}) {
  const v = item.volume;
  return (
    <XStack gap="$3" alignItems="center" opacity={added ? 0.55 : 1}>
      <BookCover title={v.title} coverUrl={v.coverUrl} isbn={v.isbn13} width={42} />
      <YStack flex={1} gap={1}>
        <Text fontFamily="$body" fontSize={14} fontWeight="600" color="$color" numberOfLines={1}>
          {item.seriesName}
        </Text>
        <Text fontFamily="$body" fontSize={12} color="$colorMuted">
          {`Tome ${v.volume}`}
        </Text>
      </YStack>
      <Button
        onPress={onAdd}
        disabled={added || busy}
        height={34}
        paddingHorizontal="$3"
        borderRadius={999}
        borderWidth={1}
        borderColor={added ? '$borderColor' : '$accent'}
        backgroundColor={added ? 'transparent' : '$accent'}
        color={added ? '$colorMuted' : palette.paper}
        fontFamily="$body"
        fontSize={13}
        fontWeight="600"
      >
        {added ? 'Ajouté ✓' : '♡ Envie'}
      </Button>
    </XStack>
  );
}

export default function UpcomingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const userId = session?.user.id;
  const { data, isLoading, isError } = useUpcoming(userId);
  const addItem = useAddItem(userId);
  const [added, setAdded] = useState<Set<string>>(new Set());

  const months = useMemo(() => {
    const map = new Map<string, UpcomingItem[]>();
    for (const it of data?.upcoming ?? []) {
      const label = monthLabel(it.volume.publishedDate);
      (map.get(label) ?? map.set(label, []).get(label)!).push(it);
    }
    return [...map.entries()];
  }, [data?.upcoming]);

  const bySeries = useMemo(() => {
    const map = new Map<string, UpcomingItem[]>();
    for (const it of data?.missing ?? []) {
      (map.get(it.seriesName) ?? map.set(it.seriesName, []).get(it.seriesName)!).push(it);
    }
    return [...map.entries()];
  }, [data?.missing]);

  const addToWishlist = async (isbn13: string) => {
    try {
      await addItem.mutateAsync({ isbn13, ownership: 'wishlist' });
      setAdded((prev) => new Set(prev).add(isbn13));
    } catch {
      /* surfaced by the button staying actionable */
    }
  };

  const nothing = !isLoading && !isError && !months.length && !bySeries.length;

  return (
    <YStack flex={1} backgroundColor="$background">
      <XStack
        paddingTop={insets.top + 8}
        paddingBottom="$2"
        paddingHorizontal="$4"
        alignItems="center"
        gap="$3"
      >
        <Text
          onPress={() => router.back()}
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

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 48 }}>
        <YStack gap="$2" marginBottom="$4">
          <Text fontFamily="$heading" fontSize={28} fontWeight="500" color="$color">
            À venir
          </Text>
          <Text fontFamily="$body" fontSize={14} color="$colorSoft" lineHeight={20}>
            Les prochaines sorties et les tomes qu'il vous manque, d'après vos séries.
          </Text>
        </YStack>

        {isLoading ? (
          <XStack gap="$2" alignItems="center" paddingVertical="$4">
            <Spinner color="$accent" />
            <Text fontFamily="$body" fontSize={13} color="$colorMuted">
              On parcourt vos séries…
            </Text>
          </XStack>
        ) : isError ? (
          <Text fontFamily="$body" fontSize={14} color="$signal">
            Recherche impossible pour le moment. Réessayez plus tard.
          </Text>
        ) : nothing ? (
          <YStack
            gap="$2"
            padding="$4"
            borderWidth={1}
            borderColor="$borderColor"
            borderRadius={14}
            backgroundColor="$backgroundStrong"
          >
            <Text fontFamily="$heading" fontSize={17} color="$color">
              Rien à l'horizon ✓
            </Text>
            <Text fontFamily="$body" fontSize={13} color="$colorSoft" lineHeight={19}>
              Vos séries connues sont à jour, ou aucune date de sortie n'est encore annoncée.
              Ajoutez quelques tomes d'une série pour suivre ses parutions.
            </Text>
          </YStack>
        ) : (
          <YStack gap="$6">
            {months.length ? (
              <YStack gap="$4">
                <Section>Sorties à venir</Section>
                {months.map(([label, list]) => (
                  <YStack key={label} gap="$3">
                    <Text fontFamily="$body" fontSize={13} fontWeight="700" color="$accent">
                      {label}
                    </Text>
                    {list.map((it) => (
                      <Row
                        key={`${it.key}-${it.volume.isbn13}`}
                        item={it}
                        added={added.has(it.volume.isbn13)}
                        busy={addItem.isPending}
                        onAdd={() => void addToWishlist(it.volume.isbn13)}
                      />
                    ))}
                  </YStack>
                ))}
              </YStack>
            ) : null}

            {bySeries.length ? (
              <YStack gap="$4">
                <Section>À compléter</Section>
                {bySeries.map(([name, list]) => (
                  <YStack key={name} gap="$3">
                    <Text fontFamily="$body" fontSize={13} fontWeight="700" color="$colorSoft">
                      {`${name} · il manque ${list.length} tome${list.length > 1 ? 's' : ''}`}
                    </Text>
                    {list.map((it) => (
                      <Row
                        key={`${it.key}-${it.volume.isbn13}`}
                        item={it}
                        added={added.has(it.volume.isbn13)}
                        busy={addItem.isPending}
                        onAdd={() => void addToWishlist(it.volume.isbn13)}
                      />
                    ))}
                  </YStack>
                ))}
              </YStack>
            ) : null}

            {data && data.skippedSeries > 0 ? (
              <Text fontFamily="$body" fontSize={12} color="$colorMuted">
                {`${data.scannedSeries} séries analysées (les plus fournies). ${data.skippedSeries} de plus non analysées.`}
              </Text>
            ) : null}
          </YStack>
        )}
      </ScrollView>
    </YStack>
  );
}

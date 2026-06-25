import { ScrollView, useWindowDimensions } from 'react-native';
import { Spinner, Text, XStack, YStack } from 'tamagui';

import { Screen } from '@/components/Screen';
import { type TrendEntry, useTrends } from '@/features/trends/use-trends';

function Label({ children }: { children: string }) {
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

function BarList({ entries }: { entries: TrendEntry[] }) {
  const max = Math.max(1, ...entries.map((e) => e.count));
  return (
    <YStack gap="$3">
      {entries.map((e) => (
        <YStack key={e.label} gap="$1">
          <XStack justifyContent="space-between" alignItems="baseline">
            <Text fontFamily="$body" fontSize={14} color="$color" numberOfLines={1} flex={1}>
              {e.label}
            </Text>
            <Text fontFamily="$body" fontSize={13} color="$colorMuted" marginLeft="$2">
              {e.count}
            </Text>
          </XStack>
          <YStack height={4} borderRadius={999} backgroundColor="$track" overflow="hidden">
            <YStack height={4} width={`${(e.count / max) * 100}%`} backgroundColor="$accent" />
          </YStack>
        </YStack>
      ))}
    </YStack>
  );
}

export default function TrendsScreen() {
  const { data, isLoading } = useTrends();
  const { width } = useWindowDimensions();
  const padH = Math.max(20, (width - 900) / 2);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingHorizontal: padH, paddingTop: 20, paddingBottom: 40 }}>
        <YStack gap="$1" marginBottom="$5">
          <Label>Tendances</Label>
          <Text fontFamily="$heading" fontSize={26} fontWeight="500" color="$color">
            Ce que lit la communauté
          </Text>
        </YStack>

        {isLoading || !data ? (
          <YStack alignItems="center" paddingVertical="$8">
            <Spinner color="$accent" size="large" />
          </YStack>
        ) : (
          <YStack gap="$7">
            <XStack
              backgroundColor="$backgroundStrong"
              borderColor="$borderColor"
              borderWidth={1}
              borderRadius={2}
              paddingVertical="$4"
            >
              <YStack flex={1} alignItems="center" gap="$1">
                <Text fontFamily="$heading" fontSize={26} fontWeight="500" color="$color">
                  {data.readers}
                </Text>
                <Text fontFamily="$body" fontSize={12} color="$colorMuted">
                  Lecteur{data.readers > 1 ? 's' : ''}
                </Text>
              </YStack>
              <YStack width={1} backgroundColor="$borderColor" />
              <YStack flex={1} alignItems="center" gap="$1">
                <Text fontFamily="$heading" fontSize={26} fontWeight="500" color="$color">
                  {data.books}
                </Text>
                <Text fontFamily="$body" fontSize={12} color="$colorMuted">
                  Livres référencés
                </Text>
              </YStack>
            </XStack>

            {data.genres.length > 0 ? (
              <YStack gap="$3">
                <Label>Genres les plus lus</Label>
                <BarList entries={data.genres} />
              </YStack>
            ) : null}

            {data.authors.length > 0 ? (
              <YStack gap="$3">
                <Label>Auteurs les plus présents</Label>
                <BarList entries={data.authors} />
              </YStack>
            ) : null}

            {data.genres.length === 0 && data.authors.length === 0 ? (
              <Text fontFamily="$body" fontSize={14} color="$colorMuted" lineHeight={21}>
                Les tendances apparaîtront dès que la communauté aura ajouté des livres.
              </Text>
            ) : null}
          </YStack>
        )}
      </ScrollView>
    </Screen>
  );
}

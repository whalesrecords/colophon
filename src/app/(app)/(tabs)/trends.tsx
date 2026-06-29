import { ScrollView, useWindowDimensions } from 'react-native';
import { Spinner, Text, YStack } from 'tamagui';

import { Screen } from '@/components/Screen';
import { BarList, KPIRow, KPITile, SectionLabel } from '@/components/ui';
import { useTrends } from '@/features/trends/use-trends';

const fmt = (n: number) => n.toLocaleString('fr-FR');

export default function TrendsScreen() {
  const { data, isLoading } = useTrends();
  const { width } = useWindowDimensions();
  const padH = Math.max(20, (width - 900) / 2);

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: padH, paddingTop: 20, paddingBottom: 40 }}
      >
        <YStack gap="$1" marginBottom="$5">
          <SectionLabel>Tendances</SectionLabel>
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
            <KPIRow>
              <KPITile
                value={fmt(data.readers)}
                label={data.readers > 1 ? 'Lecteurs' : 'Lecteur'}
              />
              <KPITile value={fmt(data.books)} label="Livres référencés" />
              <KPITile value={fmt(data.genres.length)} label="Genres" />
            </KPIRow>

            {data.genres.length > 0 ? (
              <YStack gap="$3">
                <SectionLabel>Genres les plus lus</SectionLabel>
                <BarList entries={data.genres} collapse={3} />
              </YStack>
            ) : null}

            {data.authors.length > 0 ? (
              <YStack gap="$3">
                <SectionLabel>Auteurs les plus présents</SectionLabel>
                <BarList entries={data.authors} collapse={3} />
              </YStack>
            ) : null}

            {data.tags.length > 0 ? (
              <YStack gap="$3">
                <SectionLabel>Tags les plus utilisés</SectionLabel>
                <BarList
                  entries={data.tags.map((t) => ({ label: `#${t.label}`, count: t.count }))}
                  collapse={3}
                />
              </YStack>
            ) : null}

            {data.genres.length === 0 && data.authors.length === 0 && data.tags.length === 0 ? (
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

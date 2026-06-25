import { ScrollView } from 'react-native';
import { Button, Spinner, Text, XStack, YStack } from 'tamagui';

import { Screen } from '@/components/Screen';
import { useAuth } from '@/features/auth/auth-context';
import { type LibraryStats, useStats } from '@/features/stats/use-stats';
import { type ReadingStatus, statusColors } from '@/theme/tokens';

const STATUS_LABELS: Record<ReadingStatus, string> = {
  to_read: 'À lire',
  reading: 'En cours',
  read: 'Lu',
  abandoned: 'Abandonné',
};

const STATUS_ORDER: ReadingStatus[] = ['reading', 'read', 'to_read', 'abandoned'];

function formatCount(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    return `${k >= 10 ? Math.round(k) : k.toFixed(1).replace(/\.0$/, '')}k`;
  }
  return String(n);
}

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

function StatBig({ value, label }: { value: string; label: string }) {
  return (
    <YStack flex={1} alignItems="center" gap="$1">
      <Text fontFamily="$heading" fontSize={30} fontWeight="500" color="$color">
        {value}
      </Text>
      <Text fontFamily="$body" fontSize={12} color="$colorMuted">
        {label}
      </Text>
    </YStack>
  );
}

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
  const { data: stats, isLoading } = useStats(session?.user.id);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <YStack gap="$1" marginBottom="$5">
          <Label>Profil</Label>
          <Text fontFamily="$heading" fontSize={26} fontWeight="500" color="$color" numberOfLines={1}>
            {session?.user.email ?? 'Lecteur'}
          </Text>
        </YStack>

        {isLoading || !stats ? (
          <YStack alignItems="center" justifyContent="center" paddingVertical="$8">
            <Spinner color="$accent" size="large" />
          </YStack>
        ) : (
          <Stats stats={stats} />
        )}

        <Button
          marginTop="$8"
          onPress={signOut}
          backgroundColor="$backgroundStrong"
          borderColor="$borderColor"
          borderWidth={1}
          color="$color"
          borderRadius={2}
          height={48}
          fontFamily="$body"
          fontWeight="600"
          pressStyle={{ opacity: 0.85 }}
        >
          Se déconnecter
        </Button>
      </ScrollView>
    </Screen>
  );
}

function Stats({ stats }: { stats: LibraryStats }) {
  return (
    <YStack gap="$5">
      <XStack
        backgroundColor="$backgroundStrong"
        borderColor="$borderColor"
        borderWidth={1}
        borderRadius={2}
        paddingVertical="$5"
      >
        <StatBig value={formatCount(stats.total)} label={stats.total > 1 ? 'Livres' : 'Livre'} />
        <YStack width={1} backgroundColor="$borderColor" />
        <StatBig value={formatCount(stats.readThisYear)} label={`Lus en ${stats.year}`} />
        <YStack width={1} backgroundColor="$borderColor" />
        <StatBig value={formatCount(stats.pagesRead)} label="Pages lues" />
      </XStack>

      <YStack gap="$3">
        <Label>Par statut</Label>
        <YStack gap="$2">
          {STATUS_ORDER.map((status) => (
            <XStack key={status} alignItems="center" gap="$3">
              <YStack
                width={10}
                height={10}
                borderRadius={999}
                backgroundColor={statusColors[status].dot}
              />
              <Text fontFamily="$body" fontSize={15} color="$colorSoft" flex={1}>
                {STATUS_LABELS[status]}
              </Text>
              <Text
                fontFamily="$body"
                fontSize={15}
                fontWeight="600"
                color="$color"
                fontVariant={['tabular-nums']}
              >
                {stats.byStatus[status]}
              </Text>
            </XStack>
          ))}
        </YStack>
      </YStack>

      <XStack justifyContent="space-between" alignItems="center">
        <Text fontFamily="$body" fontSize={15} color="$colorSoft">
          Auteurs différents
        </Text>
        <Text fontFamily="$body" fontSize={15} fontWeight="600" color="$color">
          {stats.authors}
        </Text>
      </XStack>

      <Text fontFamily="$body" fontSize={13} color="$colorMuted" lineHeight={20}>
        Définissez un objectif de lecture annuel et suivez votre temps de lecture — bientôt.
      </Text>
    </YStack>
  );
}

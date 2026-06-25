import { useState } from 'react';
import { Alert, Platform, ScrollView, Share as RNShare } from 'react-native';
import { Button, Spinner, Text, XStack, YStack } from 'tamagui';

import { Screen } from '@/components/Screen';
import { useDeleteAccount } from '@/features/account/use-delete-account';
import { useAuth } from '@/features/auth/auth-context';
import { shareUrl, useCreateShare } from '@/features/sharing/use-share';
import { type LibraryStats, useStats } from '@/features/stats/use-stats';
import { palette, type ReadingStatus, statusColors } from '@/theme/tokens';

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

        <ShareSection userId={session?.user.id} />

        <Button
          marginTop="$6"
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

        <DangerZone onSignedOut={signOut} />

        <Text
          fontFamily="$body"
          fontSize={11}
          color="$colorMuted"
          textAlign="center"
          marginTop="$8"
        >
          Colophon · votre bibliothèque, vos lectures
        </Text>
      </ScrollView>
    </Screen>
  );
}

function DangerZone({ onSignedOut }: { onSignedOut: () => void }) {
  const deleteAccount = useDeleteAccount();

  const confirmDelete = () => {
    const proceed = async () => {
      try {
        await deleteAccount.mutateAsync();
        onSignedOut();
      } catch {
        // error surfaced below
      }
    };
    const message =
      'Cette action est définitive : votre bibliothèque, vos fiches, étagères et cercles seront supprimés.';
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`${message}\n\nSupprimer le compte ?`)) {
        void proceed();
      }
    } else {
      Alert.alert('Supprimer le compte', message, [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => void proceed() },
      ]);
    }
  };

  return (
    <YStack gap="$2" marginTop="$8">
      <Label>Compte</Label>
      <Button
        onPress={confirmDelete}
        disabled={deleteAccount.isPending}
        backgroundColor="transparent"
        borderColor="$signal"
        borderWidth={1}
        color="$signal"
        borderRadius={2}
        height={46}
        fontFamily="$body"
        fontWeight="600"
        pressStyle={{ opacity: 0.85 }}
      >
        {deleteAccount.isPending ? 'Suppression…' : 'Supprimer mon compte'}
      </Button>
      {deleteAccount.isError ? (
        <Text fontFamily="$body" fontSize={13} color="$signal">
          {(deleteAccount.error as Error).message}
        </Text>
      ) : null}
    </YStack>
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

function ShareSection({ userId }: { userId: string | undefined }) {
  const createShare = useCreateShare(userId);
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const onCreate = async () => {
    try {
      const share = await createShare.mutateAsync({ scope: 'library' });
      setUrl(shareUrl(share.token));
      setCopied(false);
    } catch {
      // ignore
    }
  };

  const onShare = async () => {
    if (!url) return;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
      } catch {
        // ignore
      }
    } else {
      RNShare.share({ message: url }).catch(() => undefined);
    }
  };

  return (
    <YStack gap="$2" marginTop="$6">
      <Label>Partage</Label>
      {url ? (
        <YStack gap="$2">
          <Text
            fontFamily="$body"
            fontSize={13}
            color="$accent"
            numberOfLines={2}
            backgroundColor="$backgroundStrong"
            borderColor="$borderColor"
            borderWidth={1}
            borderRadius={2}
            padding="$3"
          >
            {url}
          </Text>
          <Button
            onPress={onShare}
            backgroundColor="$accent"
            color={palette.paper}
            borderRadius={2}
            height={46}
            fontFamily="$body"
            fontWeight="600"
          >
            {copied ? 'Lien copié ✓' : Platform.OS === 'web' ? 'Copier le lien' : 'Partager le lien'}
          </Button>
        </YStack>
      ) : (
        <Button
          onPress={onCreate}
          disabled={createShare.isPending}
          backgroundColor="$backgroundStrong"
          borderColor="$borderColor"
          borderWidth={1}
          color="$color"
          borderRadius={2}
          height={48}
          fontFamily="$body"
          fontWeight="600"
        >
          Créer un lien public de ma bibliothèque
        </Button>
      )}
      <Text fontFamily="$body" fontSize={12} color="$colorMuted" lineHeight={18}>
        Lecture seule. Toute personne disposant du lien voit vos livres (sans vos notes ni vos
        achats).
      </Text>
    </YStack>
  );
}

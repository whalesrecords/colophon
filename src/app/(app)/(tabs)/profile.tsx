import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Share as RNShare,
  useWindowDimensions,
} from 'react-native';
import { Button, Spinner, Text, XStack, YStack } from 'tamagui';

import { displayValue } from '@/components/library/FilterPanel';
import { Screen } from '@/components/Screen';
import { useDeleteAccount } from '@/features/account/use-delete-account';
import { useAuth } from '@/features/auth/auth-context';
import { duplicateGroups } from '@/features/library/duplicates';
import { computeFacets, EMPTY_FILTERS, type FacetKey } from '@/features/library/faceting';
import { type LibraryItem, useLibrary } from '@/features/library/use-library';
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
  const { data: libraryItems } = useLibrary(session?.user.id);
  const items = libraryItems ?? [];
  const { width } = useWindowDimensions();
  const padH = Math.max(20, (width - 900) / 2);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingHorizontal: padH, paddingTop: 20, paddingBottom: 40 }}>
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

        {items.length > 0 ? <ClassificationSection items={items} /> : null}
        {items.length > 0 ? <LoansSection items={items} /> : null}
        {items.length > 0 ? <DuplicatesSection items={items} /> : null}

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

const CLASS_FACETS: { key: FacetKey; label: string }[] = [
  { key: 'genre', label: 'Genres' },
  { key: 'shelf', label: 'Étagères' },
  { key: 'tag', label: 'Tags' },
  { key: 'decade', label: 'Décennies' },
  { key: 'language', label: 'Langues' },
];

function BarList({ entries }: { entries: { label: string; count: number }[] }) {
  const max = Math.max(1, ...entries.map((e) => e.count));
  return (
    <YStack gap="$2">
      {entries.map((e) => (
        <YStack key={e.label} gap={4}>
          <XStack justifyContent="space-between" alignItems="baseline">
            <Text fontFamily="$body" fontSize={13} color="$color" numberOfLines={1} flex={1}>
              {e.label}
            </Text>
            <Text fontFamily="$body" fontSize={12} color="$colorMuted" marginLeft="$2">
              {e.count}
            </Text>
          </XStack>
          <YStack height={3} borderRadius={999} backgroundColor="$track" overflow="hidden">
            <YStack height={3} width={`${(e.count / max) * 100}%`} backgroundColor="$accent" />
          </YStack>
        </YStack>
      ))}
    </YStack>
  );
}

/** Classify the library by facet (genres, shelves, tags, decades…) on the dashboard. */
function ClassificationSection({ items }: { items: LibraryItem[] }) {
  const facets = useMemo(() => computeFacets(items, EMPTY_FILTERS), [items]);
  const shown = CLASS_FACETS.filter((f) => facets[f.key].length > 0);
  if (shown.length === 0) return null;
  return (
    <YStack gap="$5" marginTop="$7">
      <Label>Classement</Label>
      {shown.map((f) => (
        <YStack key={f.key} gap="$2">
          <Text fontFamily="$heading" fontSize={16} fontStyle="italic" color="$colorSoft">
            {f.label}
          </Text>
          <BarList
            entries={facets[f.key]
              .slice(0, 6)
              .map((v) => ({ label: displayValue(f.key, v.value), count: v.count }))}
          />
        </YStack>
      ))}
    </YStack>
  );
}

function LoansSection({ items }: { items: LibraryItem[] }) {
  const router = useRouter();
  const lent = useMemo(() => items.filter((i) => i.lentTo), [items]);
  if (lent.length === 0) return null;
  return (
    <YStack gap="$3" marginTop="$7">
      <Label>Prêtés</Label>
      <Text fontFamily="$body" fontSize={13} color="$colorMuted">
        {`${lent.length} livre${lent.length > 1 ? 's' : ''} actuellement prêté${lent.length > 1 ? 's' : ''}`}
      </Text>
      <YStack gap="$2">
        {lent.map((i) => (
          <Pressable key={i.id} onPress={() => router.push(`/book/${i.id}`)}>
            <XStack
              alignItems="center"
              gap="$2"
              padding="$3"
              backgroundColor="$backgroundStrong"
              borderColor="$borderColor"
              borderWidth={1}
              borderRadius={2}
            >
              <YStack flex={1} gap={2}>
                <Text fontFamily="$heading" fontSize={15} color="$color" numberOfLines={1}>
                  {i.book?.title ?? 'Sans titre'}
                </Text>
                <Text fontFamily="$body" fontSize={12} color="$colorMuted" numberOfLines={1}>
                  {`Prêté à ${i.lentTo}`}
                </Text>
              </YStack>
              <XStack
                backgroundColor={palette.ochre}
                borderRadius={999}
                paddingHorizontal={8}
                height={20}
                alignItems="center"
              >
                <Text fontFamily="$body" fontSize={11} fontWeight="700" color={palette.paper}>
                  Prêté
                </Text>
              </XStack>
            </XStack>
          </Pressable>
        ))}
      </YStack>
    </YStack>
  );
}

function DuplicatesSection({ items }: { items: LibraryItem[] }) {
  const router = useRouter();
  const groups = useMemo(() => duplicateGroups(items), [items]);
  if (groups.length === 0) return null;
  const total = groups.reduce((n, g) => n + (g.count - 1), 0);
  return (
    <YStack gap="$3" marginTop="$7">
      <Label>Doublons</Label>
      <Text fontFamily="$body" fontSize={13} color="$colorMuted">
        {`${groups.length} titre${groups.length > 1 ? 's' : ''} en plusieurs exemplaires · ${total} de trop`}
      </Text>
      <YStack gap="$2">
        {groups.map((g) => (
          <Pressable key={g.isbn13} onPress={() => router.push(`/book/${g.ids[0]}`)}>
            <XStack
              alignItems="center"
              gap="$2"
              padding="$3"
              backgroundColor="$backgroundStrong"
              borderColor="$borderColor"
              borderWidth={1}
              borderRadius={2}
            >
              <YStack flex={1} gap={2}>
                <Text fontFamily="$heading" fontSize={15} color="$color" numberOfLines={1}>
                  {g.title}
                </Text>
                {g.author ? (
                  <Text fontFamily="$body" fontSize={12} color="$colorMuted" numberOfLines={1}>
                    {g.author}
                  </Text>
                ) : null}
              </YStack>
              <XStack
                backgroundColor={palette.terracotta}
                borderRadius={999}
                paddingHorizontal={8}
                height={20}
                alignItems="center"
              >
                <Text fontFamily="$body" fontSize={11} fontWeight="700" color={palette.paper}>
                  {`× ${g.count}`}
                </Text>
              </XStack>
            </XStack>
          </Pressable>
        ))}
      </YStack>
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

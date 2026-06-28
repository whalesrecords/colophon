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
import { Button, Input, Spinner, Text, XStack, YStack } from 'tamagui';

import { displayValue } from '@/components/library/FilterPanel';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { YearRecap } from '@/components/profile/YearRecap';
import { useLanguishing } from '@/features/reading/use-languishing';
import { Screen } from '@/components/Screen';
import { useDeleteAccount } from '@/features/account/use-delete-account';
import { useAuth } from '@/features/auth/auth-context';
import { useProfile, useUpdateProfile } from '@/features/profile/use-profile';
import { duplicateGroups } from '@/features/library/duplicates';
import { downloadCsv, toLibraryCsv } from '@/features/library/export-csv';
import { computeFacets, EMPTY_FILTERS, type FacetKey } from '@/features/library/faceting';
import { type ShelfSuggestion, suggestShelves } from '@/features/library/suggest-shelves';
import { type LibraryItem, useLibrary } from '@/features/library/use-library';
import { useShelfActions, useShelves } from '@/features/shelves/use-shelves';
import { shareUrl, useCreateShare } from '@/features/sharing/use-share';
import { type LibraryStats, useStats } from '@/features/stats/use-stats';
import { LOCALES, type TranslationKey, useT } from '@/i18n';
import { THEME_OPTIONS, useThemePref } from '@/theme/theme-pref';
import { palette, type ReadingStatus, statusColors } from '@/theme/tokens';

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
  const { t } = useT();
  const { data: stats, isLoading } = useStats(session?.user.id);
  const { data: libraryItems } = useLibrary(session?.user.id);
  const items = libraryItems ?? [];
  const [recapOpen, setRecapOpen] = useState(false);
  const { width } = useWindowDimensions();
  const padH = Math.max(20, (width - 900) / 2);

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: padH, paddingTop: 20, paddingBottom: 40 }}
      >
        <ProfileHeader userId={session?.user.id} email={session?.user.email} />

        {isLoading || !stats ? (
          <YStack alignItems="center" justifyContent="center" paddingVertical="$8">
            <Spinner color="$accent" size="large" />
          </YStack>
        ) : (
          <Stats stats={stats} />
        )}

        {stats ? (
          <GoalSection
            userId={session?.user.id}
            readThisYear={stats.readThisYear}
            year={stats.year}
          />
        ) : null}

        {stats && stats.readThisYear > 0 ? (
          <Button
            onPress={() => setRecapOpen(true)}
            marginTop="$5"
            backgroundColor="$backgroundStrong"
            borderColor="$borderColor"
            borderWidth={1}
            color="$color"
            borderRadius={12}
            height={48}
            fontFamily="$body"
            fontWeight="600"
            pressStyle={{ opacity: 0.85 }}
          >
            {t('recap.open', { year: stats.year })}
          </Button>
        ) : null}

        {items.length > 0 ? <ClassificationSection items={items} /> : null}
        {items.length > 0 ? (
          <SuggestedShelvesSection items={items} userId={session?.user.id} />
        ) : null}
        {items.length > 0 ? <LoansSection items={items} /> : null}
        <LanguishingSection userId={session?.user.id} />
        {items.length > 0 ? <DuplicatesSection items={items} /> : null}

        <ShareSection userId={session?.user.id} />

        <ExportSection items={items} />

        <AppearanceSection />

        <LanguageSection />

        <Button
          marginTop="$6"
          onPress={signOut}
          backgroundColor="$backgroundStrong"
          borderColor="$borderColor"
          borderWidth={1}
          color="$color"
          borderRadius={12}
          height={48}
          fontFamily="$body"
          fontWeight="600"
          pressStyle={{ opacity: 0.85 }}
        >
          {t('profile.signOut')}
        </Button>

        <DangerZone onSignedOut={signOut} />

        <Text
          fontFamily="$body"
          fontSize={11}
          color="$colorMuted"
          textAlign="center"
          marginTop="$8"
        >
          {t('profile.footer')}
        </Text>
      </ScrollView>

      {recapOpen && stats ? (
        <YearRecap
          userId={session?.user.id}
          year={stats.year}
          onClose={() => setRecapOpen(false)}
        />
      ) : null}
    </Screen>
  );
}

const GOAL_PRESETS = [12, 24, 36, 52];

function GoalSection({
  userId,
  readThisYear,
  year,
}: {
  userId: string | undefined;
  readThisYear: number;
  year: number;
}) {
  const { t } = useT();
  const { data: profile } = useProfile(userId);
  const update = useUpdateProfile(userId);
  const [editing, setEditing] = useState(false);
  const [custom, setCustom] = useState('');

  const goal = profile?.annual_goal ?? null;
  const save = (n: number) => {
    if (!Number.isFinite(n) || n <= 0) return;
    update.mutate({ annual_goal: Math.min(1000, Math.round(n)) });
    setEditing(false);
    setCustom('');
  };

  return (
    <YStack gap="$3" marginTop="$7">
      <Label>{t('goal.title')}</Label>
      {goal && !editing ? (
        <YStack gap="$2">
          <Text fontFamily="$body" fontSize={15} color="$colorSoft">
            {readThisYear >= goal
              ? t('goal.done')
              : t('goal.progress', { done: readThisYear, target: goal, year })}
          </Text>
          <YStack height={6} borderRadius={999} backgroundColor="$track" overflow="hidden">
            <YStack
              height={6}
              width={`${Math.min(100, Math.round((readThisYear / goal) * 100))}%`}
              backgroundColor="$accent"
            />
          </YStack>
          <XStack gap="$4">
            <Button
              onPress={() => setEditing(true)}
              chromeless
              height={30}
              paddingHorizontal={0}
              color="$accent"
              fontFamily="$body"
              fontSize={14}
              fontWeight="600"
            >
              {t('goal.edit')}
            </Button>
            <Button
              onPress={() => update.mutate({ annual_goal: null })}
              chromeless
              height={30}
              paddingHorizontal={0}
              color="$colorMuted"
              fontFamily="$body"
              fontSize={14}
            >
              {t('goal.remove')}
            </Button>
          </XStack>
        </YStack>
      ) : (
        <YStack gap="$2">
          <Text fontFamily="$body" fontSize={13} color="$colorMuted">
            {t('goal.hint')}
          </Text>
          <XStack gap="$2" flexWrap="wrap">
            {GOAL_PRESETS.map((n) => (
              <Button
                key={n}
                onPress={() => save(n)}
                height={40}
                paddingHorizontal="$4"
                borderRadius={999}
                borderWidth={1}
                borderColor={goal === n ? '$accent' : '$borderColor'}
                backgroundColor={goal === n ? '$accent' : 'transparent'}
                color={goal === n ? palette.paper : '$colorSoft'}
                fontFamily="$body"
                fontWeight="600"
              >
                {String(n)}
              </Button>
            ))}
          </XStack>
          <XStack gap="$2">
            <Input
              flex={1}
              value={custom}
              onChangeText={setCustom}
              keyboardType="number-pad"
              inputMode="numeric"
              placeholder={t('goal.custom')}
              placeholderTextColor="$concreteLight"
              backgroundColor="$backgroundStrong"
              borderColor="$borderColor"
              borderWidth={1}
              borderRadius={12}
              height={44}
              paddingHorizontal="$3"
              fontFamily="$body"
              fontSize={15}
              color="$color"
            />
            <Button
              onPress={() => save(Number.parseInt(custom, 10))}
              disabled={!custom.trim()}
              backgroundColor="$accent"
              color={palette.paper}
              borderRadius={12}
              height={44}
              paddingHorizontal="$4"
              fontFamily="$body"
              fontWeight="600"
              opacity={custom.trim() ? 1 : 0.6}
            >
              {t('goal.save')}
            </Button>
          </XStack>
        </YStack>
      )}
    </YStack>
  );
}

function AppearanceSection() {
  const { t } = useT();
  const { pref, setPref } = useThemePref();
  return (
    <YStack gap="$2" marginTop="$6">
      <Label>{t('settings.appearance')}</Label>
      <XStack gap="$2">
        {THEME_OPTIONS.map((opt) => {
          const active = opt === pref;
          return (
            <Button
              key={opt}
              onPress={() => setPref(opt)}
              flex={1}
              height={44}
              borderRadius={12}
              borderWidth={1}
              borderColor={active ? '$accent' : '$borderColor'}
              backgroundColor={active ? '$accent' : 'transparent'}
              color={active ? palette.paper : '$color'}
              fontFamily="$body"
              fontWeight="600"
              fontSize={14}
              pressStyle={{ opacity: 0.85 }}
            >
              {t(`theme.${opt}`)}
            </Button>
          );
        })}
      </XStack>
    </YStack>
  );
}

function LanguageSection() {
  const { locale, setLocale, t } = useT();
  return (
    <YStack gap="$2" marginTop="$6">
      <Label>{t('settings.language')}</Label>
      <XStack gap="$2">
        {LOCALES.map((l) => {
          const active = l.code === locale;
          return (
            <Button
              key={l.code}
              onPress={() => setLocale(l.code)}
              flex={1}
              height={44}
              borderRadius={12}
              borderWidth={1}
              borderColor={active ? '$accent' : '$borderColor'}
              backgroundColor={active ? '$accent' : 'transparent'}
              color={active ? palette.paper : '$color'}
              fontFamily="$body"
              fontWeight="600"
              pressStyle={{ opacity: 0.85 }}
            >
              {l.label}
            </Button>
          );
        })}
      </XStack>
      <Text fontFamily="$body" fontSize={12} color="$colorMuted" lineHeight={18}>
        {t('settings.languageHint')}
      </Text>
    </YStack>
  );
}

function DangerZone({ onSignedOut }: { onSignedOut: () => void }) {
  const deleteAccount = useDeleteAccount();
  const { t } = useT();

  const confirmDelete = () => {
    const proceed = async () => {
      try {
        await deleteAccount.mutateAsync();
        onSignedOut();
      } catch {
        // error surfaced below
      }
    };
    const message = t('profile.deleteConfirmBody');
    if (Platform.OS === 'web') {
      if (
        typeof window !== 'undefined' &&
        window.confirm(`${message}\n\n${t('profile.deleteConfirmAsk')}`)
      ) {
        void proceed();
      }
    } else {
      Alert.alert(t('profile.deleteConfirmTitle'), message, [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.delete'), style: 'destructive', onPress: () => void proceed() },
      ]);
    }
  };

  return (
    <YStack gap="$2" marginTop="$8">
      <Label>{t('profile.account')}</Label>
      <Button
        onPress={confirmDelete}
        disabled={deleteAccount.isPending}
        backgroundColor="transparent"
        borderColor="$signal"
        borderWidth={1}
        color="$signal"
        borderRadius={12}
        height={46}
        fontFamily="$body"
        fontWeight="600"
        pressStyle={{ opacity: 0.85 }}
      >
        {deleteAccount.isPending ? t('profile.deleting') : t('profile.deleteAccount')}
      </Button>
      {deleteAccount.isError ? (
        <Text fontFamily="$body" fontSize={13} color="$signal">
          {(deleteAccount.error as Error).message}
        </Text>
      ) : null}
    </YStack>
  );
}

function euro(n: number): string {
  return n.toLocaleString('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: n % 1 === 0 ? 0 : 2,
  });
}

function Stats({ stats }: { stats: LibraryStats }) {
  const { t } = useT();
  return (
    <YStack gap="$5">
      <XStack
        backgroundColor="$backgroundStrong"
        borderColor="$borderColor"
        borderWidth={1}
        borderRadius={12}
        paddingVertical="$5"
      >
        <StatBig
          value={formatCount(stats.total)}
          label={stats.total > 1 ? t('profile.books') : t('profile.book')}
        />
        <YStack width={1} backgroundColor="$borderColor" />
        <StatBig
          value={formatCount(stats.readThisYear)}
          label={t('profile.readInYear', { year: stats.year })}
        />
        <YStack width={1} backgroundColor="$borderColor" />
        <StatBig value={formatCount(stats.pagesRead)} label={t('profile.pagesRead')} />
      </XStack>

      {stats.pricedCount > 0 || stats.acquiredThisYear > 0 ? (
        <YStack gap="$3">
          <Label>Collection</Label>
          <XStack
            backgroundColor="$backgroundStrong"
            borderColor="$borderColor"
            borderWidth={1}
            borderRadius={12}
            paddingVertical="$5"
          >
            <StatBig
              value={euro(stats.collectionValue)}
              label={
                stats.pricedCount < stats.total
                  ? `Valeur · ${stats.pricedCount} chiffrés`
                  : 'Valeur estimée'
              }
            />
            <YStack width={1} backgroundColor="$borderColor" />
            <StatBig
              value={formatCount(stats.acquiredThisYear)}
              label={`Achetés en ${stats.year}`}
            />
            <YStack width={1} backgroundColor="$borderColor" />
            <StatBig value={euro(stats.spentThisYear)} label={`Dépensé en ${stats.year}`} />
          </XStack>
        </YStack>
      ) : null}

      <YStack gap="$3">
        <Label>{t('profile.byStatus')}</Label>
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
                {t(`status.${status}`)}
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
          {t('profile.differentAuthors')}
        </Text>
        <Text fontFamily="$body" fontSize={15} fontWeight="600" color="$color">
          {stats.authors}
        </Text>
      </XStack>

      <Text fontFamily="$body" fontSize={13} color="$colorMuted" lineHeight={20}>
        {t('profile.goalHint')}
      </Text>
    </YStack>
  );
}

const CLASS_FACETS: { key: FacetKey; labelKey: TranslationKey }[] = [
  { key: 'genre', labelKey: 'facet.genre' },
  { key: 'shelf', labelKey: 'facet.shelf' },
  { key: 'tag', labelKey: 'facet.tag' },
  { key: 'decade', labelKey: 'facet.decade' },
  { key: 'language', labelKey: 'facet.language' },
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
  const { t } = useT();
  const facets = useMemo(() => computeFacets(items, EMPTY_FILTERS), [items]);
  const shown = CLASS_FACETS.filter((f) => facets[f.key].length > 0);
  if (shown.length === 0) return null;
  return (
    <YStack gap="$5" marginTop="$7">
      <Label>{t('profile.classification')}</Label>
      {shown.map((f) => (
        <YStack key={f.key} gap="$2">
          <Text fontFamily="$heading" fontSize={16} fontStyle="italic" color="$colorSoft">
            {t(f.labelKey)}
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

function SuggestedShelvesSection({
  items,
  userId,
}: {
  items: LibraryItem[];
  userId: string | undefined;
}) {
  const { t } = useT();
  const { data: shelves } = useShelves(userId);
  const { createShelf, addToShelf } = useShelfActions(userId);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);

  const suggestions = useMemo(
    () =>
      suggestShelves(
        items,
        (shelves ?? []).map((s) => s.name),
      ).filter((s) => !done.has(s.key)),
    [items, shelves, done],
  );
  if (suggestions.length === 0) return null;

  const onCreate = async (s: ShelfSuggestion) => {
    setBusy(s.key);
    try {
      const shelf = await createShelf.mutateAsync(s.label);
      for (const id of s.itemIds) await addToShelf.mutateAsync({ itemId: id, shelfId: shelf.id });
      setDone((d) => new Set(d).add(s.key));
    } catch {
      // ignore
    } finally {
      setBusy(null);
    }
  };

  return (
    <YStack gap="$3" marginTop="$7">
      <Label>{t('profile.suggestedShelves')}</Label>
      <Text fontFamily="$body" fontSize={13} color="$colorMuted" lineHeight={19}>
        {t('profile.suggestedShelvesHint')}
      </Text>
      <XStack gap="$2" flexWrap="wrap">
        {suggestions.map((s) => (
          <Button
            key={s.key}
            onPress={() => onCreate(s)}
            disabled={busy !== null}
            height={36}
            paddingHorizontal="$3"
            borderRadius={999}
            borderWidth={1}
            borderColor="$borderColor"
            backgroundColor="transparent"
            color="$colorSoft"
            fontFamily="$body"
            fontSize={13}
            fontWeight="500"
            opacity={busy === s.key ? 0.5 : 1}
          >
            {`+ ${s.label} · ${s.count}`}
          </Button>
        ))}
      </XStack>
    </YStack>
  );
}

function LoansSection({ items }: { items: LibraryItem[] }) {
  const router = useRouter();
  const { t } = useT();
  const lent = useMemo(() => items.filter((i) => i.lentTo && i.ownership === 'owned'), [items]);
  if (lent.length === 0) return null;
  return (
    <YStack gap="$3" marginTop="$7">
      <Label>{t('profile.loans')}</Label>
      <Text fontFamily="$body" fontSize={13} color="$colorMuted">
        {lent.length === 1 ? t('profile.loansOne') : t('profile.loansMany', { count: lent.length })}
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
              borderRadius={12}
            >
              <YStack flex={1} gap={2}>
                <Text fontFamily="$heading" fontSize={15} color="$color" numberOfLines={1}>
                  {i.book?.title ?? 'Sans titre'}
                </Text>
                <Text fontFamily="$body" fontSize={12} color="$colorMuted" numberOfLines={1}>
                  {t('profile.lentTo', { name: i.lentTo ?? '' })}
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
                  {t('profile.badgeLent')}
                </Text>
              </XStack>
            </XStack>
          </Pressable>
        ))}
      </YStack>
    </YStack>
  );
}

function LanguishingSection({ userId }: { userId: string | undefined }) {
  const router = useRouter();
  const { data: stuck } = useLanguishing(userId);
  if (!stuck || stuck.length === 0) return null;
  const duration = (days: number) =>
    days >= 60 ? `depuis ${Math.round(days / 30)} mois` : `depuis ${days} j`;
  return (
    <YStack gap="$3" marginTop="$7">
      <Label>Ça traîne</Label>
      <Text fontFamily="$body" fontSize={13} color="$colorMuted">
        {stuck.length === 1
          ? '1 lecture commencée il y a longtemps, jamais terminée'
          : `${stuck.length} lectures commencées il y a longtemps, jamais terminées`}
      </Text>
      <YStack gap="$2">
        {stuck.map((b) => (
          <Pressable key={b.itemId} onPress={() => router.push(`/book/${b.itemId}`)}>
            <XStack
              alignItems="center"
              gap="$2"
              padding="$3"
              backgroundColor="$backgroundStrong"
              borderColor="$borderColor"
              borderWidth={1}
              borderRadius={12}
            >
              <Text fontFamily="$heading" fontSize={15} color="$color" flex={1} numberOfLines={1}>
                {b.title}
              </Text>
              <XStack
                backgroundColor={palette.terracotta}
                borderRadius={999}
                paddingHorizontal={8}
                height={20}
                alignItems="center"
              >
                <Text fontFamily="$body" fontSize={11} fontWeight="700" color={palette.paper}>
                  {duration(b.days)}
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
  const { t } = useT();
  const groups = useMemo(
    () => duplicateGroups(items.filter((i) => i.ownership === 'owned')),
    [items],
  );
  if (groups.length === 0) return null;
  const total = groups.reduce((n, g) => n + (g.count - 1), 0);
  return (
    <YStack gap="$3" marginTop="$7">
      <Label>{t('profile.duplicates')}</Label>
      <Text fontFamily="$body" fontSize={13} color="$colorMuted">
        {t('profile.duplicatesSummary', { titles: groups.length, extra: total })}
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
              borderRadius={12}
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

function ExportSection({ items }: { items: LibraryItem[] }) {
  const { t } = useT();
  const [done, setDone] = useState(false);

  const onExport = () => {
    if (items.length === 0) return;
    const stamp = new Date().toISOString().slice(0, 10);
    downloadCsv(`colophon-bibliotheque-${stamp}.csv`, toLibraryCsv(items));
    setDone(true);
    setTimeout(() => setDone(false), 2500);
  };

  return (
    <YStack gap="$2" marginTop="$6">
      <Label>{t('profile.data')}</Label>
      <Button
        onPress={onExport}
        disabled={items.length === 0}
        backgroundColor="$backgroundStrong"
        borderColor="$borderColor"
        borderWidth={1}
        color="$color"
        borderRadius={12}
        height={48}
        fontFamily="$body"
        fontWeight="600"
        opacity={items.length === 0 ? 0.5 : 1}
        pressStyle={{ opacity: 0.85 }}
      >
        {done
          ? t('profile.exported')
          : items.length === 1
            ? t('profile.exportOne')
            : t('profile.exportMany', { count: items.length })}
      </Button>
      <Text fontFamily="$body" fontSize={12} color="$colorMuted" lineHeight={18}>
        {Platform.OS === 'web' ? t('profile.exportHintWeb') : t('profile.exportHintNative')}
      </Text>
    </YStack>
  );
}

function ShareSection({ userId }: { userId: string | undefined }) {
  const { t } = useT();
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
      <Label>{t('profile.share')}</Label>
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
            borderRadius={12}
            padding="$3"
          >
            {url}
          </Text>
          <Button
            onPress={onShare}
            backgroundColor="$accent"
            color={palette.paper}
            borderRadius={12}
            height={46}
            fontFamily="$body"
            fontWeight="600"
          >
            {copied
              ? t('profile.shareCopied')
              : Platform.OS === 'web'
                ? t('profile.shareCopy')
                : t('profile.shareSend')}
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
          borderRadius={12}
          height={48}
          fontFamily="$body"
          fontWeight="600"
        >
          {t('profile.shareCreate')}
        </Button>
      )}
      <Text fontFamily="$body" fontSize={12} color="$colorMuted" lineHeight={18}>
        {t('profile.shareHint')}
      </Text>
    </YStack>
  );
}

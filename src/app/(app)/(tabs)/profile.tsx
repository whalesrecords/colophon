import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
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
import { useAuth } from '@/features/auth/auth-context';
import { useDisplayPrefs } from '@/features/settings/use-display-prefs';
import { useProfile, useUpdateProfile } from '@/features/profile/use-profile';
import { Icon } from '@/components/icons';
import { duplicateGroups } from '@/features/library/duplicates';
import { useDeleteItem } from '@/features/library/use-delete-item';
import { downloadCsv, toLibraryCsv } from '@/features/library/export-csv';
import { computeFacets, EMPTY_FILTERS, type FacetKey } from '@/features/library/faceting';
import { type ShelfSuggestion, suggestShelves } from '@/features/library/suggest-shelves';
import { type LibraryItem, useLibrary } from '@/features/library/use-library';
import { useShelfActions, useShelves } from '@/features/shelves/use-shelves';
import { shareUrl, useCreateShare } from '@/features/sharing/use-share';
import { syncStatsWidget } from '@/features/reading/widget-sync';
import { type LibraryStats, useStats } from '@/features/stats/use-stats';
import { type TranslationKey, useT } from '@/i18n';
import { BadgesCard } from '@/components/profile/BadgesCard';
import { TasteProfileCard } from '@/components/profile/TasteProfileCard';
import { DailyGoalCard } from '@/components/reading/DailyGoalCard';
import { BarList, KPIRow, KPITile, StatusDot } from '@/components/ui';
import { palette, type ReadingStatus, statusColors } from '@/theme/tokens';

const STATUS_ORDER: ReadingStatus[] = ['reading', 'read', 'to_read', 'abandoned'];

function formatCount(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    return `${k >= 10 ? Math.round(k) : k.toFixed(1).replace(/\.0$/, '')}k`;
  }
  return String(n);
}

// Eyebrow — now in INK (refonte): legible on parchment, unified across the app.
function Label({ children }: { children: string }) {
  return (
    <Text
      fontFamily="$body"
      fontSize={11}
      fontWeight="700"
      letterSpacing={1.8}
      textTransform="uppercase"
      color="$color"
    >
      {children}
    </Text>
  );
}

export default function ProfileScreen() {
  const { session } = useAuth();
  const { prefs } = useDisplayPrefs();
  const { t } = useT();
  const { data: stats, isLoading } = useStats(session?.user.id);
  const { data: libraryItems } = useLibrary(session?.user.id);

  // Keep the "Mon année de lecture" iOS widget fresh (no-op on web/Android).
  useEffect(() => {
    if (stats) {
      syncStatsWidget({
        booksYear: stats.readThisYear,
        pagesYear: stats.pagesRead,
        total: stats.total,
      });
    }
  }, [stats]);
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

        {prefs.discovery ? <TasteProfileCard userId={session?.user.id} /> : null}

        {prefs.gamification ? <DailyGoalCard userId={session?.user.id} /> : null}

        {stats && prefs.gamification ? (
          <BadgesCard
            userId={session?.user.id}
            stats={{
              total: stats.total,
              readThisYear: stats.readThisYear,
              pagesRead: stats.pagesRead,
              authors: stats.authors,
              read: stats.byStatus.read,
            }}
          />
        ) : null}

        {stats && prefs.gamification ? (
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

        <PrivacySection userId={session?.user.id} />

        <ExportSection items={items} />

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

function euro(n: number): string {
  return n.toLocaleString('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: n % 1 === 0 ? 0 : 2,
  });
}

function Stats({ stats }: { stats: LibraryStats }) {
  const { t } = useT();
  const { prefs } = useDisplayPrefs();
  return (
    <YStack gap="$5">
      <KPIRow gap={18}>
        <KPITile
          value={formatCount(stats.total)}
          label={stats.total > 1 ? t('profile.books') : t('profile.book')}
        />
        <KPITile
          value={formatCount(stats.readThisYear)}
          label={t('profile.readInYear', { year: stats.year })}
          accent={palette.forest}
        />
        <KPITile value={formatCount(stats.pagesRead)} label={t('profile.pagesRead')} />
      </KPIRow>

      {prefs.collection &&
      (stats.pricedCount > 0 || stats.acquiredThisYear > 0 || stats.resaleCount > 0) ? (
        <YStack gap="$3">
          <Label>Collection</Label>
          <KPIRow gap={18}>
            <KPITile
              value={euro(stats.collectionValue)}
              label={
                stats.pricedCount < stats.total
                  ? `Payé · ${stats.pricedCount} chiffrés`
                  : 'Ce que ça a coûté'
              }
              accent={palette.prussian}
            />
            <KPITile
              value={formatCount(stats.acquiredThisYear)}
              label={`Achetés en ${stats.year}`}
            />
            <KPITile value={euro(stats.spentThisYear)} label={`Dépensé en ${stats.year}`} />
          </KPIRow>
          {stats.resaleCount > 0 ? (
            <KPIRow gap={18}>
              <KPITile
                value={euro(stats.resaleValue)}
                label={
                  stats.resaleCount < stats.total
                    ? `Revente · ${stats.resaleCount} chiffrés`
                    : 'Ce que ça vaut aujourd’hui'
                }
                accent={palette.gold}
              />
            </KPIRow>
          ) : null}
        </YStack>
      ) : null}

      <YStack gap="$3">
        <Label>{t('profile.byStatus')}</Label>
        <YStack gap="$2">
          {STATUS_ORDER.map((status) => (
            <XStack key={status} alignItems="center" gap="$3">
              <StatusDot color={statusColors[status].dot} />
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

/** Classify the library by facet (genres, shelves, tags, decades…) on the dashboard. */
function ClassificationSection({ items }: { items: LibraryItem[] }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const facets = useMemo(() => computeFacets(items, EMPTY_FILTERS), [items]);
  const shown = CLASS_FACETS.filter((f) => facets[f.key].length > 0);
  if (shown.length === 0) return null;
  return (
    <YStack gap="$4" marginTop="$7">
      <Pressable onPress={() => setOpen((v) => !v)}>
        <XStack alignItems="center" justifyContent="space-between">
          <Label>{t('profile.classification')}</Label>
          <Text fontFamily="$body" fontSize={13} fontWeight="600" color="$accent">
            {open ? t('common.hide') : t('common.see')}
          </Text>
        </XStack>
      </Pressable>
      {open
        ? shown.map((f) => (
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
          ))
        : null}
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
  const { session } = useAuth();
  const del = useDeleteItem(session?.user.id);
  const groups = useMemo(
    () => duplicateGroups(items.filter((i) => i.ownership === 'owned')),
    [items],
  );
  // Which duplicate groups are ticked for removal (default: all), the bulk confirm bar.
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [seeded, setSeeded] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!seeded && groups.length > 0) {
      setSelected(new Set(groups.map((g) => g.isbn13)));
      setSeeded(true);
    }
  }, [groups, seeded]);

  if (groups.length === 0) return null;
  const total = groups.reduce((n, g) => n + (g.count - 1), 0);
  const selectedExtras = groups
    .filter((g) => selected.has(g.isbn13))
    .reduce((n, g) => n + (g.count - 1), 0);
  const allOn = selected.size === groups.length;

  const toggle = (isbn: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(isbn)) n.delete(isbn);
      else n.add(isbn);
      return n;
    });

  // Keep the first copy of each selected title, delete its extras (ids[1..]).
  const removeSelected = async () => {
    setBusy(true);
    try {
      for (const g of groups) {
        if (!selected.has(g.isbn13)) continue;
        for (const id of g.ids.slice(1)) await del.mutateAsync(id);
      }
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  };

  return (
    <YStack gap="$3" marginTop="$7">
      <XStack alignItems="center" justifyContent="space-between">
        <Label>{t('profile.duplicates')}</Label>
        <Text
          onPress={() => setSelected(allOn ? new Set() : new Set(groups.map((g) => g.isbn13)))}
          fontFamily="$body"
          fontSize={13}
          fontWeight="600"
          color="$accent"
          pressStyle={{ opacity: 0.6 }}
        >
          {allOn ? t('profile.deselectAll') : t('profile.selectAll')}
        </Text>
      </XStack>
      <Text fontFamily="$body" fontSize={13} color="$colorMuted">
        {t('profile.duplicatesSummary', { titles: groups.length, extra: total })}
      </Text>

      <YStack gap="$2">
        {groups.map((g) => {
          const on = selected.has(g.isbn13);
          return (
            <XStack
              key={g.isbn13}
              alignItems="center"
              gap="$2"
              padding="$3"
              backgroundColor="$backgroundStrong"
              borderColor={on ? '$accent' : '$borderColor'}
              borderWidth={1}
              borderRadius={12}
            >
              <Pressable onPress={() => toggle(g.isbn13)} hitSlop={8}>
                <YStack
                  width={22}
                  height={22}
                  borderRadius={6}
                  borderWidth={2}
                  borderColor={on ? '$accent' : '$borderColor'}
                  backgroundColor={on ? '$accent' : 'transparent'}
                  alignItems="center"
                  justifyContent="center"
                >
                  {on ? <Icon name="check" size={14} color={palette.paper} /> : null}
                </YStack>
              </Pressable>
              <Pressable style={{ flex: 1 }} onPress={() => router.push(`/book/${g.ids[0]}`)}>
                <YStack gap={2}>
                  <Text fontFamily="$heading" fontSize={15} color="$color" numberOfLines={1}>
                    {g.title}
                  </Text>
                  {g.author ? (
                    <Text fontFamily="$body" fontSize={12} color="$colorMuted" numberOfLines={1}>
                      {g.author}
                    </Text>
                  ) : null}
                </YStack>
              </Pressable>
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
          );
        })}
      </YStack>

      {confirming ? (
        <YStack
          gap="$2"
          padding="$3"
          backgroundColor="$backgroundStrong"
          borderColor={palette.brick}
          borderWidth={1}
          borderRadius={12}
        >
          <Text fontFamily="$body" fontSize={12.5} color="$colorSoft" lineHeight={18}>
            {t('profile.dedupeConfirmBulk', { count: selectedExtras })}
          </Text>
          <XStack gap="$2">
            <Button
              onPress={() => void removeSelected()}
              disabled={busy}
              flex={1}
              height={40}
              borderRadius={10}
              backgroundColor={palette.brick}
              color={palette.paper}
              fontFamily="$body"
              fontWeight="700"
              fontSize={14}
            >
              {busy ? '…' : t('common.confirm')}
            </Button>
            <Button
              onPress={() => setConfirming(false)}
              disabled={busy}
              flex={1}
              height={40}
              borderRadius={10}
              backgroundColor="transparent"
              borderColor="$borderColor"
              borderWidth={1}
              color="$colorSoft"
              fontFamily="$body"
              fontWeight="600"
              fontSize={14}
            >
              {t('common.cancel')}
            </Button>
          </XStack>
        </YStack>
      ) : (
        <Button
          onPress={() => setConfirming(true)}
          disabled={selectedExtras === 0 || busy}
          backgroundColor={palette.brick}
          color={palette.paper}
          borderRadius={12}
          height={46}
          fontFamily="$body"
          fontWeight="700"
          fontSize={15}
          opacity={selectedExtras === 0 ? 0.5 : 1}
        >
          {t('profile.dedupeRemoveN', { count: selectedExtras })}
        </Button>
      )}
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

function ModeCard({
  active,
  title,
  desc,
  onPress,
}: {
  active: boolean;
  title: string;
  desc: string;
  onPress: () => void;
}) {
  return (
    <YStack
      flex={1}
      onPress={onPress}
      cursor="pointer"
      pressStyle={{ opacity: 0.85 }}
      gap="$1"
      padding="$3"
      borderRadius={12}
      borderWidth={active ? 2 : 1}
      borderColor={active ? '$accent' : '$borderColor'}
      backgroundColor={active ? palette.surfaceWarmAlt : '$backgroundStrong'}
    >
      <XStack alignItems="center" gap="$1.5">
        <Text
          fontFamily="$body"
          fontSize={15}
          fontWeight="700"
          color={active ? '$accent' : '$color'}
        >
          {title}
        </Text>
        {active ? (
          <Text fontSize={13} color="$accent">
            ✓
          </Text>
        ) : null}
      </XStack>
      <Text fontFamily="$body" fontSize={11.5} color="$colorMuted" lineHeight={16}>
        {desc}
      </Text>
    </YStack>
  );
}

function PrivacySection({ userId }: { userId: string | undefined }) {
  const { data: profile } = useProfile(userId);
  const update = useUpdateProfile(userId);
  const isPrivate = profile?.is_private ?? false;
  const shared = profile?.share_current_reading ?? true;

  return (
    <YStack gap="$3" marginTop="$6">
      <Label>Confidentialité</Label>

      <XStack gap="$2">
        <ModeCard
          active={!isPrivate}
          title="Social"
          desc="Visible en découverte, fil et classements."
          onPress={() => update.mutate({ is_private: false })}
        />
        <ModeCard
          active={isPrivate}
          title="Secret"
          desc="Invisible — rien ne sort de ton compte."
          onPress={() => update.mutate({ is_private: true, share_current_reading: false })}
        />
      </XStack>

      {isPrivate ? (
        <Text fontFamily="$body" fontSize={12} color="$colorMuted" lineHeight={18}>
          En mode Secret, tout partage social est coupé (profil, découverte, fil, classements,
          lecture en cours). Repasse en Social pour choisir au cas par cas.
        </Text>
      ) : (
        <Pressable onPress={() => update.mutate({ share_current_reading: !shared })}>
          <XStack
            alignItems="center"
            justifyContent="space-between"
            gap="$3"
            backgroundColor="$backgroundStrong"
            borderColor="$borderColor"
            borderWidth={1}
            borderRadius={12}
            padding="$3"
          >
            <YStack flex={1} gap="$1">
              <Text fontFamily="$body" fontSize={14} fontWeight="600" color="$color">
                Partager ma lecture du moment
              </Text>
              <Text fontFamily="$body" fontSize={12} color="$colorMuted" lineHeight={18}>
                Tes amis voient le livre que tu lis en ce moment. Désactive pour le garder privé.
              </Text>
            </YStack>
            <YStack
              width={46}
              height={28}
              borderRadius={999}
              padding={3}
              justifyContent="center"
              alignItems={shared ? 'flex-end' : 'flex-start'}
              backgroundColor={shared ? '$accent' : '$borderColor'}
            >
              <YStack width={22} height={22} borderRadius={999} backgroundColor={palette.paper} />
            </YStack>
          </XStack>
        </Pressable>
      )}
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

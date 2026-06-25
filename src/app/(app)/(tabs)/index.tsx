import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, useWindowDimensions } from 'react-native';
import { Button, Input, Spinner, Text, XStack, YStack } from 'tamagui';

import { BookCover } from '@/components/BookCover';
import { displayValue, FilterPanel } from '@/components/library/FilterPanel';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/features/auth/auth-context';
import {
  activeFilterCount,
  applyFilters,
  computeFacets,
  EMPTY_FILTERS,
  type FacetKey,
  type Filters,
  type SortKey,
  sortItems,
} from '@/features/library/faceting';
import { copiesByIsbn } from '@/features/library/duplicates';
import { type LibraryItem, useLibrary } from '@/features/library/use-library';
import { composedPalette } from '@/theme/cover-palettes';
import { palette, statusColors } from '@/theme/tokens';

const H_PADDING = 20;
const GAP = 16;
const SORTS: { key: SortKey; label: string }[] = [
  { key: 'added', label: 'Ajout' },
  { key: 'title', label: 'Titre' },
  { key: 'author', label: 'Auteur' },
  { key: 'year', label: 'Année' },
  { key: 'rating', label: 'Note' },
];

function columnsFor(width: number): number {
  if (width >= 1100) return 6;
  if (width >= 760) return 4;
  return 3;
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

export default function LibraryScreen() {
  const { session } = useAuth();
  const { width } = useWindowDimensions();
  const { data, isLoading, error } = useLibrary(session?.user.id);

  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortKey>('added');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  const items = useMemo(() => data ?? [], [data]);
  const copies = useMemo(() => copiesByIsbn(items), [items]);
  const copiesOf = (item: LibraryItem) =>
    item.book?.isbn13 ? (copies.get(item.book.isbn13) ?? 1) : 1;
  const facets = useMemo(() => computeFacets(items, filters), [items, filters]);
  const filtered = useMemo(
    () => sortItems(applyFilters(items, filters), sort),
    [items, filters, sort],
  );

  const toggleFacet = (key: FacetKey, value: string) =>
    setFilters((f) => {
      const sel = f.facets[key];
      const next = sel.includes(value) ? sel.filter((v) => v !== value) : [...sel, value];
      return { ...f, facets: { ...f.facets, [key]: next } };
    });

  const nFilters = activeFilterCount(filters);
  const contentWidth = Math.min(width, 1200) - H_PADDING * 2;
  const cols = columnsFor(width);
  const coverWidth = Math.floor((contentWidth - GAP * (cols - 1)) / cols);

  return (
    <Screen>
      <YStack paddingHorizontal={H_PADDING} paddingTop="$4" gap="$3">
        <YStack gap="$1">
          <Label>Ma bibliothèque</Label>
          <XStack alignItems="flex-end" justifyContent="space-between">
            <Text fontFamily="$heading" fontSize={33} fontWeight="500" color="$color">
              Bibliothèque
            </Text>
            <Text fontFamily="$body" fontSize={13} color="$colorMuted" marginBottom={6}>
              {filtered.length === items.length
                ? `${items.length} ${items.length > 1 ? 'livres' : 'livre'}`
                : `${filtered.length} / ${items.length}`}
            </Text>
          </XStack>
        </YStack>

        {items.length > 0 ? (
          <>
            <Input
              value={filters.search}
              onChangeText={(search) => setFilters((f) => ({ ...f, search }))}
              placeholder="Rechercher un titre, un auteur, un ISBN…"
              autoCapitalize="none"
              backgroundColor="$backgroundStrong"
              borderColor="$borderColor"
              borderWidth={1}
              borderRadius={2}
              height={44}
              paddingHorizontal="$3"
              fontFamily="$body"
              fontSize={15}
              color="$color"
              placeholderTextColor="$concreteLight"
              focusStyle={{ borderColor: '$accent' }}
            />

            <XStack justifyContent="space-between" alignItems="center">
              <Button
                onPress={() => setShowFilters((s) => !s)}
                height={36}
                paddingHorizontal="$3"
                borderRadius={2}
                borderWidth={1}
                borderColor={nFilters ? '$accent' : '$borderColor'}
                backgroundColor="transparent"
                color={nFilters ? '$accent' : '$colorSoft'}
                fontFamily="$body"
                fontSize={14}
                fontWeight="600"
              >
                {nFilters ? `Filtres · ${nFilters}` : 'Filtres'}
              </Button>
              <XStack gap="$2">
                <ViewToggle label="Grille" active={view === 'grid'} onPress={() => setView('grid')} />
                <ViewToggle label="Liste" active={view === 'list'} onPress={() => setView('list')} />
              </XStack>
            </XStack>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <XStack gap="$2" alignItems="center" paddingRight="$4">
                <Text fontFamily="$body" fontSize={13} color="$colorMuted">
                  Trier :
                </Text>
                {SORTS.map((s) => (
                  <Button
                    key={s.key}
                    onPress={() => setSort(s.key)}
                    height={32}
                    paddingHorizontal="$3"
                    borderRadius={999}
                    borderWidth={1}
                    borderColor={sort === s.key ? '$accent' : '$borderColor'}
                    backgroundColor={sort === s.key ? '$accent' : 'transparent'}
                    color={sort === s.key ? palette.paper : '$colorMuted'}
                    fontFamily="$body"
                    fontSize={13}
                    fontWeight="500"
                  >
                    {s.label}
                  </Button>
                ))}
              </XStack>
            </ScrollView>

            {nFilters > 0 ? (
              <XStack gap="$2" flexWrap="wrap">
                {(Object.keys(filters.facets) as FacetKey[]).flatMap((key) =>
                  filters.facets[key].map((value) => (
                    <Button
                      key={`${key}:${value}`}
                      onPress={() => toggleFacet(key, value)}
                      height={30}
                      paddingHorizontal="$3"
                      borderRadius={999}
                      backgroundColor="$accent"
                      color={palette.paper}
                      fontFamily="$body"
                      fontSize={12}
                      fontWeight="600"
                    >
                      {`${displayValue(key, value)}  ✕`}
                    </Button>
                  )),
                )}
              </XStack>
            ) : null}

            {showFilters ? (
              <FilterPanel facets={facets} filters={filters} onToggle={toggleFacet} />
            ) : null}
          </>
        ) : null}
      </YStack>

      {isLoading ? (
        <YStack flex={1} alignItems="center" justifyContent="center">
          <Spinner color="$accent" size="large" />
        </YStack>
      ) : error ? (
        <YStack flex={1} alignItems="center" justifyContent="center" paddingHorizontal="$8">
          <Text color="$signal" fontFamily="$body" textAlign="center">
            Impossible de charger la bibliothèque.
          </Text>
        </YStack>
      ) : items.length === 0 ? (
        <EmptyLibrary coverWidth={Math.min(coverWidth, 110)} />
      ) : filtered.length === 0 ? (
        <YStack flex={1} alignItems="center" justifyContent="center" paddingHorizontal="$8" paddingTop="$8">
          <Text color="$colorMuted" fontFamily="$body" textAlign="center">
            Aucun livre ne correspond à ces filtres.
          </Text>
        </YStack>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: H_PADDING, paddingVertical: 16 }}>
          {view === 'grid' ? (
            <XStack flexWrap="wrap" gap={GAP}>
              {filtered.map((item) => (
                <LibraryCard key={item.id} item={item} width={coverWidth} copies={copiesOf(item)} />
              ))}
            </XStack>
          ) : (
            <YStack gap="$2">
              {filtered.map((item) => (
                <LibraryRow key={item.id} item={item} copies={copiesOf(item)} />
              ))}
            </YStack>
          )}
        </ScrollView>
      )}
    </Screen>
  );
}

function ViewToggle({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Button
      onPress={onPress}
      height={36}
      paddingHorizontal="$3"
      borderRadius={2}
      borderWidth={1}
      borderColor={active ? '$accent' : '$borderColor'}
      backgroundColor={active ? '$accent' : 'transparent'}
      color={active ? palette.paper : '$colorMuted'}
      fontFamily="$body"
      fontSize={13}
      fontWeight="600"
    >
      {label}
    </Button>
  );
}

function DuplicateBadge({ copies }: { copies: number }) {
  if (copies <= 1) return null;
  return (
    <XStack
      position="absolute"
      top={6}
      left={6}
      backgroundColor={palette.terracotta}
      borderRadius={999}
      paddingHorizontal={7}
      height={19}
      alignItems="center"
    >
      <Text fontFamily="$body" fontSize={10} fontWeight="700" color={palette.paper}>
        {`× ${copies}`}
      </Text>
    </XStack>
  );
}

function LibraryCard({ item, width, copies }: { item: LibraryItem; width: number; copies: number }) {
  const router = useRouter();
  const { bg, fg } = composedPalette(item.book?.isbn13 ?? item.id);
  return (
    <YStack width={width} gap="$2">
      <YStack position="relative">
        <BookCover
          title={item.book?.title ?? 'Sans titre'}
          author={item.book?.authors?.[0]}
          coverUrl={item.book?.cover_url}
          bg={bg}
          fg={fg}
          width={width}
          onPress={() => router.push(`/book/${item.id}`)}
        />
        <DuplicateBadge copies={copies} />
      </YStack>
      <YStack gap={2}>
        <Text fontFamily="$heading" fontSize={13} color="$color" numberOfLines={1}>
          {item.book?.title ?? 'Sans titre'}
        </Text>
        {item.book?.authors?.[0] ? (
          <Text fontFamily="$body" fontSize={12} color="$colorMuted" numberOfLines={1}>
            {item.book.authors[0]}
          </Text>
        ) : null}
      </YStack>
    </YStack>
  );
}

function LibraryRow({ item, copies }: { item: LibraryItem; copies: number }) {
  const router = useRouter();
  const { bg, fg } = composedPalette(item.book?.isbn13 ?? item.id);
  return (
    <Pressable onPress={() => router.push(`/book/${item.id}`)}>
      <XStack
        gap="$3"
        alignItems="center"
        padding="$2"
        backgroundColor="$backgroundStrong"
        borderColor="$borderColor"
        borderWidth={1}
        borderRadius={2}
      >
        <BookCover
          title={item.book?.title ?? 'Sans titre'}
          author={item.book?.authors?.[0]}
          coverUrl={item.book?.cover_url}
          bg={bg}
          fg={fg}
          width={40}
        />
        <YStack flex={1} gap={2}>
          <Text fontFamily="$heading" fontSize={15} color="$color" numberOfLines={1}>
            {item.book?.title ?? 'Sans titre'}
          </Text>
          <Text fontFamily="$body" fontSize={12} color="$colorMuted" numberOfLines={1}>
            {item.book?.authors?.[0] ?? 'Auteur inconnu'}
          </Text>
        </YStack>
        {copies > 1 ? (
          <XStack
            backgroundColor={palette.terracotta}
            borderRadius={999}
            paddingHorizontal={7}
            height={19}
            alignItems="center"
          >
            <Text fontFamily="$body" fontSize={10} fontWeight="700" color={palette.paper}>
              {`× ${copies}`}
            </Text>
          </XStack>
        ) : null}
        <YStack
          width={10}
          height={10}
          borderRadius={999}
          backgroundColor={statusColors[item.status].dot}
        />
      </XStack>
    </Pressable>
  );
}

function EmptyLibrary({ coverWidth }: { coverWidth: number }) {
  const router = useRouter();
  const demo = [
    { title: "Éloge de l'ombre", author: 'Tanizaki', seed: 'a' },
    { title: 'Les Villes invisibles', author: 'Calvino', seed: 'bb' },
    { title: "L'Usage du monde", author: 'Bouvier', seed: 'ccc' },
  ];
  return (
    <YStack flex={1} alignItems="center" justifyContent="center" gap="$6" paddingHorizontal="$6">
      <XStack gap={12} opacity={0.45}>
        {demo.map((d) => {
          const { bg, fg } = composedPalette(d.seed);
          return <BookCover key={d.seed} title={d.title} author={d.author} bg={bg} fg={fg} width={coverWidth} />;
        })}
      </XStack>
      <YStack alignItems="center" gap="$2" maxWidth={320}>
        <Text fontFamily="$heading" fontSize={24} fontWeight="500" color="$color" textAlign="center">
          Votre bibliothèque vous attend
        </Text>
        <Text fontFamily="$body" fontSize={15} color="$colorMuted" textAlign="center" lineHeight={22}>
          Scannez ou recherchez un livre pour l'ajouter. Ses informations sont récupérées
          automatiquement.
        </Text>
      </YStack>
      <Button
        onPress={() => router.push('/scan')}
        backgroundColor="$accent"
        color={palette.paper}
        borderRadius={2}
        height={50}
        paddingHorizontal="$6"
        fontFamily="$body"
        fontWeight="600"
        pressStyle={{ opacity: 0.9, backgroundColor: '$accentDeep' }}
      >
        Ajouter un livre
      </Button>
    </YStack>
  );
}

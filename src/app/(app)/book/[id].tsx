import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Input, Spinner, Text, TextArea, XStack, YStack } from 'tamagui';

import { BookCover } from '@/components/BookCover';
import { CoverPicker } from '@/components/book/CoverPicker';
import { LoanSection } from '@/components/book/LoanSection';
import { SeriesAddSheet } from '@/components/book/SeriesAddSheet';
import { ReadingSection } from '@/components/book/ReadingSection';
import { useAuth } from '@/features/auth/auth-context';
import { useBookDetail } from '@/features/library/use-book-detail';
import { useCopyCount, useDeleteItem } from '@/features/library/use-delete-item';
import { useUpdateItem } from '@/features/library/use-update-item';
import { useShelfActions, useShelves } from '@/features/shelves/use-shelves';
import { parseSeries } from '@/lib/series';
import { useTagActions, useTags } from '@/features/tags/use-tags';
import { composedPalette } from '@/theme/cover-palettes';
import {
  OWNERSHIP_LABELS,
  OWNERSHIP_ORDER,
  palette,
  type ReadingStatus,
  statusColors,
} from '@/theme/tokens';

const STATUS_LABELS: Record<ReadingStatus, string> = {
  to_read: 'À lire',
  reading: 'En cours',
  read: 'Lu',
  abandoned: 'Abandonné',
};
const STATUS_ORDER: ReadingStatus[] = ['to_read', 'reading', 'read', 'abandoned'];

function Label({ children }: { children: string }) {
  return (
    <Text
      fontFamily="$body"
      fontSize={11}
      fontWeight="600"
      letterSpacing={2}
      textTransform="uppercase"
      color="$colorMuted"
    >
      {children}
    </Text>
  );
}

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { data: item, isLoading, error } = useBookDetail(id);
  const update = useUpdateItem(id, session?.user.id);
  const deleteItem = useDeleteItem(session?.user.id);
  const { data: copyCount } = useCopyCount(item?.book?.isbn13 ?? undefined);
  const [seriesOpen, setSeriesOpen] = useState(false);

  const confirmDelete = () => {
    const run = async () => {
      try {
        await deleteItem.mutateAsync(id);
        router.back();
      } catch {
        // ignore
      }
    };
    const message = 'Retirer ce livre de votre bibliothèque ? Vos notes et sessions de lecture associées seront supprimées.';
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(message)) void run();
    } else {
      Alert.alert('Supprimer le livre', message, [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => void run() },
      ]);
    }
  };

  if (isLoading) {
    return (
      <YStack flex={1} backgroundColor="$background" alignItems="center" justifyContent="center">
        <Spinner color="$accent" size="large" />
      </YStack>
    );
  }
  if (error || !item) {
    return (
      <YStack
        flex={1}
        backgroundColor="$background"
        alignItems="center"
        justifyContent="center"
        gap="$3"
        padding="$6"
      >
        <Text fontFamily="$body" color="$signal" textAlign="center">
          Livre introuvable.
        </Text>
        <Button onPress={() => router.back()} chromeless color="$accent" fontFamily="$body">
          Retour
        </Button>
      </YStack>
    );
  }

  const book = item.book;
  const seriesRef = book?.title ? parseSeries(book.title) : null;
  const { bg, fg } = composedPalette(book?.isbn13 ?? id);
  const meta = [book?.publisher, book?.published_date, book?.page_count ? `${book.page_count} pages` : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <YStack flex={1} backgroundColor="$background">
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        {/* hero */}
        <YStack
          backgroundColor={palette.surfaceWarmAlt}
          alignItems="center"
          paddingTop={insets.top + 56}
          paddingBottom="$8"
        >
          <BookCover
            title={book?.title ?? 'Sans titre'}
            author={book?.authors?.[0]}
            coverUrl={item.cover_override ?? book?.cover_url}
            isbn={book?.isbn13}
            bg={bg}
            fg={fg}
            width={150}
          />
        </YStack>

        {/* sheet */}
        <YStack
          backgroundColor="$backgroundStrong"
          borderTopLeftRadius={24}
          borderTopRightRadius={24}
          marginTop={-20}
          padding="$5"
          gap="$5"
          width="100%"
          maxWidth={800}
          alignSelf="center"
        >
          <YStack gap="$1">
            <Text fontFamily="$heading" fontSize={25} fontWeight="500" color="$color">
              {book?.title ?? 'Sans titre'}
            </Text>
            {book?.authors?.length ? (
              <Text fontFamily="$heading" fontSize={16} fontStyle="italic" color="$colorSoft">
                {book.authors.join(', ')}
              </Text>
            ) : null}
            {meta ? (
              <Text fontFamily="$body" fontSize={13} color="$colorMuted" marginTop="$1">
                {meta}
              </Text>
            ) : null}
          </YStack>

          {/* cover override */}
          <CoverPicker
            itemId={id}
            userId={session?.user.id}
            isbn13={book?.isbn13}
            title={book?.title ?? ''}
            author={book?.authors?.[0]}
            hasOverride={!!item.cover_override}
          />

          {seriesRef ? (
            <Button
              onPress={() => setSeriesOpen(true)}
              backgroundColor="$backgroundStrong"
              borderColor="$accent"
              borderWidth={1}
              color="$accent"
              borderRadius={12}
              height={44}
              fontFamily="$body"
              fontWeight="600"
            >
              {`Compléter la série « ${seriesRef.name} »`}
            </Button>
          ) : null}

          {/* duplicate notice */}
          {copyCount && copyCount > 1 ? (
            <XStack
              alignItems="center"
              padding="$3"
              borderRadius={12}
              borderWidth={1}
              borderColor={palette.terracotta}
              backgroundColor="$backgroundStrong"
            >
              <Text fontFamily="$body" fontSize={13} color="$color">
                {`Doublon — vous possédez ${copyCount} exemplaires de ce livre.`}
              </Text>
            </XStack>
          ) : null}

          {/* possession */}
          <YStack gap="$2">
            <Label>Possession</Label>
            <XStack gap="$2" flexWrap="wrap">
              {OWNERSHIP_ORDER.map((o) => {
                const active = item.ownership === o;
                return (
                  <Button
                    key={o}
                    onPress={() => update.mutate({ ownership: o })}
                    height={36}
                    paddingHorizontal="$3"
                    borderRadius={999}
                    borderWidth={1}
                    borderColor={active ? '$accent' : '$borderColor'}
                    backgroundColor={active ? '$accent' : 'transparent'}
                    fontFamily="$body"
                    fontSize={13}
                    fontWeight="600"
                    color={active ? palette.paper : '$colorMuted'}
                  >
                    {OWNERSHIP_LABELS[o]}
                  </Button>
                );
              })}
            </XStack>
            {item.ownership === 'borrowed' ? (
              <EditableText
                label="Emprunté à"
                value={item.borrowed_from ?? ''}
                placeholder="Nom (facultatif)"
                onSave={(v) => update.mutate({ borrowed_from: v || null })}
              />
            ) : null}
          </YStack>

          {/* status */}
          <YStack gap="$2">
            <Label>Statut de lecture</Label>
            <XStack gap="$2" flexWrap="wrap">
              {STATUS_ORDER.map((status) => {
                const active = item.status === status;
                return (
                  <Button
                    key={status}
                    onPress={() => update.mutate({ status })}
                    height={36}
                    paddingHorizontal="$3"
                    borderRadius={999}
                    borderWidth={1}
                    borderColor={active ? statusColors[status].dot : '$borderColor'}
                    backgroundColor={active ? statusColors[status].chipBg : 'transparent'}
                    fontFamily="$body"
                    fontSize={13}
                    fontWeight="600"
                    color={active ? statusColors[status].chipText : '$colorMuted'}
                  >
                    {STATUS_LABELS[status]}
                  </Button>
                );
              })}
            </XStack>
          </YStack>

          {/* rating */}
          <YStack gap="$2">
            <Label>Votre note</Label>
            <XStack gap="$2" alignItems="center">
              {[1, 2, 3, 4, 5].map((n) => {
                const filled = (item.rating ?? 0) >= n;
                return (
                  <Pressable
                    key={n}
                    onPress={() => update.mutate({ rating: item.rating === n ? null : n })}
                  >
                    <YStack
                      width={22}
                      height={22}
                      borderRadius={999}
                      backgroundColor={filled ? palette.aizome : 'transparent'}
                      borderWidth={1.5}
                      borderColor={filled ? palette.aizome : palette.hairlineStrong}
                    />
                  </Pressable>
                );
              })}
              {item.rating ? (
                <Text fontFamily="$heading" fontSize={16} color="$color" marginLeft="$2">
                  {item.rating}
                </Text>
              ) : null}
            </XStack>
          </YStack>

          {/* reading sessions */}
          <ReadingSection itemId={id} userId={session?.user.id} totalPages={book?.page_count ?? null} />

          {/* review */}
          <EditableText
            label="Votre fiche / avis"
            value={item.notes}
            placeholder="Vos impressions, citations, contexte de lecture…"
            multiline
            onSave={(v) => update.mutate({ notes: v || null })}
          />

          {/* exemplaire */}
          <YStack gap="$3">
            <Label>Cet exemplaire</Label>
            <EditableText
              label="Emplacement"
              value={item.location}
              placeholder="Étagère salon, boîte 3…"
              onSave={(v) => update.mutate({ location: v || null })}
            />
            <EditableText
              label="État"
              value={item.condition}
              placeholder="Neuf, bon, abîmé…"
              onSave={(v) => update.mutate({ condition: v || null })}
            />
            <XStack gap="$3">
              <YStack flex={1}>
                <EditableText
                  label="Prix d'achat"
                  value={item.purchase_price != null ? String(item.purchase_price) : null}
                  placeholder="0,00"
                  numeric
                  onSave={(v) => {
                    const n = parseFloat(v.replace(',', '.'));
                    update.mutate({ purchase_price: Number.isFinite(n) ? n : null });
                  }}
                />
              </YStack>
              <YStack flex={1}>
                <EditableText
                  label="Date d'achat"
                  value={item.purchase_date}
                  placeholder="AAAA-MM-JJ"
                  onSave={(v) => update.mutate({ purchase_date: v || null })}
                />
              </YStack>
            </XStack>
            <EditableText
              label="Lieu d'achat"
              value={item.purchase_store}
              placeholder="Librairie, en ligne…"
              onSave={(v) => update.mutate({ purchase_store: v || null })}
            />
          </YStack>

          {/* loan */}
          <LoanSection itemId={id} userId={session?.user.id} />

          {/* shelves */}
          <ShelvesSection itemId={id} userId={session?.user.id} shelfIds={item.shelfIds} />

          {/* tags */}
          <TagsSection itemId={id} userId={session?.user.id} tagIds={item.tagIds} />

          {/* description */}
          {book?.description ? (
            <YStack gap="$2">
              <Label>Résumé</Label>
              <Text fontFamily="$body" fontSize={14} color="$colorSoft" lineHeight={21}>
                {book.description}
              </Text>
            </YStack>
          ) : null}

          {/* delete */}
          <Button
            onPress={confirmDelete}
            disabled={deleteItem.isPending}
            marginTop="$2"
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
            {deleteItem.isPending ? 'Suppression…' : 'Supprimer ce livre'}
          </Button>
        </YStack>
      </ScrollView>

      {seriesOpen && seriesRef ? (
        <SeriesAddSheet
          seriesName={seriesRef.name}
          userId={session?.user.id}
          onClose={() => setSeriesOpen(false)}
        />
      ) : null}

      {/* back button */}
      <Pressable
        onPress={() => router.back()}
        style={{
          position: 'absolute',
          top: insets.top + 8,
          left: 16,
          width: 40,
          height: 40,
          borderRadius: 999,
          backgroundColor: 'rgba(255,255,255,0.9)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text fontFamily="$heading" fontSize={22} color={palette.ink} marginTop={-2}>
          ‹
        </Text>
      </Pressable>
    </YStack>
  );
}

function EditableText({
  label,
  value,
  placeholder,
  multiline,
  numeric,
  onSave,
}: {
  label: string;
  value: string | null;
  placeholder?: string;
  multiline?: boolean;
  numeric?: boolean;
  onSave: (value: string) => void;
}) {
  const [local, setLocal] = useState(value ?? '');
  useEffect(() => {
    setLocal(value ?? '');
  }, [value]);

  const commit = () => {
    if ((value ?? '') !== local.trim()) onSave(local.trim());
  };

  const shared = {
    value: local,
    onChangeText: setLocal,
    onBlur: commit,
    placeholder,
    placeholderTextColor: '$concreteLight' as const,
    backgroundColor: '$background' as const,
    borderColor: '$borderColor' as const,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: '$3' as const,
    fontFamily: '$body' as const,
    fontSize: 15,
    color: '$color' as const,
    focusStyle: { borderColor: '$accent' } as const,
  };

  return (
    <YStack gap="$1">
      <Label>{label}</Label>
      {multiline ? (
        <TextArea {...shared} minHeight={96} paddingVertical="$2" />
      ) : (
        <Input
          {...shared}
          height={44}
          autoCapitalize={numeric ? 'none' : 'sentences'}
          keyboardType={numeric ? (Platform.OS === 'web' ? 'default' : 'decimal-pad') : 'default'}
        />
      )}
    </YStack>
  );
}

function ShelvesSection({
  itemId,
  userId,
  shelfIds,
}: {
  itemId: string;
  userId: string | undefined;
  shelfIds: string[];
}) {
  const { data: shelves } = useShelves(userId);
  const { createShelf, addToShelf, removeFromShelf } = useShelfActions(userId);
  const [newName, setNewName] = useState('');
  const set = new Set(shelfIds);

  const toggle = (shelfId: string) => {
    if (set.has(shelfId)) removeFromShelf.mutate({ itemId, shelfId });
    else addToShelf.mutate({ itemId, shelfId });
  };

  const onCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    setNewName('');
    try {
      const shelf = await createShelf.mutateAsync(name);
      addToShelf.mutate({ itemId, shelfId: shelf.id });
    } catch {
      // ignore (e.g. transient error)
    }
  };

  return (
    <YStack gap="$2">
      <Label>Étagères</Label>
      {shelves && shelves.length > 0 ? (
        <XStack gap="$2" flexWrap="wrap">
          {shelves.map((shelf) => {
            const active = set.has(shelf.id);
            return (
              <Button
                key={shelf.id}
                onPress={() => toggle(shelf.id)}
                height={34}
                paddingHorizontal="$3"
                borderRadius={999}
                borderWidth={1}
                borderColor={active ? '$accent' : '$borderColor'}
                backgroundColor={active ? '$accent' : 'transparent'}
                color={active ? palette.paper : '$colorSoft'}
                fontFamily="$body"
                fontSize={13}
                fontWeight="500"
              >
                {shelf.name}
              </Button>
            );
          })}
        </XStack>
      ) : null}
      <XStack gap="$2">
        <Input
          flex={1}
          value={newName}
          onChangeText={setNewName}
          onSubmitEditing={onCreate}
          placeholder="Nouvelle étagère…"
          placeholderTextColor="$concreteLight"
          backgroundColor="$background"
          borderColor="$borderColor"
          borderWidth={1}
          borderRadius={12}
          height={42}
          paddingHorizontal="$3"
          fontFamily="$body"
          fontSize={14}
          color="$color"
        />
        <Button
          onPress={onCreate}
          backgroundColor="$backgroundStrong"
          borderColor="$borderColor"
          borderWidth={1}
          color="$color"
          borderRadius={12}
          height={42}
          paddingHorizontal="$4"
          fontFamily="$body"
          fontWeight="600"
        >
          Créer
        </Button>
      </XStack>
    </YStack>
  );
}

function TagsSection({
  itemId,
  userId,
  tagIds,
}: {
  itemId: string;
  userId: string | undefined;
  tagIds: string[];
}) {
  const { data: tags } = useTags(userId);
  const { createTag, addTag, removeTag } = useTagActions(userId);
  const [newName, setNewName] = useState('');
  const set = new Set(tagIds);

  const toggle = (tagId: string) => {
    if (set.has(tagId)) removeTag.mutate({ itemId, tagId });
    else addTag.mutate({ itemId, tagId });
  };

  const onCreate = async () => {
    const name = newName.trim().replace(/^#+/, '').trim();
    if (!name) return;
    setNewName('');
    try {
      const tag = await createTag.mutateAsync(name);
      addTag.mutate({ itemId, tagId: tag.id });
    } catch {
      // ignore (e.g. duplicate name)
    }
  };

  return (
    <YStack gap="$2">
      <Label>Tags</Label>
      {tags && tags.length > 0 ? (
        <XStack gap="$2" flexWrap="wrap">
          {tags.map((tag) => {
            const active = set.has(tag.id);
            return (
              <Button
                key={tag.id}
                onPress={() => toggle(tag.id)}
                height={34}
                paddingHorizontal="$3"
                borderRadius={999}
                borderWidth={1}
                borderColor={active ? '$accent' : '$borderColor'}
                backgroundColor={active ? '$accent' : 'transparent'}
                color={active ? palette.paper : '$colorSoft'}
                fontFamily="$body"
                fontSize={13}
                fontWeight="500"
              >
                {`#${tag.name}`}
              </Button>
            );
          })}
        </XStack>
      ) : null}
      <XStack gap="$2">
        <Input
          flex={1}
          value={newName}
          onChangeText={setNewName}
          onSubmitEditing={onCreate}
          autoCapitalize="none"
          placeholder="Nouveau tag…"
          placeholderTextColor="$concreteLight"
          backgroundColor="$background"
          borderColor="$borderColor"
          borderWidth={1}
          borderRadius={12}
          height={42}
          paddingHorizontal="$3"
          fontFamily="$body"
          fontSize={14}
          color="$color"
        />
        <Button
          onPress={onCreate}
          backgroundColor="$backgroundStrong"
          borderColor="$borderColor"
          borderWidth={1}
          color="$color"
          borderRadius={12}
          height={42}
          paddingHorizontal="$4"
          fontFamily="$body"
          fontWeight="600"
        >
          Créer
        </Button>
      </XStack>
    </YStack>
  );
}

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Input, Spinner, Text, TextArea, XStack, YStack } from 'tamagui';

import { BookCover } from '@/components/BookCover';
import { useAuth } from '@/features/auth/auth-context';
import { useBookDetail } from '@/features/library/use-book-detail';
import { useUpdateItem } from '@/features/library/use-update-item';
import { composedPalette } from '@/theme/cover-palettes';
import { palette, type ReadingStatus, statusColors } from '@/theme/tokens';

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
            coverUrl={book?.cover_url}
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

          {/* description */}
          {book?.description ? (
            <YStack gap="$2">
              <Label>Résumé</Label>
              <Text fontFamily="$body" fontSize={14} color="$colorSoft" lineHeight={21}>
                {book.description}
              </Text>
            </YStack>
          ) : null}

          <Text fontFamily="$body" fontSize={13} color="$colorMuted" lineHeight={20}>
            Les sessions de lecture (progression en pages, dates) arrivent très bientôt.
          </Text>
        </YStack>
      </ScrollView>

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
    borderRadius: 2,
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

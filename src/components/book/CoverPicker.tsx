import { useState } from 'react';
import { ScrollView } from 'react-native';
import { Button, Input, Spinner, Text, XStack, YStack } from 'tamagui';

import { BookCover } from '@/components/BookCover';
import { useBookSearch } from '@/features/books/use-book-search';
import { useUpdateItem } from '@/features/library/use-update-item';
import { openLibraryCover } from '@/lib/cover';
import { palette } from '@/theme/tokens';

function Label({ children }: { children: string }) {
  return (
    <Text
      fontFamily="$body"
      fontSize={11}
      fontWeight="600"
      letterSpacing={1.6}
      textTransform="uppercase"
      color="$colorMuted"
    >
      {children}
    </Text>
  );
}

interface CoverPickerProps {
  itemId: string;
  userId: string | undefined;
  title: string;
  author?: string | null;
  hasOverride: boolean;
}

/** Let the user override a book's cover: pick another edition's cover or paste a URL. */
export function CoverPicker({ itemId, userId, title, author, hasOverride }: CoverPickerProps) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const update = useUpdateItem(itemId, userId);
  const search = useBookSearch();

  const setCover = (value: string | null) => {
    update.mutate({ cover_override: value });
    setOpen(false);
    setUrl('');
  };

  const candidates = (search.data ?? [])
    .map((r) => ({ isbn13: r.isbn13, title: r.title, cover: r.coverUrl ?? openLibraryCover(r.isbn13, 'M') }))
    .slice(0, 12);

  return (
    <YStack gap="$2">
      <Button
        onPress={() => setOpen((o) => !o)}
        chromeless
        height={34}
        alignSelf="flex-start"
        paddingHorizontal={0}
        color="$accent"
        fontFamily="$body"
        fontSize={14}
        fontWeight="600"
      >
        {open ? 'Fermer' : 'Changer la couverture'}
      </Button>

      {open ? (
        <YStack
          gap="$4"
          padding="$3"
          borderWidth={1}
          borderColor="$borderColor"
          borderRadius={2}
          backgroundColor="$background"
        >
          <YStack gap="$2">
            <Label>Coller l'URL d'une image</Label>
            <XStack gap="$2">
              <Input
                flex={1}
                value={url}
                onChangeText={setUrl}
                placeholder="https://…/couverture.jpg"
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor="$concreteLight"
                backgroundColor="$backgroundStrong"
                borderColor="$borderColor"
                borderWidth={1}
                borderRadius={2}
                height={42}
                paddingHorizontal="$3"
                fontFamily="$body"
                fontSize={14}
                color="$color"
              />
              <Button
                onPress={() => url.trim() && setCover(url.trim())}
                backgroundColor="$accent"
                color={palette.paper}
                borderRadius={2}
                height={42}
                paddingHorizontal="$4"
                fontFamily="$body"
                fontWeight="600"
              >
                Appliquer
              </Button>
            </XStack>
          </YStack>

          <YStack gap="$2">
            <Label>Autres éditions</Label>
            <Button
              onPress={() => search.mutate({ title, author: author ?? undefined })}
              disabled={search.isPending}
              backgroundColor="$backgroundStrong"
              borderColor="$borderColor"
              borderWidth={1}
              color="$color"
              borderRadius={2}
              height={42}
              fontFamily="$body"
              fontWeight="600"
            >
              {search.isPending ? <Spinner color="$accent" /> : 'Voir d’autres couvertures'}
            </Button>
            {candidates.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <XStack gap="$2" paddingVertical="$1">
                  {candidates.map((c) => (
                    <BookCover
                      key={c.isbn13}
                      title={c.title ?? ''}
                      coverUrl={c.cover}
                      isbn={c.isbn13}
                      width={64}
                      onPress={() => setCover(c.cover)}
                    />
                  ))}
                </XStack>
              </ScrollView>
            ) : search.isSuccess ? (
              <Text fontFamily="$body" fontSize={13} color="$colorMuted">
                Aucune autre couverture trouvée — collez plutôt une URL d'image.
              </Text>
            ) : null}
          </YStack>

          {hasOverride ? (
            <Button
              onPress={() => setCover(null)}
              chromeless
              alignSelf="flex-start"
              height={32}
              paddingHorizontal={0}
              color="$signal"
              fontFamily="$body"
              fontSize={14}
            >
              Rétablir la couverture d'origine
            </Button>
          ) : null}
        </YStack>
      ) : null}
    </YStack>
  );
}

import { useState } from 'react';
import { Modal, ScrollView, View } from 'react-native';
import { Button, Text, XStack, YStack } from 'tamagui';

import { BookCover } from '@/components/BookCover';
import { BookLoader } from '@/components/BookLoader';
import { type RecapBook, useYearRecap } from '@/features/stats/use-year-recap';
import {
  shareWrappedImage,
  shareWrappedText,
  shareWrappedVideo,
  wrappedCapabilities,
  type WrappedShareData,
} from '@/features/stats/wrapped-share';
import { useT } from '@/i18n';
import { palette } from '@/theme/tokens';

/** A fanned-out spread of the year's book covers, like a hand of cards. */
function CoverFan({ books }: { books: RecapBook[] }) {
  const shown = books.slice(0, 5);
  const mid = (shown.length - 1) / 2;
  return (
    <YStack height={210} width="100%" alignItems="center" justifyContent="center">
      {shown.map((b, i) => {
        const off = i - mid;
        return (
          <View
            key={b.itemId}
            style={{
              position: 'absolute',
              transform: [
                { translateX: off * 44 },
                { translateY: Math.abs(off) * 10 },
                { rotate: `${off * 9}deg` },
              ],
              zIndex: i,
              shadowColor: '#1C1A17',
              shadowOpacity: 0.2,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 8 },
            }}
          >
            <BookCover
              title={b.title}
              coverUrl={b.coverUrl}
              isbn={b.isbn13 ?? undefined}
              width={98}
            />
          </View>
        );
      })}
    </YStack>
  );
}

function StatBig({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <YStack flex={1} alignItems="center" gap={2}>
      <Text fontFamily="$heading" fontSize={50} fontWeight="500" color={color} lineHeight={54}>
        {value}
      </Text>
      <Text fontFamily="$body" fontSize={14} color="$colorMuted" textAlign="center">
        {label}
      </Text>
    </YStack>
  );
}

function SectionTitle({ children }: { children: string }) {
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

/** A slim 12-month rhythm chart of when the books were finished. */
function MonthRhythm({ byMonth }: { byMonth: { label: string; count: number; month: number }[] }) {
  const max = Math.max(1, ...byMonth.map((m) => m.count));
  return (
    <XStack height={72} alignItems="flex-end" gap={4} width="100%">
      {byMonth.map((m) => (
        <YStack key={m.month} flex={1} alignItems="center" gap={4}>
          <YStack
            width="100%"
            height={Math.max(3, Math.round((m.count / max) * 52))}
            borderRadius={3}
            backgroundColor={m.count > 0 ? palette.aizome : '$borderColor'}
            opacity={m.count > 0 ? 1 : 0.5}
          />
          <Text fontFamily="$body" fontSize={8} color="$colorMuted">
            {m.label.slice(0, 1)}
          </Text>
        </YStack>
      ))}
    </XStack>
  );
}

/** A 0–5 rating as ★ glyphs (½ shown when the half-step is set). */
function stars(rating: number): string {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - (half ? 1 : 0));
}

function RatedRow({ book }: { book: RecapBook }) {
  return (
    <XStack gap="$3" alignItems="center">
      <BookCover
        title={book.title}
        coverUrl={book.coverUrl}
        isbn={book.isbn13 ?? undefined}
        width={30}
      />
      <Text fontFamily="$body" fontSize={14} color="$color" flex={1} numberOfLines={1}>
        {book.title}
      </Text>
      {book.rating != null ? (
        <Text fontFamily="$body" fontSize={13} color={palette.ochre}>
          {stars(book.rating)}
        </Text>
      ) : null}
    </XStack>
  );
}

/**
 * A shareable "year in reading" recap — fanned covers, the year's headline
 * numbers, the themes you explored, your reading rhythm, and the dated list of
 * what you read. Rendered in a Modal so it sits above the tab bar everywhere.
 */
export function YearRecap({
  userId,
  year,
  onClose,
}: {
  userId: string | undefined;
  year: number;
  onClose: () => void;
}) {
  const { t } = useT();
  const { data, isLoading } = useYearRecap(userId, year);

  const monthFmt = (iso: string) => {
    const d = new Date(`${iso}T00:00:00`);
    const s = d.toLocaleDateString('fr-FR', { month: 'long' });
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  const caps = wrappedCapabilities();
  const [busy, setBusy] = useState<null | 'image' | 'video'>(null);
  const [vidPct, setVidPct] = useState(0);

  const shareData = (): WrappedShareData => ({
    year,
    booksRead: data?.booksRead ?? 0,
    pages: data?.pages ?? 0,
    pagesApproximate: data?.pagesApproximate ?? false,
    topAuthor: data?.topAuthor ?? null,
    topTheme: data?.themes?.[0]?.value ?? null,
    busiestMonth:
      data?.busiestMonth && data.busiestMonth.count > 1
        ? { label: data.busiestMonth.label, count: data.busiestMonth.count }
        : null,
    byMonth: data?.byMonth?.map((m) => m.count) ?? [],
    avgRating: data?.avgRating ?? null,
  });

  const onImage = async () => {
    setBusy('image');
    try {
      await shareWrappedImage(shareData());
    } finally {
      setBusy(null);
    }
  };
  const onVideo = async () => {
    setBusy('video');
    setVidPct(0);
    try {
      await shareWrappedVideo(shareData(), setVidPct);
    } finally {
      setBusy(null);
    }
  };
  const onText = () => shareWrappedText(shareData());

  const empty = !isLoading && (!data || data.booksRead === 0);

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <YStack flex={1} backgroundColor="$background">
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingTop: 56,
            paddingBottom: 24,
            alignItems: 'center',
          }}
        >
          <Text
            fontFamily="$body"
            fontSize={12}
            fontWeight="600"
            letterSpacing={3}
            textTransform="uppercase"
            color="$colorMuted"
          >
            Colophon
          </Text>
          <Text
            fontFamily="$heading"
            fontSize={34}
            fontWeight="500"
            color="$color"
            marginTop="$2"
            textAlign="center"
          >
            {t('recap.title', { year })}
          </Text>
          <Text
            fontFamily="$heading"
            fontSize={17}
            fontStyle="italic"
            color={palette.terracotta}
            marginTop="$2"
          >
            {t('recap.subtitle')}
          </Text>

          {isLoading ? (
            <YStack flex={1} alignItems="center" justifyContent="center" paddingVertical="$10">
              <BookLoader size={58} />
            </YStack>
          ) : empty ? (
            <Text
              fontFamily="$body"
              fontSize={15}
              color="$colorSoft"
              textAlign="center"
              marginTop="$8"
              lineHeight={22}
            >
              Aucune lecture terminée cette année pour l'instant. Marquez un livre « Lu » et il
              apparaîtra dans votre bilan.
            </Text>
          ) : (
            data && (
              <>
                <YStack width="100%" marginTop="$6" marginBottom="$5">
                  <CoverFan books={data.books} />
                </YStack>

                <XStack width="100%" maxWidth={440} alignItems="center">
                  <StatBig
                    value={String(data.booksRead)}
                    label={data.booksRead === 1 ? t('recap.bookOne') : t('recap.books')}
                    color={palette.terracotta}
                  />
                  <YStack width={1} height={56} backgroundColor="$borderColor" />
                  <StatBig
                    value={`${data.pagesApproximate ? '~' : ''}${data.pages.toLocaleString('fr-FR')}`}
                    label={t('recap.pages')}
                    color={palette.aizome}
                  />
                </XStack>

                {data.ratedCount > 0 ? (
                  <YStack width="100%" maxWidth={440} gap="$3" marginTop="$7">
                    <SectionTitle>Vos notes</SectionTitle>
                    {data.avgRating != null ? (
                      <XStack alignItems="baseline" gap="$2">
                        <Text fontFamily="$heading" fontSize={30} color={palette.ochre}>
                          {data.avgRating.toFixed(1)}
                        </Text>
                        <Text fontFamily="$body" fontSize={16} color={palette.ochre}>
                          {stars(data.avgRating)}
                        </Text>
                        <Text fontFamily="$body" fontSize={13} color="$colorMuted">
                          {`de moyenne · ${data.ratedCount} noté${data.ratedCount > 1 ? 's' : ''}`}
                        </Text>
                      </XStack>
                    ) : null}
                    {data.loved.length ? (
                      <YStack gap="$2" marginTop="$2">
                        <Text fontFamily="$body" fontSize={12} color="$colorMuted">
                          Vos coups de cœur
                        </Text>
                        {data.loved.map((b) => (
                          <RatedRow key={b.itemId} book={b} />
                        ))}
                      </YStack>
                    ) : null}
                    {data.leastLiked ? (
                      <YStack gap="$2" marginTop="$2">
                        <Text fontFamily="$body" fontSize={12} color="$colorMuted">
                          Le moins emballé
                        </Text>
                        <RatedRow book={data.leastLiked} />
                      </YStack>
                    ) : null}
                  </YStack>
                ) : null}

                {data.reviews.length ? (
                  <YStack width="100%" maxWidth={440} gap="$3" marginTop="$7">
                    <SectionTitle>Vos critiques</SectionTitle>
                    {data.reviews.map((b) => (
                      <YStack
                        key={b.itemId}
                        gap="$1"
                        padding="$3"
                        backgroundColor="$backgroundStrong"
                        borderRadius={14}
                      >
                        <XStack gap="$2" alignItems="center">
                          <Text
                            fontFamily="$body"
                            fontSize={14}
                            fontWeight="600"
                            color="$color"
                            flex={1}
                            numberOfLines={1}
                          >
                            {b.title}
                          </Text>
                          {b.rating != null ? (
                            <Text fontFamily="$body" fontSize={12} color={palette.ochre}>
                              {stars(b.rating)}
                            </Text>
                          ) : null}
                        </XStack>
                        <Text
                          fontFamily="$heading"
                          fontSize={14}
                          fontStyle="italic"
                          color="$colorSoft"
                          numberOfLines={4}
                        >
                          {`« ${b.review} »`}
                        </Text>
                      </YStack>
                    ))}
                  </YStack>
                ) : null}

                {data.themes.length ? (
                  <YStack width="100%" maxWidth={440} gap="$3" marginTop="$7">
                    <SectionTitle>Vos thématiques</SectionTitle>
                    <XStack flexWrap="wrap" gap="$2">
                      {data.themes.map((th) => (
                        <XStack
                          key={th.value}
                          paddingHorizontal="$3"
                          paddingVertical="$2"
                          borderRadius={999}
                          backgroundColor="$backgroundStrong"
                          borderWidth={1}
                          borderColor="$borderColor"
                        >
                          <Text fontFamily="$body" fontSize={13} color="$color">
                            {th.value}
                          </Text>
                        </XStack>
                      ))}
                    </XStack>
                  </YStack>
                ) : null}

                {data.topAuthor || data.busiestMonth ? (
                  <YStack width="100%" maxWidth={440} gap="$2" marginTop="$6">
                    {data.topAuthor ? (
                      <XStack
                        alignItems="center"
                        gap="$3"
                        paddingVertical="$3"
                        paddingHorizontal="$4"
                        backgroundColor="$backgroundStrong"
                        borderRadius={16}
                      >
                        <YStack
                          width={9}
                          height={9}
                          borderRadius={999}
                          backgroundColor={palette.sage}
                        />
                        <Text
                          fontFamily="$body"
                          fontSize={11}
                          fontWeight="600"
                          letterSpacing={1.4}
                          textTransform="uppercase"
                          color="$colorMuted"
                        >
                          {t('recap.topAuthor')}
                        </Text>
                        <Text
                          fontFamily="$heading"
                          fontSize={17}
                          color="$color"
                          flex={1}
                          textAlign="right"
                          numberOfLines={1}
                        >
                          {data.topAuthor}
                        </Text>
                      </XStack>
                    ) : null}
                    {data.busiestMonth && data.busiestMonth.count > 1 ? (
                      <XStack
                        alignItems="center"
                        gap="$3"
                        paddingVertical="$3"
                        paddingHorizontal="$4"
                        backgroundColor="$backgroundStrong"
                        borderRadius={16}
                      >
                        <YStack
                          width={9}
                          height={9}
                          borderRadius={999}
                          backgroundColor={palette.ochre}
                        />
                        <Text
                          fontFamily="$body"
                          fontSize={11}
                          fontWeight="600"
                          letterSpacing={1.4}
                          textTransform="uppercase"
                          color="$colorMuted"
                        >
                          Mois le plus actif
                        </Text>
                        <Text
                          fontFamily="$heading"
                          fontSize={17}
                          color="$color"
                          flex={1}
                          textAlign="right"
                          numberOfLines={1}
                        >
                          {`${data.busiestMonth.label} · ${data.busiestMonth.count}`}
                        </Text>
                      </XStack>
                    ) : null}
                  </YStack>
                ) : null}

                <YStack width="100%" maxWidth={440} gap="$3" marginTop="$7">
                  <SectionTitle>Votre rythme</SectionTitle>
                  <MonthRhythm byMonth={data.byMonth} />
                </YStack>

                <YStack width="100%" maxWidth={440} gap="$3" marginTop="$7">
                  <SectionTitle>Vos lectures</SectionTitle>
                  <YStack gap="$3">
                    {data.books.map((b) => (
                      <XStack key={b.itemId} gap="$3" alignItems="center">
                        <BookCover
                          title={b.title}
                          coverUrl={b.coverUrl}
                          isbn={b.isbn13 ?? undefined}
                          width={34}
                        />
                        <Text
                          fontFamily="$body"
                          fontSize={14}
                          color="$color"
                          flex={1}
                          numberOfLines={1}
                        >
                          {b.title}
                        </Text>
                        <Text fontFamily="$body" fontSize={12} color="$colorMuted">
                          {monthFmt(b.finishedOn)}
                        </Text>
                      </XStack>
                    ))}
                  </YStack>
                </YStack>
              </>
            )
          )}
        </ScrollView>

        <YStack paddingHorizontal="$5" paddingBottom="$7" paddingTop="$3" gap="$2">
          <XStack gap="$2.5" alignItems="center">
            {caps.image ? (
              <>
                <Button
                  onPress={onImage}
                  disabled={empty || !!busy}
                  backgroundColor={palette.terracotta}
                  color={palette.paper}
                  borderRadius={999}
                  height={54}
                  flex={1}
                  fontFamily="$body"
                  fontWeight="600"
                  fontSize={15}
                  opacity={empty || busy === 'video' ? 0.5 : 1}
                  pressStyle={{ opacity: 0.9 }}
                >
                  {busy === 'image' ? '…' : '↓  Image'}
                </Button>
                {caps.video ? (
                  <Button
                    onPress={onVideo}
                    disabled={empty || !!busy}
                    backgroundColor={palette.aizome}
                    color={palette.paper}
                    borderRadius={999}
                    height={54}
                    flex={1}
                    fontFamily="$body"
                    fontWeight="600"
                    fontSize={15}
                    opacity={empty || busy === 'image' ? 0.5 : 1}
                    pressStyle={{ opacity: 0.9 }}
                  >
                    {busy === 'video' ? `Vidéo ${Math.round(vidPct * 100)}%` : '▶  Vidéo'}
                  </Button>
                ) : null}
              </>
            ) : (
              <Button
                onPress={onText}
                disabled={empty}
                backgroundColor={palette.terracotta}
                color={palette.paper}
                borderRadius={999}
                height={54}
                flex={1}
                fontFamily="$body"
                fontWeight="600"
                fontSize={16}
                opacity={empty ? 0.5 : 1}
                pressStyle={{ opacity: 0.9 }}
              >
                {`↗  ${t('recap.share')}`}
              </Button>
            )}
            <Button
              onPress={onClose}
              chromeless
              height={54}
              paddingHorizontal="$3"
              color="$colorMuted"
              fontFamily="$body"
              fontWeight="600"
              fontSize={15}
            >
              {t('recap.close')}
            </Button>
          </XStack>
          {caps.video ? (
            <Text fontFamily="$body" fontSize={12} color="$colorMuted" textAlign="center">
              {busy === 'video'
                ? 'Génération de la vidéo…'
                : 'Image à poster · vidéo animée aux couleurs Colophon'}
            </Text>
          ) : null}
        </YStack>
      </YStack>
    </Modal>
  );
}

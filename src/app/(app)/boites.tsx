import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Linking, Modal, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Input, Text, TextArea, XStack, YStack } from 'tamagui';

import { BookLoader } from '@/components/BookLoader';
import { Card, SectionLabel } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-context';
import {
  type BookBox,
  boxPhotoUrl,
  getCurrentLocation,
  pickBoxPhoto,
  useAddBox,
  useAddDonation,
  useBookBoxes,
  useBoxDonations,
} from '@/features/places/use-book-boxes';
import { palette } from '@/theme/tokens';

const mapsUrl = (lat: number, lng: number) =>
  `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

function PhotoOrPlaceholder({ path, height }: { path: string | null; height: number }) {
  const url = boxPhotoUrl(path);
  if (url) {
    return (
      <Image
        source={{ uri: url }}
        style={{ width: '100%', height, borderRadius: 12, backgroundColor: palette.surfaceWarmAlt }}
        resizeMode="cover"
      />
    );
  }
  return (
    <YStack
      height={height}
      borderRadius={12}
      backgroundColor="$backgroundStrong"
      borderColor="$borderColor"
      borderWidth={1}
      alignItems="center"
      justifyContent="center"
    >
      <Text fontSize={30}>📚</Text>
    </YStack>
  );
}

/** Add-a-box form, in a bottom modal. */
function AddBoxModal({ onClose }: { onClose: () => void }) {
  const { session } = useAuth();
  const add = useAddBox(session?.user.id);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState<{ uri: string; base64: string } | null>(null);
  const [loc, setLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const locate = async () => {
    setLocating(true);
    setErr(null);
    const l = await getCurrentLocation();
    setLocating(false);
    if (l) setLoc(l);
    else setErr('Position indisponible — saisissez les coordonnées à la main.');
  };

  const onPick = async () => {
    try {
      setErr(null);
      const p = await pickBoxPhoto();
      if (p) setPhoto(p);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Photo illisible.');
    }
  };

  const submit = () => {
    if (!name.trim() || !loc) return;
    setErr(null);
    add.mutate(
      {
        name,
        note,
        city,
        lat: loc.lat,
        lng: loc.lng,
        photoBase64: photo?.base64 ?? null,
      },
      { onSuccess: onClose, onError: (e) => setErr(e instanceof Error ? e.message : 'Erreur.') },
    );
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <YStack flex={1} backgroundColor="$background">
        <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 56, gap: 16 }}>
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontFamily="$heading" fontSize={26} color="$color">
              Nouvelle boîte à livres
            </Text>
            <Text
              onPress={onClose}
              color="$accent"
              fontFamily="$body"
              fontWeight="600"
              fontSize={15}
            >
              Fermer
            </Text>
          </XStack>

          <Pressable onPress={onPick}>
            {photo ? (
              <Image
                source={{ uri: photo.uri }}
                style={{ width: '100%', height: 180, borderRadius: 14 }}
                resizeMode="cover"
              />
            ) : (
              <YStack
                height={140}
                borderRadius={14}
                borderWidth={1}
                borderColor="$borderColor"
                borderStyle="dashed"
                backgroundColor="$backgroundStrong"
                alignItems="center"
                justifyContent="center"
                gap="$1"
              >
                <Text fontSize={26}>📷</Text>
                <Text fontFamily="$body" fontSize={14} color="$colorMuted">
                  Ajouter une photo
                </Text>
              </YStack>
            )}
          </Pressable>

          <YStack gap="$2">
            <SectionLabel>Nom du lieu</SectionLabel>
            <Input
              value={name}
              onChangeText={setName}
              placeholder="Boîte à livres du parc…"
              backgroundColor="$backgroundStrong"
              borderColor="$borderColor"
              borderWidth={1}
              borderRadius={12}
              height={48}
              fontFamily="$body"
              color="$color"
            />
          </YStack>

          <YStack gap="$2">
            <SectionLabel>Ville (optionnel)</SectionLabel>
            <Input
              value={city}
              onChangeText={setCity}
              placeholder="Bordeaux"
              backgroundColor="$backgroundStrong"
              borderColor="$borderColor"
              borderWidth={1}
              borderRadius={12}
              height={48}
              fontFamily="$body"
              color="$color"
            />
          </YStack>

          <YStack gap="$2">
            <SectionLabel>Emplacement</SectionLabel>
            <XStack gap="$2" alignItems="center">
              <Button
                onPress={locate}
                disabled={locating}
                backgroundColor="$backgroundStrong"
                borderColor="$borderColor"
                borderWidth={1}
                color="$color"
                borderRadius={12}
                height={48}
                fontFamily="$body"
                fontWeight="600"
              >
                {locating ? 'Localisation…' : '📍 Utiliser ma position'}
              </Button>
              <Text fontFamily="$body" fontSize={13} color="$colorSoft" flex={1}>
                {loc ? `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}` : 'Non définie'}
              </Text>
            </XStack>
          </YStack>

          <YStack gap="$2">
            <SectionLabel>Note (optionnel)</SectionLabel>
            <TextArea
              value={note}
              onChangeText={setNote}
              placeholder="Toujours bien fournie en BD, à côté de la boulangerie…"
              backgroundColor="$backgroundStrong"
              borderColor="$borderColor"
              borderWidth={1}
              borderRadius={12}
              minHeight={80}
              fontFamily="$body"
              color="$color"
            />
          </YStack>

          {err ? (
            <Text fontFamily="$body" fontSize={13} color="$signal">
              {err}
            </Text>
          ) : null}

          <Button
            onPress={submit}
            disabled={!name.trim() || !loc || add.isPending}
            backgroundColor={palette.brick}
            color={palette.paper}
            borderRadius={14}
            height={52}
            fontFamily="$body"
            fontWeight="700"
            fontSize={16}
            opacity={!name.trim() || !loc || add.isPending ? 0.5 : 1}
          >
            {add.isPending ? 'Enregistrement…' : 'Ajouter la boîte'}
          </Button>
        </ScrollView>
      </YStack>
    </Modal>
  );
}

/** Box detail: photo, note, directions, and the log of dropped books. */
function BoxDetailModal({ box, onClose }: { box: BookBox; onClose: () => void }) {
  const { session } = useAuth();
  const { data: donations, isLoading } = useBoxDonations(box.id);
  const addDon = useAddDonation(session?.user.id);
  const [title, setTitle] = useState('');

  const drop = () => {
    if (!title.trim()) return;
    addDon.mutate({ boxId: box.id, title }, { onSuccess: () => setTitle('') });
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <YStack flex={1} backgroundColor="$background">
        <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 56, gap: 16 }}>
          <XStack justifyContent="space-between" alignItems="flex-start" gap="$3">
            <YStack flex={1}>
              <Text fontFamily="$heading" fontSize={26} color="$color">
                {box.name}
              </Text>
              {box.city ? (
                <Text fontFamily="$body" fontSize={14} color="$colorMuted">
                  {box.city}
                </Text>
              ) : null}
            </YStack>
            <Text
              onPress={onClose}
              color="$accent"
              fontFamily="$body"
              fontWeight="600"
              fontSize={15}
            >
              Fermer
            </Text>
          </XStack>

          <PhotoOrPlaceholder path={box.photo_path} height={200} />

          {box.note ? (
            <Text fontFamily="$body" fontSize={15} color="$colorSoft" lineHeight={22}>
              {box.note}
            </Text>
          ) : null}

          <Button
            onPress={() => void Linking.openURL(mapsUrl(box.lat, box.lng))}
            backgroundColor={palette.prussian}
            color={palette.paper}
            borderRadius={12}
            height={48}
            fontFamily="$body"
            fontWeight="600"
          >
            📍 Y aller
          </Button>

          <YStack gap="$2" marginTop="$2">
            <SectionLabel>Livres déposés ici</SectionLabel>
            <XStack gap="$2" alignItems="center">
              <Input
                value={title}
                onChangeText={setTitle}
                placeholder="Titre du livre que vous déposez…"
                flex={1}
                backgroundColor="$backgroundStrong"
                borderColor="$borderColor"
                borderWidth={1}
                borderRadius={12}
                height={46}
                fontFamily="$body"
                color="$color"
              />
              <Button
                onPress={drop}
                disabled={!title.trim() || addDon.isPending}
                backgroundColor={palette.forest}
                color={palette.paper}
                borderRadius={12}
                height={46}
                paddingHorizontal="$4"
                fontFamily="$body"
                fontWeight="600"
                opacity={!title.trim() || addDon.isPending ? 0.5 : 1}
              >
                Déposer
              </Button>
            </XStack>

            {isLoading ? (
              <BookLoader size={36} />
            ) : (donations ?? []).length === 0 ? (
              <Text fontFamily="$body" fontSize={14} color="$colorMuted">
                Aucun livre déposé pour l’instant. Soyez le premier !
              </Text>
            ) : (
              <YStack gap="$2" marginTop="$1">
                {donations!.map((d) => (
                  <XStack
                    key={d.id}
                    gap="$2"
                    alignItems="center"
                    paddingVertical="$2"
                    borderBottomColor="$borderColor"
                    borderBottomWidth={1}
                  >
                    <Text fontSize={15}>📕</Text>
                    <Text
                      fontFamily="$body"
                      fontSize={15}
                      color="$color"
                      flex={1}
                      numberOfLines={1}
                    >
                      {d.title}
                    </Text>
                    <Text fontFamily="$body" fontSize={12} color="$colorMuted">
                      {d.donated_on}
                    </Text>
                  </XStack>
                ))}
              </YStack>
            )}
          </YStack>
        </ScrollView>
      </YStack>
    </Modal>
  );
}

export default function BookBoxesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: boxes, isLoading } = useBookBoxes();
  const [adding, setAdding] = useState(false);
  const [open, setOpen] = useState<BookBox | null>(null);

  return (
    <YStack flex={1} backgroundColor="$background" paddingTop={insets.top}>
      <XStack
        alignItems="center"
        gap="$2"
        paddingHorizontal="$3"
        paddingVertical="$2"
        borderBottomColor="$borderColor"
        borderBottomWidth={1}
      >
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text fontFamily="$heading" fontSize={24} color="$color">
            ‹
          </Text>
        </Pressable>
        <YStack flex={1}>
          <Text fontFamily="$heading" fontSize={18} color="$color">
            Boîtes à livres
          </Text>
          <Text fontFamily="$body" fontSize={12} color="$colorMuted">
            La carte communautaire du partage
          </Text>
        </YStack>
        <Button
          onPress={() => setAdding(true)}
          height={32}
          paddingHorizontal="$3"
          borderRadius={999}
          backgroundColor={palette.brick}
          color={palette.paper}
          fontFamily="$body"
          fontSize={13}
          fontWeight="700"
          pressStyle={{ opacity: 0.85 }}
        >
          ＋ Ajouter
        </Button>
      </XStack>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}>
        {isLoading ? (
          <YStack alignItems="center" paddingVertical="$8">
            <BookLoader size={48} />
          </YStack>
        ) : (boxes ?? []).length === 0 ? (
          <YStack alignItems="center" gap="$3" paddingVertical="$8">
            <Text fontSize={40}>📚</Text>
            <Text fontFamily="$body" fontSize={15} color="$colorSoft" textAlign="center">
              Aucune boîte à livres signalée pour l’instant.{'\n'}Ajoutez-en une que vous connaissez
              !
            </Text>
          </YStack>
        ) : (
          (boxes ?? []).map((b) => (
            <Pressable key={b.id} onPress={() => setOpen(b)}>
              <Card padding={0} overflow="hidden">
                <PhotoOrPlaceholder path={b.photo_path} height={150} />
                <YStack padding="$3" gap="$1">
                  <Text fontFamily="$heading" fontSize={18} color="$color" numberOfLines={1}>
                    {b.name}
                  </Text>
                  {b.city ? (
                    <Text fontFamily="$body" fontSize={13} color="$colorMuted">
                      {b.city}
                    </Text>
                  ) : null}
                  {b.note ? (
                    <Text fontFamily="$body" fontSize={14} color="$colorSoft" numberOfLines={2}>
                      {b.note}
                    </Text>
                  ) : null}
                  <Text fontFamily="$body" fontSize={13} color={palette.forest} marginTop="$1">
                    {b.donationCount} livre{b.donationCount > 1 ? 's' : ''} déposé
                    {b.donationCount > 1 ? 's' : ''}
                  </Text>
                </YStack>
              </Card>
            </Pressable>
          ))
        )}
      </ScrollView>

      {adding ? <AddBoxModal onClose={() => setAdding(false)} /> : null}
      {open ? <BoxDetailModal box={open} onClose={() => setOpen(null)} /> : null}
    </YStack>
  );
}

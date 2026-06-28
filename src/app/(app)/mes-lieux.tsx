import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Spinner, Text, TextArea, XStack, YStack } from 'tamagui';

import { useAuth } from '@/features/auth/auth-context';
import { type MyPlace, useMyPlaces, useUserPlaceActions } from '@/features/places/use-places';
import { palette } from '@/theme/tokens';

const TYPE_META: Record<string, { label: string; color: string }> = {
  librairie: { label: 'Librairie', color: palette.brick },
  festival: { label: 'Festival', color: palette.gold },
  cafe_philo: { label: 'Café philo', color: palette.prussian },
  cercle_lecture: { label: 'Cercle', color: palette.forest },
  atelier_ecriture: { label: 'Atelier', color: '#6B5B95' },
};

function PlaceRow({
  place,
  onSaveNote,
  onRemove,
}: {
  place: MyPlace;
  onSaveNote: (note: string) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(place.note ?? '');
  const meta = TYPE_META[place.place_type ?? ''] ?? {
    label: place.place_type ?? '',
    color: palette.ink,
  };

  return (
    <YStack
      gap="$2"
      padding="$3"
      backgroundColor="$backgroundStrong"
      borderColor="$borderColor"
      borderWidth={1}
      borderRadius={14}
    >
      <XStack alignItems="flex-start" gap="$3">
        <YStack flex={1} gap="$1">
          <XStack alignItems="center" gap="$2">
            <YStack width={9} height={9} borderRadius={999} backgroundColor={meta.color} />
            <Text
              fontFamily="$body"
              fontSize={10.5}
              fontWeight="700"
              letterSpacing={1.2}
              textTransform="uppercase"
              color={meta.color}
            >
              {meta.label}
            </Text>
          </XStack>
          <Text fontFamily="$heading" fontSize={16} color="$color" numberOfLines={2}>
            {place.place_name ?? 'Lieu'}
          </Text>
          {place.place_city ? (
            <Text fontFamily="$body" fontSize={12.5} color="$colorMuted">
              {place.place_city}
            </Text>
          ) : null}
        </YStack>
        <XStack gap="$1" alignItems="center">
          {place.favorite ? (
            <Text fontFamily="$body" fontSize={15} color={palette.brick}>
              ♥
            </Text>
          ) : null}
          {place.visited ? (
            <Text fontFamily="$body" fontSize={13} fontWeight="700" color={palette.forest}>
              ✓
            </Text>
          ) : null}
        </XStack>
      </XStack>

      {editing ? (
        <YStack gap="$2">
          <TextArea
            value={draft}
            onChangeText={setDraft}
            placeholder="Votre anecdote sur ce lieu…"
            placeholderTextColor="$concreteLight"
            backgroundColor="$background"
            borderColor="$borderColor"
            borderWidth={1}
            borderRadius={10}
            minHeight={72}
            padding="$2"
            fontFamily="$body"
            fontSize={14}
            color="$color"
          />
          <XStack gap="$2">
            <Button
              onPress={() => {
                onSaveNote(draft);
                setEditing(false);
              }}
              backgroundColor="$accent"
              color={palette.paper}
              borderRadius={10}
              height={38}
              paddingHorizontal="$4"
              fontFamily="$body"
              fontWeight="600"
              fontSize={14}
            >
              Enregistrer
            </Button>
            <Button
              onPress={() => {
                setDraft(place.note ?? '');
                setEditing(false);
              }}
              chromeless
              height={38}
              color="$colorMuted"
              fontFamily="$body"
              fontSize={14}
            >
              Annuler
            </Button>
          </XStack>
        </YStack>
      ) : place.note ? (
        <Pressable onPress={() => setEditing(true)}>
          <Text
            fontFamily="$body"
            fontSize={14}
            color="$colorSoft"
            lineHeight={20}
            fontStyle="italic"
          >
            « {place.note} »
          </Text>
        </Pressable>
      ) : null}

      <XStack gap="$3" alignItems="center">
        {!place.note && !editing ? (
          <Button
            onPress={() => setEditing(true)}
            chromeless
            paddingHorizontal={0}
            height={28}
            color="$accent"
            fontFamily="$body"
            fontSize={13}
            fontWeight="600"
          >
            + Ajouter une anecdote
          </Button>
        ) : place.note && !editing ? (
          <Button
            onPress={() => setEditing(true)}
            chromeless
            paddingHorizontal={0}
            height={28}
            color="$accent"
            fontFamily="$body"
            fontSize={13}
            fontWeight="600"
          >
            Modifier l’anecdote
          </Button>
        ) : null}
        <Button
          onPress={onRemove}
          chromeless
          paddingHorizontal={0}
          height={28}
          marginLeft="auto"
          color="$colorMuted"
          fontFamily="$body"
          fontSize={13}
        >
          Retirer
        </Button>
      </XStack>
    </YStack>
  );
}

export default function MesLieuxScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const userId = session?.user.id;
  const { data: places, isLoading } = useMyPlaces(userId);
  const { setNote, remove } = useUserPlaceActions(userId);

  const favorites = (places ?? []).filter((p) => p.favorite);
  const visited = (places ?? []).filter((p) => p.visited && !p.favorite);

  const renderRow = (p: MyPlace) => (
    <PlaceRow
      key={p.place_id}
      place={p}
      onSaveNote={(note) =>
        setNote.mutate({
          place: {
            id: p.place_id,
            type: p.place_type ?? '',
            name: p.place_name ?? '',
            city: p.place_city,
          },
          note,
        })
      }
      onRemove={() => remove.mutate(p.place_id)}
    />
  );

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
            Mes lieux
          </Text>
          <Text fontFamily="$body" fontSize={12} color="$colorMuted">
            Coups de cœur & lieux visités
          </Text>
        </YStack>
        <Button
          onPress={() => router.push('/carte')}
          chromeless
          height={32}
          paddingHorizontal="$2"
          color="$accent"
          fontFamily="$body"
          fontSize={13}
          fontWeight="600"
        >
          Carte
        </Button>
      </XStack>

      {isLoading ? (
        <YStack flex={1} alignItems="center" justifyContent="center">
          <Spinner color="$accent" size="large" />
        </YStack>
      ) : (places ?? []).length === 0 ? (
        <YStack flex={1} alignItems="center" justifyContent="center" padding="$6" gap="$2">
          <Text fontFamily="$heading" fontSize={18} color="$color" textAlign="center">
            Aucun lieu enregistré
          </Text>
          <Text
            fontFamily="$body"
            fontSize={14}
            color="$colorMuted"
            textAlign="center"
            lineHeight={21}
          >
            Depuis la carte, ajoutez vos librairies coups de cœur et les lieux visités — et
            racontez-y vos anecdotes.
          </Text>
          <Button
            onPress={() => router.push('/carte')}
            marginTop="$2"
            backgroundColor="$accent"
            color={palette.paper}
            borderRadius={12}
            height={46}
            paddingHorizontal="$5"
            fontFamily="$body"
            fontWeight="600"
          >
            Ouvrir la carte
          </Button>
        </YStack>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 20 }}>
          {favorites.length > 0 ? (
            <YStack gap="$2">
              <Text
                fontFamily="$body"
                fontSize={11}
                fontWeight="600"
                letterSpacing={2.4}
                textTransform="uppercase"
                color="$colorMuted"
              >
                ♥ Coups de cœur · {favorites.length}
              </Text>
              {favorites.map(renderRow)}
            </YStack>
          ) : null}
          {visited.length > 0 ? (
            <YStack gap="$2">
              <Text
                fontFamily="$body"
                fontSize={11}
                fontWeight="600"
                letterSpacing={2.4}
                textTransform="uppercase"
                color="$colorMuted"
              >
                ✓ Visités · {visited.length}
              </Text>
              {visited.map(renderRow)}
            </YStack>
          ) : null}
        </ScrollView>
      )}
    </YStack>
  );
}

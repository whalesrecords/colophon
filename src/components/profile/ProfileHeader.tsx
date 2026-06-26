import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Button, Input, Text, XStack, YStack } from 'tamagui';

import { avatarUrl, useProfile, useUpdateProfile, useUploadAvatar } from '@/features/profile/use-profile';
import { palette } from '@/theme/tokens';

const field = {
  placeholderTextColor: '$concreteLight' as const,
  backgroundColor: '$background' as const,
  borderColor: '$borderColor' as const,
  borderWidth: 1,
  borderRadius: 2,
  height: 42,
  paddingHorizontal: '$3' as const,
  fontFamily: '$body' as const,
  fontSize: 14,
  color: '$color' as const,
};

function Avatar({ uri, initials }: { uri: string | null; initials: string }) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: 64, height: 64, borderRadius: 32 }}
        contentFit="cover"
        transition={150}
      />
    );
  }
  return (
    <YStack
      width={64}
      height={64}
      borderRadius={32}
      backgroundColor="$accent"
      alignItems="center"
      justifyContent="center"
    >
      <Text fontFamily="$heading" fontSize={22} color={palette.paper}>
        {initials}
      </Text>
    </YStack>
  );
}

export function ProfileHeader({
  userId,
  email,
}: {
  userId: string | undefined;
  email: string | undefined;
}) {
  const { data: profile } = useProfile(userId);
  const update = useUpdateProfile(userId);
  const upload = useUploadAvatar(userId);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(profile?.display_name ?? '');
    setPseudo(profile?.pseudo ?? '');
  }, [profile?.display_name, profile?.pseudo]);

  const displayName = profile?.display_name || email?.split('@')[0] || 'Lecteur';
  const avatar = avatarUrl(profile?.avatar_path, profile?.updated_at);
  const initials = displayName.slice(0, 2).toUpperCase();

  const guard = async (fn: () => Promise<unknown>) => {
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    }
  };

  return (
    <YStack gap="$3" marginBottom="$5">
      <XStack gap="$3" alignItems="center">
        <Avatar uri={avatar} initials={initials} />
        <YStack flex={1} gap={2}>
          <Text fontFamily="$heading" fontSize={22} fontWeight="500" color="$color" numberOfLines={1}>
            {displayName}
          </Text>
          {profile?.pseudo ? (
            <Text fontFamily="$body" fontSize={13} color="$accent">{`@${profile.pseudo}`}</Text>
          ) : null}
          <Text fontFamily="$body" fontSize={12} color="$colorMuted" numberOfLines={1}>
            {email}
          </Text>
        </YStack>
        <Button
          onPress={() => setEditing((e) => !e)}
          chromeless
          color="$accent"
          fontFamily="$body"
          fontWeight="600"
          fontSize={14}
        >
          {editing ? 'Fermer' : 'Modifier'}
        </Button>
      </XStack>

      {editing ? (
        <YStack
          gap="$2"
          padding="$3"
          borderWidth={1}
          borderColor="$borderColor"
          borderRadius={2}
          backgroundColor="$backgroundStrong"
        >
          <Button
            onPress={() => guard(() => upload.mutateAsync())}
            disabled={upload.isPending}
            backgroundColor="$accent"
            color={palette.paper}
            borderRadius={2}
            height={42}
            fontFamily="$body"
            fontWeight="600"
          >
            {upload.isPending ? 'Envoi…' : 'Choisir une photo'}
          </Button>
          <XStack gap="$2">
            <Input
              flex={1}
              {...field}
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              placeholder="…ou coller une URL d'image"
            />
            <Button
              onPress={() =>
                url.trim() &&
                guard(async () => {
                  await update.mutateAsync({ avatar_path: url.trim() });
                  setUrl('');
                })
              }
              backgroundColor="$backgroundStrong"
              borderColor="$borderColor"
              borderWidth={1}
              color="$color"
              borderRadius={2}
              height={42}
              paddingHorizontal="$4"
              fontFamily="$body"
              fontWeight="600"
            >
              OK
            </Button>
          </XStack>
          <Input {...field} value={name} onChangeText={setName} placeholder="Nom affiché" />
          <Input
            {...field}
            value={pseudo}
            onChangeText={setPseudo}
            autoCapitalize="none"
            placeholder="Pseudo (unique, optionnel)"
          />
          <Button
            onPress={() =>
              guard(async () => {
                await update.mutateAsync({
                  display_name: name.trim() || null,
                  pseudo: pseudo.trim() || null,
                });
                setEditing(false);
              })
            }
            disabled={update.isPending}
            backgroundColor="$accent"
            color={palette.paper}
            borderRadius={2}
            height={44}
            fontFamily="$body"
            fontWeight="600"
          >
            Enregistrer
          </Button>
          {error ? (
            <Text fontFamily="$body" fontSize={13} color="$signal">
              {error}
            </Text>
          ) : null}
        </YStack>
      ) : null}
    </YStack>
  );
}

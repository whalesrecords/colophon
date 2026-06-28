import { Image } from 'expo-image';
import { Text, View, YStack } from 'tamagui';

import { avatarUrl } from '@/features/social/use-friends';

function initials(name: string | null, pseudo?: string | null): string {
  const s = (name || pseudo || '?').trim();
  return s.slice(0, 1).toUpperCase();
}

export function Avatar({
  path,
  name,
  pseudo = null,
  size = 44,
  ring,
}: {
  path: string | null;
  name: string | null;
  pseudo?: string | null;
  size?: number;
  ring?: string; // optional border colour (used for overlapping stacks)
}) {
  const url = avatarUrl(path);
  const border = ring ? { borderColor: ring, borderWidth: 2 } : {};
  if (url) {
    return (
      <Image
        source={{ uri: url }}
        style={{ width: size, height: size, borderRadius: size / 2, ...border }}
        contentFit="cover"
      />
    );
  }
  return (
    <YStack
      width={size}
      height={size}
      borderRadius={size / 2}
      backgroundColor="$backgroundStrong"
      borderColor={ring ?? '$borderColor'}
      borderWidth={ring ? 2 : 1}
      alignItems="center"
      justifyContent="center"
    >
      <Text fontFamily="$heading" fontSize={size * 0.4} color="$colorSoft">
        {initials(name, pseudo)}
      </Text>
    </YStack>
  );
}

interface StackPerson {
  user_id: string;
  display_name: string | null;
  avatar_path: string | null;
}

/** Overlapping avatar stack with a "+N" chip when there are more than `max`. */
export function AvatarStack({
  people,
  max = 5,
  size = 30,
  ring = '#FBF6EC',
}: {
  people: StackPerson[];
  max?: number;
  size?: number;
  ring?: string;
}) {
  const shown = people.slice(0, max);
  const extra = people.length - shown.length;
  const overlap = Math.round(size * 0.32);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {shown.map((p, i) => (
        <View
          key={p.user_id}
          style={{ marginLeft: i === 0 ? 0 : -overlap, zIndex: shown.length - i }}
        >
          <Avatar path={p.avatar_path} name={p.display_name} size={size} ring={ring} />
        </View>
      ))}
      {extra > 0 ? (
        <View
          style={{
            marginLeft: -overlap,
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: ring,
            borderWidth: 2,
            backgroundColor: 'rgba(0,0,0,0.06)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text fontFamily="$body" fontSize={size * 0.36} fontWeight="700" color="$colorSoft">
            +{extra}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

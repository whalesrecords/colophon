import { useState } from 'react';
import { Modal, Pressable, ScrollView } from 'react-native';
import { Button, Spinner, Text, YStack } from 'tamagui';

import { useCircles } from '@/features/circles/use-circles';
import {
  shareTasteImage,
  type TasteShareData,
  tasteShareImageSupported,
  tasteShareText,
} from '@/features/stats/taste-share';
import { supabase } from '@/lib/supabase';
import { palette } from '@/theme/tokens';

/** Bottom sheet: share the reading profile as an image (Web Share / download) or
 *  post it into one of your circles (a chat message your friends see). */
export function ShareProfileSheet({
  userId,
  data,
  onClose,
}: {
  userId: string | undefined;
  data: TasteShareData;
  onClose: () => void;
}) {
  const { data: circles } = useCircles(userId);
  const [busyImage, setBusyImage] = useState(false);
  const [posting, setPosting] = useState<string | null>(null);
  const [posted, setPosted] = useState<string | null>(null);

  const onImage = async () => {
    setBusyImage(true);
    try {
      await shareTasteImage(data);
    } catch {
      // ignore (cancelled / unsupported)
    } finally {
      setBusyImage(false);
    }
  };

  const onPost = async (circleId: string) => {
    if (!userId || posting) return;
    setPosting(circleId);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({ circle_id: circleId, user_id: userId, body: tasteShareText(data) });
      if (!error) setPosted(circleId);
    } catch {
      // ignore
    } finally {
      setPosting(null);
    }
  };

  return (
    <Modal transparent visible animationType="slide" onRequestClose={onClose}>
      <YStack flex={1} justifyContent="flex-end">
        <Pressable style={{ flex: 1 }} onPress={onClose}>
          <YStack flex={1} backgroundColor="rgba(0,0,0,0.45)" />
        </Pressable>

        <YStack
          backgroundColor="$background"
          borderTopLeftRadius={18}
          borderTopRightRadius={18}
          borderTopWidth={1}
          borderTopColor="$borderColor"
          padding="$4"
          paddingBottom="$7"
          gap="$4"
          maxHeight="74%"
        >
          <Text fontFamily="$heading" fontSize={20} fontWeight="500" color="$color">
            Partager mon profil de lecture
          </Text>

          <Button
            onPress={onImage}
            disabled={busyImage}
            backgroundColor="$accent"
            color={palette.paper}
            borderRadius={12}
            height={50}
            fontFamily="$body"
            fontWeight="700"
          >
            {busyImage ? (
              <Spinner color={palette.paper} />
            ) : tasteShareImageSupported() ? (
              "Partager l'image"
            ) : (
              'Partager'
            )}
          </Button>

          <YStack gap="$2">
            <Text
              fontFamily="$body"
              fontSize={11}
              fontWeight="700"
              letterSpacing={1.8}
              textTransform="uppercase"
              color="$colorMuted"
            >
              Poster dans un cercle
            </Text>
            {!circles || circles.length === 0 ? (
              <Text fontFamily="$body" fontSize={13} color="$colorMuted">
                Tu n'as pas encore de cercle. Crées-en un depuis Échanges.
              </Text>
            ) : (
              <ScrollView style={{ maxHeight: 240 }}>
                <YStack gap="$2">
                  {circles.map((c) => {
                    const done = posted === c.id;
                    return (
                      <Button
                        key={c.id}
                        onPress={() => onPost(c.id)}
                        disabled={!!posting || done}
                        backgroundColor="$backgroundStrong"
                        borderColor={done ? palette.forest : '$borderColor'}
                        borderWidth={1}
                        color={done ? palette.forest : '$color'}
                        borderRadius={12}
                        height={46}
                        fontFamily="$body"
                        fontWeight="600"
                        justifyContent="flex-start"
                      >
                        {done ? `✓ Posté dans ${c.name}` : posting === c.id ? '…' : c.name}
                      </Button>
                    );
                  })}
                </YStack>
              </ScrollView>
            )}
          </YStack>
        </YStack>
      </YStack>
    </Modal>
  );
}

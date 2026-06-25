import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Input, Spinner, Text, XStack, YStack } from 'tamagui';

import { useAuth } from '@/features/auth/auth-context';
import {
  type Message,
  useCircle,
  useCircleMembers,
  useCircleMessages,
  useLeaveCircle,
  useSendMessage,
} from '@/features/circles/use-circles';
import { palette } from '@/theme/tokens';

export default function CircleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const userId = session?.user.id;
  const { data: circle } = useCircle(id);
  const { data: members } = useCircleMembers(id);
  const { data: messages, isLoading } = useCircleMessages(id);
  const send = useSendMessage(id, userId);
  const leave = useLeaveCircle(userId);
  const [text, setText] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const memberCount = members?.length ?? 0;
  const nameByUser = new Map((members ?? []).map((m) => [m.user_id, m.display_name ?? 'Membre']));

  useEffect(() => {
    const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    return () => clearTimeout(t);
  }, [messages?.length]);

  const onSend = async () => {
    const body = text.trim();
    if (!body) return;
    setText('');
    try {
      await send.mutateAsync(body);
    } catch {
      setText(body);
    }
  };

  const onLeave = async () => {
    try {
      await leave.mutateAsync(id);
      router.back();
    } catch {
      // ignore
    }
  };

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
          <Text fontFamily="$heading" fontSize={18} color="$color" numberOfLines={1}>
            {circle?.name ?? 'Cercle'}
          </Text>
          <Text fontFamily="$body" fontSize={12} color="$colorMuted">
            {memberCount} membre{memberCount > 1 ? 's' : ''}
            {circle?.invite_code ? ` · code ${circle.invite_code}` : ''}
          </Text>
        </YStack>
        <Button
          onPress={onLeave}
          chromeless
          height={32}
          paddingHorizontal="$2"
          color="$colorMuted"
          fontFamily="$body"
          fontSize={13}
        >
          Quitter
        </Button>
      </XStack>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={insets.top + 56}
      >
        {isLoading ? (
          <YStack flex={1} alignItems="center" justifyContent="center">
            <Spinner color="$accent" />
          </YStack>
        ) : (
          <ScrollView ref={scrollRef} contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 20 }}>
            {(messages ?? []).length === 0 ? (
              <Text
                fontFamily="$body"
                fontSize={14}
                color="$colorMuted"
                textAlign="center"
                marginTop="$8"
              >
                Démarrez la discussion — partagez vos impressions de lecture.
              </Text>
            ) : (
              (messages ?? []).map((m) => (
                <Bubble
                  key={m.id}
                  message={m}
                  mine={m.user_id === userId}
                  author={nameByUser.get(m.user_id) ?? 'Membre'}
                />
              ))
            )}
          </ScrollView>
        )}

        <XStack
          gap="$2"
          padding="$3"
          paddingBottom={insets.bottom + 8}
          borderTopColor="$borderColor"
          borderTopWidth={1}
          backgroundColor="$backgroundStrong"
        >
          <Input
            flex={1}
            value={text}
            onChangeText={setText}
            onSubmitEditing={onSend}
            placeholder="Votre message…"
            placeholderTextColor="$concreteLight"
            backgroundColor="$background"
            borderColor="$borderColor"
            borderWidth={1}
            borderRadius={20}
            height={42}
            paddingHorizontal="$3"
            fontFamily="$body"
            fontSize={14}
            color="$color"
          />
          <Button
            onPress={onSend}
            backgroundColor="$accent"
            color={palette.paper}
            borderRadius={999}
            height={42}
            width={42}
            padding={0}
            fontFamily="$heading"
            fontSize={18}
          >
            ↑
          </Button>
        </XStack>
      </KeyboardAvoidingView>
    </YStack>
  );
}

function Bubble({ message, mine, author }: { message: Message; mine: boolean; author: string }) {
  return (
    <YStack alignSelf={mine ? 'flex-end' : 'flex-start'} maxWidth="80%" gap={2}>
      {!mine ? (
        <Text fontFamily="$body" fontSize={11} color="$colorMuted" marginLeft="$2">
          {author}
        </Text>
      ) : null}
      <YStack
        backgroundColor={mine ? '$accent' : '$backgroundStrong'}
        borderColor={mine ? '$accent' : '$borderColor'}
        borderWidth={1}
        borderRadius={14}
        paddingHorizontal="$3"
        paddingVertical="$2"
      >
        <Text fontFamily="$body" fontSize={14} color={mine ? palette.paper : '$color'} lineHeight={20}>
          {message.body}
        </Text>
      </YStack>
    </YStack>
  );
}

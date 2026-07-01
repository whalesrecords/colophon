import { useState } from 'react';
import { Platform, Share } from 'react-native';
import { Button, Text, YStack } from 'tamagui';

import { PackIcon } from '@/components/icons';
import { giftUrl, useCreateGiftShare } from '@/features/sharing/use-gift-list';
import { palette } from '@/theme/tokens';

/** Share the reader's Envies as a wedding-registry-style gift list. Only shown when
 *  there are envies. Creates (or reuses) the wishlist share, then opens the native
 *  share sheet / copies the link. */
export function GiftShareButton({ userId, count }: { userId: string | undefined; count: number }) {
  const create = useCreateGiftShare(userId);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  if (count <= 0) return null;

  const onShare = async () => {
    try {
      const token = await create.mutateAsync();
      const url = giftUrl(token);
      const message = `Ma liste d’envies de livres sur Colophon 🎁 — offre-m’en un chez un libraire indé : ${url}`;
      if (Platform.OS === 'web') {
        const nav = typeof navigator !== 'undefined' ? (navigator as Navigator) : undefined;
        if (nav?.share) {
          await nav.share({ title: 'Ma liste d’envies', text: message, url });
        } else if (nav?.clipboard) {
          await nav.clipboard.writeText(url);
          setCopiedUrl(url);
          setTimeout(() => setCopiedUrl(null), 4000);
        } else {
          setCopiedUrl(url);
        }
      } else {
        await Share.share({ message });
      }
    } catch {
      // user cancelled / share unavailable
    }
  };

  return (
    <YStack gap="$2" marginTop="$1">
      <Button
        onPress={onShare}
        disabled={create.isPending}
        height={44}
        borderRadius={999}
        backgroundColor="$backgroundStrong"
        borderColor="$accent"
        borderWidth={1}
        color="$accent"
        fontFamily="$body"
        fontWeight="600"
        fontSize={14}
        pressStyle={{ opacity: 0.85 }}
        gap="$2"
      >
        <PackIcon name="share" size={16} color={palette.aizome} />
        Partager mes envies · liste de cadeaux
      </Button>
      {copiedUrl ? (
        <Text fontFamily="$body" fontSize={12.5} color="$colorMuted">
          Lien copié : {copiedUrl}
        </Text>
      ) : null}
    </YStack>
  );
}

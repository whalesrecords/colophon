import { Link } from 'expo-router';
import { useState } from 'react';
import { Button, Spinner, Text, XStack, YStack } from 'tamagui';

import { BookPageTurn } from '@/components/BookPageTurn';
import { TextField } from '@/components/Field';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/features/auth/auth-context';
import { authErrorMessage } from '@/features/auth/errors';
import { useT } from '@/i18n';
import { palette } from '@/theme/tokens';

export default function LoginScreen() {
  const { signIn, resetPassword } = useAuth();
  const { t } = useT();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const onSubmit = async () => {
    if (loading) return;
    setError(null);
    setNotice(null);
    setLoading(true);
    const { error: signInError } = await signIn(email, password);
    setLoading(false);
    if (signInError) setError(authErrorMessage(signInError.message));
  };

  const onForgot = async () => {
    setError(null);
    if (!email.trim()) {
      setNotice(t('auth.resetNeedEmail'));
      return;
    }
    // Always confirm (don't reveal whether the address has an account).
    await resetPassword(email);
    setNotice(t('auth.resetSent', { email: email.trim() }));
  };

  return (
    <Screen alignItems="center" justifyContent="center" paddingHorizontal="$6">
      <YStack width="100%" maxWidth={420} gap="$6">
        <YStack alignItems="center" gap="$2">
          <BookPageTurn />
          <Text
            fontFamily="$heading"
            fontSize={44}
            fontWeight="500"
            letterSpacing={-1}
            color="$color"
            marginTop="$4"
          >
            Colophon
          </Text>
          <Text fontFamily="$heading" fontSize={16} fontStyle="italic" color="$colorMuted">
            {t('auth.tagline')}
          </Text>
        </YStack>

        <YStack gap="$4">
          <TextField
            label={t('auth.email')}
            value={email}
            onChangeText={setEmail}
            placeholder={t('auth.emailPlaceholder')}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            inputMode="email"
          />
          <TextField
            label={t('auth.password')}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="current-password"
            onSubmitEditing={onSubmit}
          />
          <Text
            onPress={onForgot}
            alignSelf="flex-end"
            color="$accent"
            fontFamily="$body"
            fontSize={13}
            fontWeight="600"
            paddingVertical="$1"
            pressStyle={{ opacity: 0.6 }}
          >
            {t('auth.forgot')}
          </Text>
        </YStack>

        {error ? (
          <Text color="$signal" fontFamily="$body" fontSize={14}>
            {error}
          </Text>
        ) : null}
        {notice ? (
          <Text color="$colorSoft" fontFamily="$body" fontSize={14}>
            {notice}
          </Text>
        ) : null}

        <Button
          onPress={onSubmit}
          disabled={loading}
          backgroundColor="$accent"
          color={palette.paper}
          borderRadius={12}
          height={52}
          fontFamily="$body"
          fontWeight="600"
          fontSize={16}
          opacity={loading ? 0.8 : 1}
          pressStyle={{ opacity: 0.9, backgroundColor: '$accentDeep' }}
        >
          {loading ? <Spinner color={palette.paper} /> : t('auth.signIn')}
        </Button>

        <XStack justifyContent="center" gap="$2">
          <Text color="$colorMuted" fontFamily="$body" fontSize={14}>
            {t('auth.noAccount')}
          </Text>
          <Link href="/sign-up">
            <Text color="$accent" fontFamily="$body" fontWeight="600" fontSize={14}>
              {t('auth.createAccount')}
            </Text>
          </Link>
        </XStack>
      </YStack>
    </Screen>
  );
}

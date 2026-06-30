import { Link } from 'expo-router';
import { useState } from 'react';
import { Button, Spinner, Text, XStack, YStack } from 'tamagui';

import { TextField } from '@/components/Field';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/features/auth/auth-context';
import { authErrorMessage } from '@/features/auth/errors';
import { useT } from '@/i18n';
import { palette } from '@/theme/tokens';

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const { t } = useT();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);

  const onSubmit = async () => {
    if (loading) return;
    setError(null);
    setLoading(true);
    const { data, error: signUpError } = await signUp(email, password);
    setLoading(false);
    if (signUpError) {
      setError(authErrorMessage(signUpError));
      return;
    }
    // When email confirmation is enabled, no session is returned yet.
    if (!data.session) setCheckEmail(true);
  };

  return (
    <Screen alignItems="center" justifyContent="center" paddingHorizontal="$6">
      <YStack width="100%" maxWidth={420} gap="$6">
        <YStack alignItems="center" gap="$2">
          <Text fontFamily="$heading" fontSize={32} fontWeight="500" color="$color">
            {t('auth.createAccount')}
          </Text>
          <Text fontFamily="$heading" fontSize={15} fontStyle="italic" color="$colorMuted">
            {t('auth.signUpTagline')}
          </Text>
        </YStack>

        {checkEmail ? (
          <YStack
            gap="$3"
            padding="$5"
            backgroundColor="$backgroundStrong"
            borderColor="$borderColor"
            borderWidth={1}
            borderRadius={12}
          >
            <Text fontFamily="$heading" fontSize={18} color="$color">
              {t('auth.checkEmailTitle')}
            </Text>
            <Text fontFamily="$body" fontSize={14} color="$colorSoft" lineHeight={21}>
              {t('auth.checkEmailBody', { email })}
            </Text>
          </YStack>
        ) : (
          <>
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
                placeholder={t('auth.passwordMin')}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                onSubmitEditing={onSubmit}
              />
            </YStack>

            {error ? (
              <Text color="$signal" fontFamily="$body" fontSize={14}>
                {error}
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
              {loading ? <Spinner color={palette.paper} /> : t('auth.createMyAccount')}
            </Button>
          </>
        )}

        <XStack justifyContent="center" gap="$2">
          <Text color="$colorMuted" fontFamily="$body" fontSize={14}>
            {t('auth.haveAccount')}
          </Text>
          <Link href="/login">
            <Text color="$accent" fontFamily="$body" fontWeight="600" fontSize={14}>
              {t('auth.signIn')}
            </Text>
          </Link>
        </XStack>
      </YStack>
    </Screen>
  );
}

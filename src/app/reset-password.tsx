import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Button, Spinner, Text, YStack } from 'tamagui';

import { TextField } from '@/components/Field';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/features/auth/auth-context';
import { useT } from '@/i18n';
import { palette } from '@/theme/tokens';

/**
 * Public landing for the password-reset email link. On web, Supabase parses the
 * recovery token from the URL and creates a (recovery) session, so updateUser can
 * set the new password here. Reached via resetPassword()'s redirectTo.
 */
export default function ResetPasswordScreen() {
  const router = useRouter();
  const { t } = useT();
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const onSubmit = async () => {
    setError(null);
    if (password.length < 6) {
      setError(t('auth.passwordMin'));
      return;
    }
    if (password !== confirm) {
      setError(t('auth.resetMismatch'));
      return;
    }
    setLoading(true);
    const { error: updErr } = await updatePassword(password);
    setLoading(false);
    if (updErr) {
      setError(t('auth.resetInvalid'));
      return;
    }
    setDone(true);
    setTimeout(() => router.replace('/'), 1400);
  };

  return (
    <Screen alignItems="center" justifyContent="center" paddingHorizontal="$6">
      <YStack width="100%" maxWidth={420} gap="$5">
        <YStack gap="$2" alignItems="center">
          <Text fontFamily="$heading" fontSize={28} fontWeight="500" color="$color">
            {t('auth.resetTitle')}
          </Text>
          <Text fontFamily="$heading" fontSize={15} fontStyle="italic" color="$colorMuted" textAlign="center">
            {t('auth.resetBody')}
          </Text>
        </YStack>

        {done ? (
          <Text color="$positive" fontFamily="$body" fontSize={16} fontWeight="600" textAlign="center">
            {t('auth.resetSuccess')}
          </Text>
        ) : (
          <YStack gap="$4">
            <TextField
              label={t('auth.resetNew')}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
            />
            <TextField
              label={t('auth.resetConfirm')}
              value={confirm}
              onChangeText={setConfirm}
              placeholder="••••••••"
              secureTextEntry
              autoCapitalize="none"
              autoComplete="new-password"
              onSubmitEditing={onSubmit}
            />
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
              pressStyle={{ opacity: 0.9 }}
            >
              {loading ? <Spinner color={palette.paper} /> : t('auth.resetSave')}
            </Button>
          </YStack>
        )}
      </YStack>
    </Screen>
  );
}

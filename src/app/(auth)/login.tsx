import { Link } from 'expo-router';
import { useState } from 'react';
import { Button, Spinner, Text, XStack, YStack } from 'tamagui';

import { BookSpines } from '@/components/BookSpines';
import { TextField } from '@/components/Field';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/features/auth/auth-context';
import { authErrorMessage } from '@/features/auth/errors';
import { palette } from '@/theme/tokens';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (loading) return;
    setError(null);
    setLoading(true);
    const { error: signInError } = await signIn(email, password);
    setLoading(false);
    if (signInError) setError(authErrorMessage(signInError.message));
  };

  return (
    <Screen alignItems="center" justifyContent="center" paddingHorizontal="$6">
      <YStack width="100%" maxWidth={420} gap="$6">
        <YStack alignItems="center" gap="$2">
          <BookSpines />
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
            Votre bibliothèque, au calme.
          </Text>
        </YStack>

        <YStack gap="$4">
          <TextField
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            placeholder="vous@exemple.fr"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            inputMode="email"
          />
          <TextField
            label="Mot de passe"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            autoCapitalize="none"
            autoComplete="current-password"
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
          borderRadius={2}
          height={52}
          fontFamily="$body"
          fontWeight="600"
          fontSize={16}
          opacity={loading ? 0.8 : 1}
          pressStyle={{ opacity: 0.9, backgroundColor: '$accentDeep' }}
        >
          {loading ? <Spinner color={palette.paper} /> : 'Se connecter'}
        </Button>

        <XStack justifyContent="center" gap="$2">
          <Text color="$colorMuted" fontFamily="$body" fontSize={14}>
            Pas encore de compte ?
          </Text>
          <Link href="/sign-up">
            <Text color="$accent" fontFamily="$body" fontWeight="600" fontSize={14}>
              Créer un compte
            </Text>
          </Link>
        </XStack>
      </YStack>
    </Screen>
  );
}

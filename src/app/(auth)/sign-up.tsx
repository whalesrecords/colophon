import { Link } from 'expo-router';
import { useState } from 'react';
import { Button, Spinner, Text, XStack, YStack } from 'tamagui';

import { TextField } from '@/components/Field';
import { Screen } from '@/components/Screen';
import { useAuth } from '@/features/auth/auth-context';
import { authErrorMessage } from '@/features/auth/errors';
import { palette } from '@/theme/tokens';

export default function SignUpScreen() {
  const { signUp } = useAuth();
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
      setError(authErrorMessage(signUpError.message));
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
            Créer un compte
          </Text>
          <Text fontFamily="$heading" fontSize={15} fontStyle="italic" color="$colorMuted">
            Quelques secondes, et vos livres ont une maison.
          </Text>
        </YStack>

        {checkEmail ? (
          <YStack
            gap="$3"
            padding="$5"
            backgroundColor="$backgroundStrong"
            borderColor="$borderColor"
            borderWidth={1}
            borderRadius={2}
          >
            <Text fontFamily="$heading" fontSize={18} color="$color">
              Vérifiez vos e-mails
            </Text>
            <Text fontFamily="$body" fontSize={14} color="$colorSoft" lineHeight={21}>
              Un lien de confirmation a été envoyé à {email}. Cliquez dessus pour activer votre
              compte, puis connectez-vous.
            </Text>
          </YStack>
        ) : (
          <>
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
                placeholder="6 caractères minimum"
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
              borderRadius={2}
              height={52}
              fontFamily="$body"
              fontWeight="600"
              fontSize={16}
              opacity={loading ? 0.8 : 1}
              pressStyle={{ opacity: 0.9, backgroundColor: '$accentDeep' }}
            >
              {loading ? <Spinner color={palette.paper} /> : 'Créer mon compte'}
            </Button>
          </>
        )}

        <XStack justifyContent="center" gap="$2">
          <Text color="$colorMuted" fontFamily="$body" fontSize={14}>
            Déjà un compte ?
          </Text>
          <Link href="/login">
            <Text color="$accent" fontFamily="$body" fontWeight="600" fontSize={14}>
              Se connecter
            </Text>
          </Link>
        </XStack>
      </YStack>
    </Screen>
  );
}

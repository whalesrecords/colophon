import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import { Modal, Pressable } from 'react-native';
import { Button, Text, XStack, YStack } from 'tamagui';

import { Icon, type IconName, type PackGlyph, PackIcon } from '@/components/icons';
import { palette } from '@/theme/tokens';

const SEEN_KEY = 'colophon.tourSeen.v1';

type StepIcon = { pack: PackGlyph } | { line: IconName };
interface Step {
  icon: StepIcon;
  tint: string;
  title: string;
  body: string;
}

// The whole app, in eight bubbles. Tone: warm, plain French, no jargon.
const STEPS: Step[] = [
  {
    icon: { pack: 'openBook' },
    tint: palette.espresso,
    title: 'Bienvenue dans Colophon',
    body: 'Votre bibliothèque et votre carnet de lecture, réunis. Un tour rapide pour tout découvrir — moins d’une minute.',
  },
  {
    icon: { line: 'scan' },
    tint: palette.espresso,
    title: 'Cataloguez en un scan',
    body: 'Scannez le code-barres d’un livre avec le bouton central : sa fiche se remplit toute seule. Pas de code-barres ? Ajoutez-le à la main ou par recherche.',
  },
  {
    icon: { pack: 'box' },
    tint: palette.gold,
    title: 'Possédé, emprunté ou envie',
    body: 'Dites ce que vous avez, ce qu’on vous a prêté, et ce qui vous fait envie. Votre bibliothèque garde les trois bien séparés.',
  },
  {
    icon: { pack: 'flame' },
    tint: palette.brick,
    title: 'Suivez vos lectures',
    body: 'Marquez vos livres en cours, notez votre progression en pages, et fixez un objectif quotidien pour garder votre série jour après jour.',
  },
  {
    icon: { pack: 'books' },
    tint: palette.forest,
    title: 'Vos séries, complètes',
    body: 'Colophon repère les tomes qui vous manquent dans une série et vous signale les sorties à venir de vos auteurs.',
  },
  {
    icon: { pack: 'star' },
    tint: palette.gold,
    title: 'Découvrez dans votre style',
    body: 'Des recommandations pensées pour vos goûts, avec un pourcentage d’affinité et les livres de votre bibliothèque dont elles se rapprochent.',
  },
  {
    icon: { pack: 'chat' },
    tint: palette.prussian,
    title: 'Échangez',
    body: 'Rejoignez des cercles de lecture, suivez des amis, lancez des défis et comparez vos classements de la semaine.',
  },
  {
    icon: { pack: 'trophy' },
    tint: palette.forest,
    title: 'Votre profil',
    body: 'Stats, badges, objectif et bilan de l’année — et tout ce que vous pouvez partager. Bonne lecture !',
  },
];

const Ctx = createContext<{ replay: () => void } | undefined>(undefined);

/** Replay the tour from anywhere (e.g. a "Revoir le tutoriel" button in Profil). */
export function useOnboarding() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useOnboarding must be used within OnboardingProvider');
  return c;
}

/** Mounts the first-run tour (once, gated by AsyncStorage) + exposes replay(). */
export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    AsyncStorage.getItem(SEEN_KEY)
      .then((v) => {
        if (!v) {
          setStep(0);
          setOpen(true);
        }
      })
      .catch(() => {});
  }, []);

  const finish = () => {
    setOpen(false);
    AsyncStorage.setItem(SEEN_KEY, '1').catch(() => {});
  };
  const replay = () => {
    setStep(0);
    setOpen(true);
  };

  return (
    <Ctx.Provider value={{ replay }}>
      {children}
      <TourModal open={open} step={step} setStep={setStep} onClose={finish} />
    </Ctx.Provider>
  );
}

function StepGlyph({ icon, tint }: { icon: StepIcon; tint: string }) {
  return (
    <YStack
      width={68}
      height={68}
      borderRadius={999}
      alignItems="center"
      justifyContent="center"
      backgroundColor={palette.surfaceWarmAlt}
      borderWidth={2}
      borderColor={tint}
    >
      {'pack' in icon ? (
        <PackIcon name={icon.pack} size={32} color={tint} />
      ) : (
        <Icon name={icon.line} size={32} color={tint} strokeWidth={1.75} />
      )}
    </YStack>
  );
}

function TourModal({
  open,
  step,
  setStep,
  onClose,
}: {
  open: boolean;
  step: number;
  setStep: (n: number) => void;
  onClose: () => void;
}) {
  const s = STEPS[step];
  const last = step === STEPS.length - 1;
  const first = step === 0;

  return (
    <Modal transparent visible={open} animationType="fade" onRequestClose={onClose}>
      {/* Darkened, matte backdrop. */}
      <YStack
        flex={1}
        backgroundColor="rgba(26,20,14,0.92)"
        alignItems="center"
        justifyContent="center"
        padding="$5"
      >
        <Pressable
          onPress={onClose}
          style={{ position: 'absolute', top: 52, right: 24, padding: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Passer le tutoriel"
        >
          <Text fontFamily="$body" fontSize={14} fontWeight="600" color={palette.paper}>
            Passer
          </Text>
        </Pressable>

        {/* The bubble. */}
        <YStack
          width="100%"
          maxWidth={400}
          backgroundColor={palette.paper}
          borderRadius={22}
          padding="$6"
          gap="$4"
          alignItems="center"
        >
          <StepGlyph icon={s.icon} tint={s.tint} />

          <Text
            fontFamily="$heading"
            fontSize={23}
            fontWeight="600"
            color={palette.ink}
            textAlign="center"
          >
            {s.title}
          </Text>
          <Text
            fontFamily="$body"
            fontSize={15}
            color={palette.inkSoft ?? palette.ink}
            textAlign="center"
            lineHeight={22}
          >
            {s.body}
          </Text>

          {/* Step dots. */}
          <XStack gap={7} paddingVertical="$2">
            {STEPS.map((_, i) => (
              <YStack
                key={i}
                width={i === step ? 22 : 7}
                height={7}
                borderRadius={999}
                backgroundColor={i === step ? palette.espresso : palette.concrete}
                opacity={i === step ? 1 : 0.45}
              />
            ))}
          </XStack>

          <XStack gap="$3" width="100%">
            {!first ? (
              <Button
                onPress={() => setStep(step - 1)}
                flex={1}
                height={50}
                borderRadius={12}
                borderWidth={1}
                borderColor={palette.concrete}
                backgroundColor="transparent"
                color={palette.ink}
                fontFamily="$body"
                fontWeight="600"
                pressStyle={{ opacity: 0.7 }}
              >
                Précédent
              </Button>
            ) : null}
            <Button
              onPress={() => (last ? onClose() : setStep(step + 1))}
              flex={first ? 1 : 1.4}
              height={50}
              borderRadius={12}
              backgroundColor={palette.espresso}
              color={palette.paper}
              fontFamily="$body"
              fontWeight="700"
              pressStyle={{ opacity: 0.88 }}
            >
              {last ? 'C’est parti' : 'Suivant'}
            </Button>
          </XStack>
        </YStack>
      </YStack>
    </Modal>
  );
}

import type { ReactNode } from 'react';
import { ScrollView, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, YStack } from 'tamagui';

const CONTACT = 'hello@whalesrecords.com';

function H({ children }: { children: ReactNode }) {
  return (
    <Text fontFamily="$heading" fontSize={19} fontWeight="500" color="$color" marginTop="$4">
      {children}
    </Text>
  );
}

function P({ children }: { children: ReactNode }) {
  return (
    <Text fontFamily="$body" fontSize={15} color="$colorSoft" lineHeight={23}>
      {children}
    </Text>
  );
}

/** Public support page — required by the App Store (Support URL) and Google Play. */
export default function SupportScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const padH = Math.max(20, (width - 760) / 2);

  return (
    <YStack flex={1} backgroundColor="$background" paddingTop={insets.top}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: padH, paddingTop: 28, paddingBottom: insets.bottom + 48 }}
      >
        <Text fontFamily="$heading" fontSize={30} fontWeight="500" color="$color">
          Aide & support
        </Text>
        <Text fontFamily="$body" fontSize={13} color="$colorMuted" marginTop="$1" marginBottom="$3">
          Colophon · votre bibliothèque, vos lectures
        </Text>

        <P>
          Une question, un bug, une demande ? Écrivez‑nous à {CONTACT} — nous répondons sous quelques
          jours ouvrés.
        </P>

        <H>Ajouter des livres</H>
        <P>
          Onglet « Ajouter » : scannez le code‑barres (EAN/ISBN) d'un livre, saisissez l'ISBN à la
          main ou avec une douchette, recherchez par titre/auteur, ou collez une liste d'ISBN pour un
          import en lot. Les métadonnées (titre, auteur, éditeur, couverture) sont récupérées
          automatiquement par ISBN.
        </P>

        <H>Couvertures manquantes</H>
        <P>
          Sur la fiche d'un livre, « Changer la couverture » → « Recherche approfondie » propose des
          couvertures issues de plusieurs sources ; touchez‑en une, ou collez l'URL d'une image.
        </P>

        <H>Séries</H>
        <P>
          Quand un livre fait partie d'une série, « Compléter la série » liste les tomes et permet de
          les ajouter en une fois (les tomes déjà possédés sont indiqués).
        </P>

        <H>Cercles de lecture</H>
        <P>
          Créez un cercle ou rejoignez‑en un avec un code d'invitation : bibliothèque commune,
          discussions en temps réel, propositions de lecture et agenda partagé.
        </P>

        <H>Signaler un contenu ou un membre</H>
        <P>
          Les cercles contiennent des messages écrits par d'autres membres. Pour signaler un contenu
          inapproprié ou un comportement abusif, écrivez à {CONTACT} en précisant le cercle et le
          message concerné : nous traitons les signalements et pouvons retirer un contenu ou exclure
          un membre. Le créateur d'un cercle peut également en gérer les membres.
        </P>

        <H>Exporter vos données</H>
        <P>
          Profil → Données → « Exporter en CSV » télécharge toute votre bibliothèque (titre, auteurs,
          ISBN, statut, note, étagères, tags…).
        </P>

        <H>Supprimer votre compte</H>
        <P>
          Profil → « Supprimer mon compte » : action définitive qui efface l'ensemble de vos données.
        </P>

        <H>Confidentialité</H>
        <P>
          Notre politique de confidentialité est disponible sur la page /privacy. Nous ne vendons pas
          vos données et n'intégrons pas de traceurs publicitaires.
        </P>

        <H>Nous contacter</H>
        <P>Whales Records (Julien Marchal) — {CONTACT}.</P>
      </ScrollView>
    </YStack>
  );
}

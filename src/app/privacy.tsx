import { ScrollView, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text, YStack } from 'tamagui';

const UPDATED = '25 juin 2026';
const CONTACT = 'hello@whalesrecords.com';

function H({ children }: { children: string }) {
  return (
    <Text fontFamily="$heading" fontSize={19} fontWeight="500" color="$color" marginTop="$4">
      {children}
    </Text>
  );
}

function P({ children }: { children: string }) {
  return (
    <Text fontFamily="$body" fontSize={15} color="$colorSoft" lineHeight={23}>
      {children}
    </Text>
  );
}

/** Public privacy policy — required by the App Store and Google Play. */
export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const padH = Math.max(20, (width - 760) / 2);

  return (
    <YStack flex={1} backgroundColor="$background" paddingTop={insets.top}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: padH, paddingTop: 28, paddingBottom: insets.bottom + 48 }}
      >
        <Text fontFamily="$heading" fontSize={30} fontWeight="500" color="$color">
          Politique de confidentialité
        </Text>
        <Text fontFamily="$body" fontSize={13} color="$colorMuted" marginTop="$1" marginBottom="$3">
          Colophon · Mise à jour : {UPDATED}
        </Text>

        <P>
          Colophon est une application de gestion de bibliothèque personnelle et de suivi de lecture.
          Cette politique explique quelles données nous traitons, pourquoi, et vos droits.
        </P>

        <H>Responsable</H>
        <P>
          Colophon est édité par Whales Records (Julien Marchal). Pour toute question relative à vos
          données : {CONTACT}.
        </P>

        <H>Données que nous traitons</H>
        <P>
          • Compte : votre adresse e‑mail et un mot de passe (chiffré), pour l'authentification.
        </P>
        <P>
          • Votre bibliothèque et vos lectures : les livres que vous ajoutez (ISBN, métadonnées),
          ainsi que les informations que vous saisissez — statut de lecture, notes, sessions de
          lecture, prêts, étagères, tags, couvertures personnalisées.
        </P>
        <P>
          • Contenu social (facultatif) : si vous créez ou rejoignez un cercle de lecture, votre nom
          d'affichage, vos messages, commentaires, propositions, votes et rendez‑vous sont visibles
          des membres de ce cercle.
        </P>
        <P>
          • Partage : si vous générez un lien de partage public, les livres concernés deviennent
          consultables par toute personne disposant du lien (sans vos notes ni vos achats).
        </P>

        <H>Finalités</H>
        <P>
          Ces données servent uniquement à fournir le service : afficher votre bibliothèque, suivre
          vos lectures, et faire fonctionner les cercles de lecture. Nous n'utilisons pas vos données
          à des fins publicitaires.
        </P>

        <H>Hébergement et sous‑traitants</H>
        <P>
          Les données sont hébergées par Supabase (base de données PostgreSQL et authentification),
          en Union européenne. La version web est distribuée via Vercel. Les métadonnées et
          couvertures des livres proviennent d'API publiques (Google Books, Open Library, et la
          Bibliothèque nationale de France) interrogées par ISBN.
        </P>

        <H>Pas de publicité ni de revente</H>
        <P>
          Nous ne vendons pas vos données, ne les partageons pas à des fins publicitaires, et
          n'intégrons pas de traceurs publicitaires tiers.
        </P>

        <H>Conservation</H>
        <P>
          Vos données sont conservées tant que votre compte existe. Vous pouvez supprimer votre
          compte à tout moment depuis l'application (Profil → Supprimer mon compte) : cette action
          est définitive et efface l'ensemble de vos données associées.
        </P>

        <H>Vos droits</H>
        <P>
          Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, et de suppression
          de vos données. La suppression est disponible directement dans l'application ; pour toute
          autre demande, écrivez à {CONTACT}.
        </P>

        <H>Enfants</H>
        <P>
          Colophon ne s'adresse pas aux enfants de moins de 13 ans et ne collecte pas sciemment leurs
          données.
        </P>

        <H>Modifications</H>
        <P>
          Cette politique peut évoluer ; la date de mise à jour ci‑dessus indique la dernière
          version. Pour toute question : {CONTACT}.
        </P>
      </ScrollView>
    </YStack>
  );
}

/**
 * UI translations. French is the source language and the fallback: any key
 * missing from another locale falls back to French, so the app is never broken
 * mid-translation. Add locales by filling in the parallel dictionary.
 */
export const fr = {
  // Tabs
  'tabs.library': 'Bibliothèque',
  'tabs.trends': 'Tendances',
  'tabs.scan': 'Scan',
  'tabs.exchanges': 'Échanges',
  'tabs.profile': 'Profil',

  // Auth
  'auth.tagline': 'Votre bibliothèque, au calme.',
  'auth.email': 'E-mail',
  'auth.password': 'Mot de passe',
  'auth.emailPlaceholder': 'vous@exemple.fr',
  'auth.signIn': 'Se connecter',
  'auth.noAccount': 'Pas encore de compte ?',
  'auth.createAccount': 'Créer un compte',
  'auth.signUpTagline': 'Quelques secondes, et vos livres ont une maison.',
  'auth.checkEmailTitle': 'Vérifiez vos e-mails',
  'auth.checkEmailBody':
    'Un lien de confirmation a été envoyé à {email}. Cliquez dessus pour activer votre compte, puis connectez-vous.',
  'auth.passwordMin': '6 caractères minimum',
  'auth.createMyAccount': 'Créer mon compte',
  'auth.haveAccount': 'Déjà un compte ?',

  // Reading status
  'status.to_read': 'À lire',
  'status.reading': 'En cours',
  'status.read': 'Lu',
  'status.abandoned': 'Abandonné',

  // Profile / settings
  'profile.book': 'Livre',
  'profile.books': 'Livres',
  'profile.readInYear': 'Lus en {year}',
  'profile.pagesRead': 'Pages lues',
  'profile.byStatus': 'Par statut',
  'profile.differentAuthors': 'Auteurs différents',
  'profile.goalHint':
    'Définissez un objectif de lecture annuel et suivez votre temps de lecture — bientôt.',
  'profile.classification': 'Classement',
  'facet.genre': 'Genres',
  'facet.shelf': 'Étagères',
  'facet.tag': 'Tags',
  'facet.decade': 'Décennies',
  'facet.language': 'Langues',
  'profile.suggestedShelves': 'Étagères suggérées',
  'profile.suggestedShelvesHint':
    "D'après votre bibliothèque. Touchez pour créer l'étagère et y ranger les livres automatiquement.",
  'profile.loans': 'Prêtés',
  'profile.loansOne': '1 livre actuellement prêté',
  'profile.loansMany': '{count} livres actuellement prêtés',
  'profile.lentTo': 'Prêté à {name}',
  'profile.badgeLent': 'Prêté',
  'profile.duplicates': 'Doublons',
  'profile.duplicatesSummary': '{titles} titre(s) en plusieurs exemplaires · {extra} de trop',
  'profile.share': 'Partage',
  'profile.shareCreate': 'Créer un lien public de ma bibliothèque',
  'profile.shareCopy': 'Copier le lien',
  'profile.shareSend': 'Partager le lien',
  'profile.shareCopied': 'Lien copié ✓',
  'profile.shareHint':
    'Lecture seule. Toute personne disposant du lien voit vos livres (sans vos notes ni vos achats).',
  'profile.data': 'Données',
  'profile.exportOne': 'Exporter en CSV (1 livre)',
  'profile.exportMany': 'Exporter en CSV ({count} livres)',
  'profile.exported': 'Exporté ✓',
  'profile.exportHintWeb':
    'Télécharge un .csv — titre, auteurs, ISBN, éditeur, statut, note, étagères, tags. Ouvrable dans Excel ou Numbers.',
  'profile.exportHintNative':
    'Partage un .csv de toute votre bibliothèque (titre, auteurs, ISBN, statut, note, étagères, tags).',
  'profile.signOut': 'Se déconnecter',
  'profile.account': 'Compte',
  'profile.deleteAccount': 'Supprimer mon compte',
  'profile.deleting': 'Suppression…',
  'profile.deleteConfirmTitle': 'Supprimer le compte',
  'profile.deleteConfirmBody':
    'Cette action est définitive : votre bibliothèque, vos fiches, étagères et cercles seront supprimés.',
  'profile.deleteConfirmAsk': 'Supprimer le compte ?',
  'profile.footer': 'Colophon · votre bibliothèque, vos lectures',

  // Language picker
  'settings.language': 'Langue',
  'settings.languageHint': "S'applique à toute l'application.",

  // Appearance picker
  'settings.appearance': 'Apparence',
  'theme.system': 'Système',
  'theme.light': 'Clair',
  'theme.dark': 'Sombre',

  // Common
  'common.cancel': 'Annuler',
  'common.delete': 'Supprimer',
} as const;

export type TranslationKey = keyof typeof fr;

export const en: Partial<Record<TranslationKey, string>> = {
  'tabs.library': 'Library',
  'tabs.trends': 'Trends',
  'tabs.scan': 'Scan',
  'tabs.exchanges': 'Circles',
  'tabs.profile': 'Profile',

  'auth.tagline': 'Your library, at peace.',
  'auth.email': 'Email',
  'auth.password': 'Password',
  'auth.emailPlaceholder': 'you@example.com',
  'auth.signIn': 'Sign in',
  'auth.noAccount': "Don't have an account yet?",
  'auth.createAccount': 'Create an account',
  'auth.signUpTagline': 'A few seconds, and your books have a home.',
  'auth.checkEmailTitle': 'Check your email',
  'auth.checkEmailBody':
    'A confirmation link was sent to {email}. Click it to activate your account, then sign in.',
  'auth.passwordMin': 'At least 6 characters',
  'auth.createMyAccount': 'Create my account',
  'auth.haveAccount': 'Already have an account?',

  'status.to_read': 'To read',
  'status.reading': 'Reading',
  'status.read': 'Read',
  'status.abandoned': 'Abandoned',

  'profile.book': 'Book',
  'profile.books': 'Books',
  'profile.readInYear': 'Read in {year}',
  'profile.pagesRead': 'Pages read',
  'profile.byStatus': 'By status',
  'profile.differentAuthors': 'Different authors',
  'profile.goalHint': 'Set an annual reading goal and track your reading time — soon.',
  'profile.classification': 'Breakdown',
  'facet.genre': 'Genres',
  'facet.shelf': 'Shelves',
  'facet.tag': 'Tags',
  'facet.decade': 'Decades',
  'facet.language': 'Languages',
  'profile.suggestedShelves': 'Suggested shelves',
  'profile.suggestedShelvesHint':
    'Based on your library. Tap to create the shelf and file its books automatically.',
  'profile.loans': 'On loan',
  'profile.loansOne': '1 book currently on loan',
  'profile.loansMany': '{count} books currently on loan',
  'profile.lentTo': 'Lent to {name}',
  'profile.badgeLent': 'On loan',
  'profile.duplicates': 'Duplicates',
  'profile.duplicatesSummary': '{titles} title(s) with several copies · {extra} extra',
  'profile.share': 'Share',
  'profile.shareCreate': 'Create a public link to my library',
  'profile.shareCopy': 'Copy link',
  'profile.shareSend': 'Share link',
  'profile.shareCopied': 'Link copied ✓',
  'profile.shareHint':
    'Read-only. Anyone with the link sees your books (without your notes or purchases).',
  'profile.data': 'Data',
  'profile.exportOne': 'Export to CSV (1 book)',
  'profile.exportMany': 'Export to CSV ({count} books)',
  'profile.exported': 'Exported ✓',
  'profile.exportHintWeb':
    'Downloads a .csv — title, authors, ISBN, publisher, status, rating, shelves, tags. Opens in Excel or Numbers.',
  'profile.exportHintNative':
    'Shares a .csv of your whole library (title, authors, ISBN, status, rating, shelves, tags).',
  'profile.signOut': 'Sign out',
  'profile.account': 'Account',
  'profile.deleteAccount': 'Delete my account',
  'profile.deleting': 'Deleting…',
  'profile.deleteConfirmTitle': 'Delete account',
  'profile.deleteConfirmBody':
    'This is permanent: your library, entries, shelves and circles will be deleted.',
  'profile.deleteConfirmAsk': 'Delete account?',
  'profile.footer': 'Colophon · your library, your reading',

  'settings.language': 'Language',
  'settings.languageHint': 'Applies across the whole app.',

  'settings.appearance': 'Appearance',
  'theme.system': 'System',
  'theme.light': 'Light',
  'theme.dark': 'Dark',

  'common.cancel': 'Cancel',
  'common.delete': 'Delete',
};

export const dictionaries = { fr, en };
export type Locale = keyof typeof dictionaries;

/** Look up a key in the active locale, falling back to French, then the key. */
export function translate(
  locale: Locale,
  key: TranslationKey,
  vars?: Record<string, string | number>,
): string {
  const dict = dictionaries[locale] as Partial<Record<TranslationKey, string>>;
  let out = dict[key] ?? fr[key] ?? key;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      out = out.split(`{${name}}`).join(String(value));
    }
  }
  return out;
}

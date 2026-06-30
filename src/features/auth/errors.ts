/** Map raw Supabase auth errors to short French messages. Defensive: never echoes a
 *  raw error object, JSON body or 500 response back to the user. */
export function authErrorMessage(raw: unknown): string {
  const message =
    typeof raw === 'string'
      ? raw
      : raw && typeof raw === 'object' && 'message' in raw && typeof raw.message === 'string'
        ? raw.message
        : '';
  const m = message.toLowerCase();

  if (m.includes('invalid login')) return 'E-mail ou mot de passe incorrect.';
  if (m.includes('already registered') || m.includes('already been registered')) {
    return 'Un compte existe déjà avec cet e-mail.';
  }
  if (m.includes('password should be at least')) {
    return 'Le mot de passe doit faire au moins 6 caractères.';
  }
  if (m.includes('unable to validate email') || m.includes('invalid email')) {
    return 'Adresse e-mail invalide.';
  }
  if (m.includes('email not confirmed')) return 'Confirme ton e-mail avant de te connecter.';
  if (m.includes('rate limit')) return 'Trop de tentatives. Réessaie dans un instant.';

  // Server / network / non-human errors — show a clean message, never raw JSON or an object.
  if (
    !message ||
    message.includes('{') ||
    message.includes('http') ||
    message.length > 120 ||
    m.includes('internal server') ||
    m.includes('500') ||
    m.includes('502') ||
    m.includes('503') ||
    m.includes('timeout') ||
    m.includes('failed to fetch') ||
    m.includes('network')
  ) {
    return 'Connexion impossible pour le moment. Réessaie dans un instant.';
  }
  return message;
}

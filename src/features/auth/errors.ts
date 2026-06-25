/** Map raw Supabase auth errors to short French messages. */
export function authErrorMessage(message: string): string {
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
  return message;
}

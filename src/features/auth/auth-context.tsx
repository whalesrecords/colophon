import type { Session } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { env } from '@/lib/env';
import { supabase } from '@/lib/supabase';

interface AuthState {
  session: Session | null;
  initializing: boolean;
  signIn: (email: string, password: string) => ReturnType<typeof supabase.auth.signInWithPassword>;
  signUp: (email: string, password: string) => ReturnType<typeof supabase.auth.signUp>;
  signOut: () => Promise<void>;
  /** Email a password-reset link (lands on the web /reset-password page). */
  resetPassword: (email: string) => ReturnType<typeof supabase.auth.resetPasswordForEmail>;
  /** Set a new password for the (recovery-)authenticated user. */
  updatePassword: (password: string) => ReturnType<typeof supabase.auth.updateUser>;
}

function authRedirectBase(): string {
  // Stable web domain so there is a single URL to allow-list in Supabase Auth
  // (preview deploys rotate their origin). On localhost dev, prefer the running
  // dev server's origin so links come back to it.
  if (
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    /localhost|127\.0\.0\.1/.test(window.location.origin)
  ) {
    return window.location.origin;
  }
  return env.webUrl;
}

function resetRedirectTo(): string {
  return `${authRedirectBase()}/reset-password`;
}

// Where the email-confirmation link lands. Without this, Supabase falls back to the
// project's Site URL (which defaults to http://localhost:3000) — dead on a phone.
function signUpRedirectTo(): string {
  return authRedirectBase();
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setInitializing(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      session,
      initializing,
      signIn: (email, password) =>
        supabase.auth.signInWithPassword({ email: email.trim(), password }),
      signUp: (email, password) =>
        supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: signUpRedirectTo() },
        }),
      signOut: async () => {
        await supabase.auth.signOut();
      },
      resetPassword: (email) =>
        supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: resetRedirectTo() }),
      updatePassword: (password) => supabase.auth.updateUser({ password }),
    }),
    [session, initializing],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

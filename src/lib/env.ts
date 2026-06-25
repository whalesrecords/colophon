/**
 * Public client configuration. Read from EXPO_PUBLIC_* env vars when present,
 * otherwise fall back to the known public values. These are NOT secrets — the
 * Supabase URL and the publishable key are designed to ship in the client
 * bundle (access is gated by RLS) — so a hard-coded fallback is safe and keeps
 * the app from crashing on launch if env injection ever fails in a build.
 */
const FALLBACK_SUPABASE_URL = 'https://bwmhbnozduuoyavqkaha.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'sb_publishable_iyTMZg2N9AsgKEKN-_Favw_prMbfshN';

export const env = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? FALLBACK_SUPABASE_URL,
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? FALLBACK_SUPABASE_ANON_KEY,
} as const;

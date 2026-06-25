/**
 * Public client configuration, read from EXPO_PUBLIC_* env vars at build time.
 * These are embedded in the app bundle — never put secrets here.
 */
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env. Copy .env.example to .env and set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.',
  );
}

export const env = {
  supabaseUrl,
  supabaseAnonKey,
} as const;

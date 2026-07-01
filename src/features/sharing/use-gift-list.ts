import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

// TODO(domain): hardcoded to the Vercel domain so shared links always resolve for
// family/friends. Swap for the real custom domain (or EXPO_PUBLIC_WEB_URL) later.
const SHARE_BASE = 'https://colophon-three.vercel.app';

// The gift_* RPCs are new; cast around the generated-types union (regenerate db
// types to drop this). Args/results are validated at the call sites below.
const rpc = supabase.rpc.bind(supabase) as unknown as (
  fn: string,
  args?: Record<string, unknown>,
) => Promise<{ data: unknown; error: { message: string } | null }>;

export interface GiftBook {
  isbn13: string;
  title: string | null;
  authors: string[] | null;
  cover_url: string | null;
  claimed: boolean;
}

export interface GiftList {
  owner: string | null;
  books: GiftBook[];
}

/** Public URL for a gift list (the wishlist share) — points at the /g/[token] page.
 *  Always the canonical deployed domain (`env.webUrl`), never window.location.origin:
 *  the link is opened by family, so it must not be the sharer's localhost/preview. */
export function giftUrl(token: string): string {
  return `${SHARE_BASE}/g/${token}`;
}

/** Create (or reuse) the caller's wishlist share, returning its token. RLS scopes
 *  the SELECT to the caller, so we only ever find/reuse our own gift list. */
export function useCreateGiftShare(userId: string | undefined) {
  return useMutation({
    mutationFn: async (): Promise<string> => {
      if (!userId) throw new Error('Vous devez être connecté.');
      const existing = await supabase
        .from('shares')
        .select('token')
        .eq('scope', 'wishlist')
        .limit(1)
        .maybeSingle();
      if (existing.data?.token) return existing.data.token;
      const { data, error } = await supabase
        .from('shares')
        .insert({ user_id: userId, scope: 'wishlist' })
        .select('token')
        .single();
      if (error) throw new Error(error.message);
      return (data as { token: string }).token;
    },
  });
}

/** Public read of a gift list by token (no auth) — books + which are already claimed. */
export function useGiftList(token: string | undefined) {
  return useQuery({
    queryKey: ['gift-list', token],
    enabled: !!token,
    retry: false,
    queryFn: async (): Promise<GiftList> => {
      const [books, claims] = await Promise.all([
        rpc('gift_by_token', { p_token: token }),
        rpc('gift_status_by_token', { p_token: token }),
      ]);
      if (books.error) throw new Error('Liste introuvable ou expirée.');
      const rows = (books.data ?? []) as Array<Omit<GiftBook, 'claimed'> & { owner_name: string }>;
      const claimed = new Set(
        ((claims.data ?? []) as Array<{ isbn13: string }>).map((c) => c.isbn13),
      );
      return {
        owner: rows[0]?.owner_name ?? null,
        books: rows.map((b) => ({
          isbn13: b.isbn13,
          title: b.title,
          authors: b.authors,
          cover_url: b.cover_url,
          claimed: claimed.has(b.isbn13),
        })),
      };
    },
  });
}

/** A gift-giver claims a book ("je l'offre"). Returns true if newly claimed,
 *  false if it was already taken. */
export function useClaimGift(token: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (isbn13: string): Promise<boolean> => {
      const { data, error } = await rpc('claim_gift', {
        p_token: token,
        p_isbn13: isbn13,
      });
      if (error) throw new Error(error.message);
      return data as boolean;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gift-list', token] }),
  });
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export interface PlaceMark {
  favorite: boolean;
  visited: boolean;
  note: string | null;
}

export interface PlaceInfo {
  id: string;
  type: string;
  name: string;
  city?: string | null;
}

export interface MyPlace {
  place_id: string;
  place_type: string | null;
  place_name: string | null;
  place_city: string | null;
  favorite: boolean;
  visited: boolean;
  rating: number | null;
  note: string | null;
  updated_at: string;
}

/** The current user's saved places (coups de cœur + visités) with their anecdotes. */
export function useMyPlaces(userId: string | undefined) {
  return useQuery({
    queryKey: ['my-places', userId],
    enabled: !!userId,
    queryFn: async (): Promise<MyPlace[]> => {
      const { data, error } = await supabase
        .from('user_places')
        .select(
          'place_id, place_type, place_name, place_city, favorite, visited, rating, note, updated_at',
        )
        .or('favorite.eq.true,visited.eq.true')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** The current user's marks (coup de cœur / visité) keyed by place id. */
export function useUserPlaces(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-places', userId],
    enabled: !!userId,
    queryFn: async (): Promise<Map<string, PlaceMark>> => {
      const { data, error } = await supabase
        .from('user_places')
        .select('place_id, favorite, visited, note');
      if (error) throw error;
      const map = new Map<string, PlaceMark>();
      for (const r of data ?? [])
        map.set(r.place_id, { favorite: r.favorite, visited: r.visited, note: r.note });
      return map;
    },
  });
}

export function useUserPlaceActions(userId: string | undefined) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['user-places', userId] });
    queryClient.invalidateQueries({ queryKey: ['my-places', userId] });
  };

  const toggle = useMutation({
    mutationFn: async (input: {
      place: PlaceInfo;
      field: 'favorite' | 'visited';
    }): Promise<void> => {
      if (!userId) throw new Error('Vous devez être connecté.');
      const { place, field } = input;
      // Read current row to flip the flag (upsert needs the merged state).
      const { data: existing } = await supabase
        .from('user_places')
        .select('favorite, visited')
        .eq('user_id', userId)
        .eq('place_id', place.id)
        .maybeSingle();
      const next = {
        favorite: existing?.favorite ?? false,
        visited: existing?.visited ?? false,
        [field]: !(existing?.[field] ?? false),
      };
      const { error } = await supabase.from('user_places').upsert(
        {
          user_id: userId,
          place_id: place.id,
          place_type: place.type,
          place_name: place.name,
          place_city: place.city ?? null,
          favorite: next.favorite,
          visited: next.visited,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,place_id' },
      );
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });

  /** Save an anecdote (and optional rating) on a place — upserts the row. */
  const setNote = useMutation({
    mutationFn: async (input: {
      place: PlaceInfo;
      note: string;
      rating?: number | null;
    }): Promise<void> => {
      if (!userId) throw new Error('Vous devez être connecté.');
      const { place } = input;
      const { error } = await supabase.from('user_places').upsert(
        {
          user_id: userId,
          place_id: place.id,
          place_type: place.type,
          place_name: place.name,
          place_city: place.city ?? null,
          note: input.note.trim() || null,
          updated_at: new Date().toISOString(),
          ...(input.rating !== undefined ? { rating: input.rating } : {}),
        },
        { onConflict: 'user_id,place_id' },
      );
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });

  /** Forget a place entirely (clears favorite/visited/note). */
  const remove = useMutation({
    mutationFn: async (placeId: string): Promise<void> => {
      if (!userId) return;
      const { error } = await supabase
        .from('user_places')
        .delete()
        .eq('user_id', userId)
        .eq('place_id', placeId);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });

  return { toggle, setNote, remove };
}

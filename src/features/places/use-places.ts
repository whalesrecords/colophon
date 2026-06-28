import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export interface PlaceMark {
  favorite: boolean;
  visited: boolean;
}

export interface PlaceInfo {
  id: string;
  type: string;
  name: string;
  city?: string | null;
}

/** The current user's marks (coup de cœur / visité) keyed by place id. */
export function useUserPlaces(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-places', userId],
    enabled: !!userId,
    queryFn: async (): Promise<Map<string, PlaceMark>> => {
      const { data, error } = await supabase
        .from('user_places')
        .select('place_id, favorite, visited');
      if (error) throw error;
      const map = new Map<string, PlaceMark>();
      for (const r of data ?? []) map.set(r.place_id, { favorite: r.favorite, visited: r.visited });
      return map;
    },
  });
}

export function useUserPlaceActions(userId: string | undefined) {
  const queryClient = useQueryClient();

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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-places', userId] }),
  });

  return { toggle };
}

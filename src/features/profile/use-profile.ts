import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import type { Database } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export type Profile = Database['public']['Tables']['profiles']['Row'];

/** Public URL for an avatar path, cache-busted on the profile's updated_at. */
export function avatarUrl(path: string | null | undefined, updatedAt?: string | null): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path; // a pasted image URL
  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return updatedAt ? `${data.publicUrl}?v=${encodeURIComponent(updatedAt)}` : data.publicUrl;
}

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['profile', userId],
    enabled: !!userId,
    queryFn: async (): Promise<Profile | null> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId as string)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export interface ProfilePatch {
  display_name?: string | null;
  pseudo?: string | null;
  bio?: string | null;
  avatar_path?: string | null;
}

export function useUpdateProfile(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (patch: ProfilePatch): Promise<void> => {
      if (!userId) throw new Error('Vous devez être connecté.');
      const { error } = await supabase
        .from('profiles')
        .upsert(
          { user_id: userId, ...patch, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' },
        );
      if (error) {
        throw new Error(
          error.message.includes('duplicate') ? 'Ce pseudo est déjà pris.' : error.message,
        );
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile', userId] }),
  });
}

/** Pick a photo, resize to 512², upload to the avatars bucket, save the path. */
export function useUploadAvatar(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<void> => {
      if (!userId) throw new Error('Vous devez être connecté.');
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) throw new Error("Autorisez l'accès aux photos.");

      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
      if (res.canceled || !res.assets?.[0]) return;

      const manip = await ImageManipulator.manipulateAsync(
        res.assets[0].uri,
        [{ resize: { width: 512, height: 512 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
      );
      const blob = await (await fetch(manip.uri)).blob();

      const path = `${userId}/avatar.jpg`;
      const { error } = await supabase.storage
        .from('avatars')
        .upload(path, blob, { upsert: true, contentType: 'image/jpeg' });
      if (error) throw new Error(error.message);

      const { error: pErr } = await supabase
        .from('profiles')
        .upsert(
          { user_id: userId, avatar_path: path, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' },
        );
      if (pErr) throw new Error(pErr.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile', userId] }),
  });
}

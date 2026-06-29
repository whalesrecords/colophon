import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

import type { Database } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export type BookBoxRow = Database['public']['Tables']['book_boxes']['Row'];
export type BookBoxDonation = Database['public']['Tables']['book_box_donations']['Row'];

export interface BookBox extends BookBoxRow {
  donationCount: number;
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Public URL for a book-box photo path. */
export function boxPhotoUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return supabase.storage.from('book-boxes').getPublicUrl(path).data.publicUrl;
}

/** Pick + resize a photo, returning a local preview uri and its base64 (or null). */
export async function pickBoxPhoto(): Promise<{ uri: string; base64: string } | null> {
  if (Platform.OS !== 'web') {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) throw new Error("Autorisez l'accès aux photos dans les réglages.");
  }
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: 'images',
    quality: 0.9,
  });
  if (res.canceled || !res.assets?.[0]) return null;
  const manip = await ImageManipulator.manipulateAsync(
    res.assets[0].uri,
    [{ resize: { width: 1000 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true },
  );
  if (!manip.base64) throw new Error('Image illisible.');
  return { uri: manip.uri, base64: manip.base64 };
}

/** Best-effort current location (web geolocation; native falls back to manual). */
export function getCurrentLocation(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    const geo = typeof navigator !== 'undefined' ? (navigator as Navigator).geolocation : undefined;
    if (!geo) return resolve(null);
    geo.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  });
}

/** All community book boxes, newest first, with a count of books dropped there. */
export function useBookBoxes() {
  return useQuery({
    queryKey: ['book-boxes'],
    queryFn: async (): Promise<BookBox[]> => {
      const { data, error } = await supabase
        .from('book_boxes')
        .select('*, book_box_donations(count)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []).map((b) => {
        const { book_box_donations, ...row } = b as BookBoxRow & {
          book_box_donations?: { count: number }[];
        };
        return { ...row, donationCount: book_box_donations?.[0]?.count ?? 0 };
      });
    },
  });
}

export function useBoxDonations(boxId: string | undefined) {
  return useQuery({
    queryKey: ['box-donations', boxId],
    enabled: !!boxId,
    queryFn: async (): Promise<BookBoxDonation[]> => {
      const { data, error } = await supabase
        .from('book_box_donations')
        .select('*')
        .eq('box_id', boxId as string)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export interface NewBox {
  name: string;
  note?: string | null;
  city?: string | null;
  lat: number;
  lng: number;
  photoBase64?: string | null;
}

export function useAddBox(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: NewBox): Promise<BookBoxRow> => {
      if (!userId) throw new Error('Vous devez être connecté.');
      let photo_path: string | null = null;
      if (input.photoBase64) {
        const path = `${userId}/${Date.now()}.jpg`;
        const { error: upErr } = await supabase.storage
          .from('book-boxes')
          .upload(path, base64ToBytes(input.photoBase64), {
            upsert: true,
            contentType: 'image/jpeg',
          });
        if (upErr) throw new Error(upErr.message);
        photo_path = path;
      }
      const { data, error } = await supabase
        .from('book_boxes')
        .insert({
          created_by: userId,
          name: input.name.trim(),
          note: input.note?.trim() || null,
          city: input.city?.trim() || null,
          lat: input.lat,
          lng: input.lng,
          photo_path,
        })
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['book-boxes'] }),
  });
}

export function useAddDonation(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      boxId: string;
      title: string;
      isbn13?: string | null;
    }): Promise<void> => {
      if (!userId) throw new Error('Vous devez être connecté.');
      const { error } = await supabase.from('book_box_donations').insert({
        box_id: input.boxId,
        user_id: userId,
        title: input.title.trim(),
        isbn13: input.isbn13?.trim() || null,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: (_d, v) => {
      queryClient.invalidateQueries({ queryKey: ['box-donations', v.boxId] });
      queryClient.invalidateQueries({ queryKey: ['book-boxes'] });
    },
  });
}

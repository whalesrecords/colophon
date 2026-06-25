import { useMutation } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

/** Permanently delete the signed-in account and all its data (App Store requirement). */
export function useDeleteAccount() {
  return useMutation({
    mutationFn: async (): Promise<void> => {
      const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
      if (error) throw new Error('La suppression du compte a échoué. Réessayez.');
    },
  });
}

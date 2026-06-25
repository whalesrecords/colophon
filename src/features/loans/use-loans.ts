import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { Database } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export type Loan = Database['public']['Tables']['loans']['Row'];

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useLoans(itemId: string | undefined) {
  return useQuery({
    queryKey: ['loans', itemId],
    enabled: !!itemId,
    queryFn: async (): Promise<Loan[]> => {
      const { data, error } = await supabase
        .from('loans')
        .select('*')
        .eq('item_id', itemId as string)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useLoanActions(itemId: string, userId: string | undefined) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['loans', itemId] });
    queryClient.invalidateQueries({ queryKey: ['library'] });
    queryClient.invalidateQueries({ queryKey: ['book-detail', itemId] });
    queryClient.invalidateQueries({ queryKey: ['stats', userId] });
  };

  const lend = useMutation({
    mutationFn: async ({
      borrower,
      dueOn,
    }: {
      borrower: string;
      dueOn?: string | null;
    }): Promise<void> => {
      const name = borrower.trim();
      if (!name) throw new Error('Indiquez à qui vous prêtez le livre.');
      const { error } = await supabase
        .from('loans')
        .insert({ item_id: itemId, borrower: name, due_on: dueOn || null });
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });

  const markReturned = useMutation({
    mutationFn: async (loanId: string): Promise<void> => {
      const { error } = await supabase
        .from('loans')
        .update({ returned_on: today() })
        .eq('id', loanId);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (loanId: string): Promise<void> => {
      const { error } = await supabase.from('loans').delete().eq('id', loanId);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
  });

  return { lend, markReturned, remove };
}

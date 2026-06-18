import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PesagemRow {
  id: string;
  animal_id: string;
  peso: number;
  data: string;
  gmd: number | null;
  created_at: string | null;
}

export function usePesagens(animalId?: string) {
  return useQuery({
    queryKey: ['pesagens', animalId],
    queryFn: async () => {
      let query = supabase.from('pesagens').select('*').order('data', { ascending: true });
      if (animalId) query = query.eq('animal_id', animalId);
      const { data, error } = await query;
      if (error) throw error;
      return data as PesagemRow[];
    },
  });
}

export function useCreatePesagem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (pesagem: Omit<PesagemRow, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('pesagens').insert(pesagem).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['pesagens'] }); toast.success('Pesagem registrada!'); },
    onError: () => toast.error('Erro ao registrar pesagem'),
  });
}

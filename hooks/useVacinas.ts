import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface VacinaRow {
  id: string;
  animal_id: string;
  nome: string;
  data_aplicacao: string | null;
  data_proxima: string | null;
  status: string;
  created_at: string | null;
}

export function useVacinas() {
  return useQuery({
    queryKey: ['vacinas'],
    queryFn: async () => {
      const { data, error } = await supabase.from('vacinas').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as VacinaRow[];
    },
  });
}

export function useUpdateVacina() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<VacinaRow> & { id: string }) => {
      const { error } = await supabase.from('vacinas').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vacinas'] }); },
    onError: () => toast.error('Erro ao atualizar vacina'),
  });
}

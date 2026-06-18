import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TratamentoRow {
  id: string;
  animal_id: string;
  tipo: string;
  descricao: string;
  diagnostico: string | null;
  medicamento: string | null;
  data_inicio: string;
  data_fim: string | null;
  custo: number;
  status: string;
  observacao: string | null;
  created_at: string | null;
}

export function useTratamentos() {
  return useQuery({
    queryKey: ['tratamentos'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tratamentos' as any).select('*').order('data_inicio', { ascending: false });
      if (error) throw error;
      return data as unknown as TratamentoRow[];
    },
  });
}

export function useCreateTratamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (t: Omit<TratamentoRow, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('tratamentos' as any).insert(t as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tratamentos'] }); toast.success('Tratamento registrado!'); },
    onError: () => toast.error('Erro ao registrar tratamento'),
  });
}

export function useUpdateTratamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TratamentoRow> & { id: string }) => {
      const { error } = await supabase.from('tratamentos' as any).update(updates as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tratamentos'] }); toast.success('Tratamento atualizado!'); },
    onError: () => toast.error('Erro ao atualizar'),
  });
}

export function useDeleteTratamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tratamentos' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tratamentos'] }); toast.success('Tratamento removido!'); },
    onError: () => toast.error('Erro ao remover'),
  });
}

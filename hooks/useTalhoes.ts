import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TalhaoRow {
  id: string;
  nome: string;
  area_hectares: number;
  cultura: string | null;
  data_plantio: string | null;
  previsao_colheita: string | null;
  status: string;
  observacao: string | null;
  created_at: string | null;
}

export function useTalhoes() {
  return useQuery({
    queryKey: ['talhoes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('talhoes' as any).select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as TalhaoRow[];
    },
  });
}

export function useCreateTalhao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (t: Omit<TalhaoRow, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('talhoes' as any).insert(t as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['talhoes'] }); toast.success('Talhão cadastrado!'); },
    onError: () => toast.error('Erro ao cadastrar talhão'),
  });
}

export function useUpdateTalhao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TalhaoRow> & { id: string }) => {
      const { error } = await supabase.from('talhoes' as any).update(updates as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['talhoes'] }); toast.success('Talhão atualizado!'); },
    onError: () => toast.error('Erro ao atualizar talhão'),
  });
}

export function useDeleteTalhao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('talhoes' as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['talhoes'] }); toast.success('Talhão removido!'); },
    onError: () => toast.error('Erro ao remover talhão'),
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface LoteRebanho {
  id: string;
  nome: string;
  descricao: string | null;
  created_at: string | null;
}

export function useLotesRebanho() {
  return useQuery({
    queryKey: ['lotes_rebanho'],
    queryFn: async () => {
      const { data, error } = await supabase.from('lotes_rebanho').select('*').order('nome');
      if (error) throw error;
      return data as LoteRebanho[];
    },
  });
}

export function useCreateLoteRebanho() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (lote: { nome: string; descricao?: string | null }) => {
      const { data, error } = await supabase.from('lotes_rebanho').insert(lote).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['lotes_rebanho'] }); toast.success('Lote criado!'); },
    onError: () => toast.error('Erro ao criar lote'),
  });
}

export function useUpdateLoteRebanho() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LoteRebanho> & { id: string }) => {
      const { error } = await supabase.from('lotes_rebanho').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['lotes_rebanho'] }); toast.success('Lote atualizado!'); },
    onError: () => toast.error('Erro ao atualizar lote'),
  });
}

export function useDeleteLoteRebanho() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('lotes_rebanho').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lotes_rebanho'] });
      qc.invalidateQueries({ queryKey: ['animais'] });
      toast.success('Lote removido!');
    },
    onError: () => toast.error('Erro ao remover lote'),
  });
}
